#!/usr/bin/env node
/**
 * Jira Test Reporter - Automated Playwright Test Results Poster
 *
 * This script runs Playwright tests for specific modules and automatically
 * posts test evidence to corresponding Jira tickets, including:
 * - Test execution summary
 * - Individual test results with pass/fail status
 * - HTML test report attachment
 * - Screenshots for failed tests
 *
 * Usage:
 *   node jira-test-reporter.js <module> [options]
 *
 * Examples:
 *   node jira-test-reporter.js customer
 *   node jira-test-reporter.js all
 *   node jira-test-reporter.js customer --dry-run
 *   node jira-test-reporter.js commodity --skip-tests
 *
 * Options:
 *   --dry-run      Show what would be posted without posting
 *   --skip-tests   Use existing test results without re-running tests
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG_PATH = path.join(__dirname, 'test-config.json');
const PLAYWRIGHT_DIR = path.join(__dirname, '../tests/playwright');
const RESULTS_PATH = path.join(PLAYWRIGHT_DIR, 'test-results/results.json');
const REPORT_PATH = path.join(PLAYWRIGHT_DIR, 'playwright-report/index.html');
const ENV_PATH = path.join(__dirname, '..', '.env.atlassian');

// Jira Configuration (loaded from .env.atlassian)
let jiraConfig = {
    url: '',
    username: '',
    apiToken: '',
    sslVerify: true
};

// Load configuration
let config = {};
try {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
} catch (error) {
    console.error(`Error loading config from ${CONFIG_PATH}:`);
    console.error(error.message);
    process.exit(1);
}

// Load Jira credentials from .env.atlassian
function loadJiraConfig() {
    try {
        if (fs.existsSync(ENV_PATH)) {
            const envContent = fs.readFileSync(ENV_PATH, 'utf8');
            const lines = envContent.split('\n');
            
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const [key, ...valueParts] = trimmed.split('=');
                    const trimmedKey = key.trim();
                    const value = valueParts.join('=').trim();
                    
                    if (trimmedKey === 'JIRA_URL') jiraConfig.url = value;
                    if (trimmedKey === 'JIRA_USERNAME') jiraConfig.username = value;
                    if (trimmedKey === 'JIRA_API_TOKEN') jiraConfig.apiToken = value;
                    if (trimmedKey === 'JIRA_SSL_VERIFY') jiraConfig.sslVerify = value.toLowerCase() !== 'false';
                }
            });
        } else {
            console.warn(`⚠ Warning: ${ENV_PATH} not found. Jira posting will be disabled.`);
            console.warn('   Create .env.atlassian with JIRA_URL, JIRA_USERNAME, and JIRA_API_TOKEN');
        }
    } catch (error) {
        console.warn(`⚠ Warning: Could not load Jira config: ${error.message}`);
    }
}

// Load Jira config on startup
loadJiraConfig();

/**
 * Run Playwright tests for a specific module
 * @param {string} modulePattern - e.g., 'customer', 'commodity', 'barge', 'all'
 */
async function runPlaywrightTests(modulePattern) {
    console.log('\n========================================');
    console.log('RUNNING PLAYWRIGHT TESTS');
    console.log('========================================');

    const pattern = modulePattern === 'all'
        ? '*.spec.js'
        : `${modulePattern}.*.spec.js`;

    const command = `node_modules\\.bin\\playwright test ${pattern} --reporter=json,html`;

    console.log(`Module: ${modulePattern}`);
    console.log(`Pattern: ${pattern}`);
    console.log(`Command: ${command}\n`);

    try {
        const originalDir = process.cwd();
        process.chdir(PLAYWRIGHT_DIR);
        execSync(command, { stdio: 'inherit' });
        process.chdir(originalDir);
        console.log('\n✓ Tests completed');
    } catch (error) {
        process.chdir(originalDir);
        console.error('\n✗ Tests failed or had errors');
        // Don't exit - we still want to report the results
    }
}

/**
 * Parse JSON test results from Playwright
 * @param {string} jsonPath - Path to results.json
 * @returns {Object} Parsed test results with summary
 */
function parseTestResults(jsonPath) {
    console.log('\n========================================');
    console.log('PARSING TEST RESULTS');
    console.log('========================================');

    if (!fs.existsSync(jsonPath)) {
        throw new Error(`Test results not found at ${jsonPath}`);
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // Extract test details from Playwright results structure
    const tests = [];
    let totalPassed = 0;
    let totalFailed = 0;

    if (data.suites) {
        data.suites.forEach(suite => {
            if (suite.specs) {
                suite.specs.forEach(spec => {
                    const test = {
                        title: spec.title,
                        file: spec.file,
                        ok: spec.ok,
                        duration: 0
                    };

                    // Get duration from first test result
                    if (spec.tests && spec.tests.length > 0) {
                        const firstTest = spec.tests[0];
                        if (firstTest.results && firstTest.results.length > 0) {
                            test.duration = firstTest.results[0].duration || 0;
                        }
                    }

                    tests.push(test);

                    if (test.ok) {
                        totalPassed++;
                    } else {
                        totalFailed++;
                    }
                });
            }
        });
    }

    const summary = {
        total: tests.length,
        passed: totalPassed,
        failed: totalFailed,
        duration: data.duration || 0,
        tests: tests
    };

    console.log(`Total tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Duration: ${(summary.duration / 1000).toFixed(2)}s`);

    return summary;
}

/**
 * Group tests by Jira ticket using config mapping
 * @param {Object} results - Parsed test results
 * @param {string} module - Module name (customer, commodity, barge)
 * @returns {Object} Map of ticket keys to test arrays
 */
function groupTestsByTicket(results, module) {
    console.log('\n========================================');
    console.log('GROUPING TESTS BY JIRA TICKET');
    console.log('========================================');

    const ticketMap = {};

    results.tests.forEach(test => {
        const fileName = path.basename(test.file);
        const ticketKey = config.testFileToTicket[fileName];

        if (ticketKey) {
            if (!ticketMap[ticketKey]) {
                ticketMap[ticketKey] = [];
            }
            ticketMap[ticketKey].push(test);
        } else {
            console.warn(`⚠ No Jira ticket mapping found for: ${fileName}`);
        }
    });

    console.log(`Found ${Object.keys(ticketMap).length} tickets with test evidence:\n`);
    Object.keys(ticketMap).forEach(key => {
        console.log(`  ${key}: ${ticketMap[key].length} test(s)`);
    });

    return ticketMap;
}

/**
 * Format test results as Jira Wiki markup
 * @param {Array} tests - Array of test objects
 * @param {Object} results - Overall results summary
 * @returns {string} Formatted Jira Wiki markup
 */
function formatJiraComment(tests, results) {
    const timestamp = new Date().toISOString();
    const passed = tests.filter(t => t.ok).length;
    const failed = tests.filter(t => !t.ok).length;
    const passRate = ((passed / tests.length) * 100).toFixed(1);

    let comment = `h3. 🤖 Automated Test Evidence\n\n`;
    comment += `*Test Run:* ${timestamp}\n`;
    comment += `*Total Tests:* ${tests.length}\n`;
    comment += `*Passed:* {color:green}✓ ${passed}{color}\n`;
    comment += `*Failed:* {color:red}✗ ${failed}{color}\n`;
    comment += `*Pass Rate:* ${passRate}%\n`;
    comment += `*Duration:* ${(results.duration / 1000).toFixed(2)}s\n\n`;

    comment += `h4. Test Details\n\n`;

    tests.forEach(test => {
        const status = test.ok ? '{color:green}✓{color}' : '{color:red}✗{color}';
        const fileName = path.basename(test.file, '.spec.js');
        const duration = (test.duration / 1000).toFixed(2);
        comment += `* ${status} *${test.title}*\n`;
        comment += `** File: {{${fileName}}}\n`;
        comment += `** Duration: ${duration}s\n\n`;
    });

    comment += `{panel:title=📊 View Detailed Report}\n`;
    comment += `See attached HTML report for:\n`;
    comment += `* Full test execution logs\n`;
    comment += `* Screenshots of test steps\n`;
    comment += `* Network request/response details\n`;
    comment += `* Console logs and errors\n`;
    comment += `{panel}\n\n`;

    comment += `_Generated by Playwright Test Automation_\n`;

    return comment;
}

/**
 * Make HTTP request to Jira API
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} endpoint - API endpoint (e.g., '/rest/api/3/issue/BOPS-1234/comment')
 * @param {Object} data - Request body data (optional)
 * @param {Object} headers - Additional headers (optional)
 * @returns {Promise<Object>} Response data
 */
function jiraApiRequest(method, endpoint, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, jiraConfig.url);
        
        const auth = Buffer.from(`${jiraConfig.username}:${jiraConfig.apiToken}`).toString('base64');
        
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname + url.search,
            method: method,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...headers
            },
            rejectUnauthorized: jiraConfig.sslVerify
        };

        if (data) {
            const jsonData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(jsonData);
        }

        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsed = responseData ? JSON.parse(responseData) : {};
                        resolve(parsed);
                    } catch (e) {
                        resolve(responseData);
                    }
                } else {
                    reject(new Error(`Jira API error: ${res.statusCode} ${res.statusMessage}\n${responseData}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        // Add timeout handling (30 seconds)
        req.setTimeout(30000);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout after 30 seconds'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

/**
 * Post comment to Jira issue
 * @param {string} issueKey - Jira issue key (e.g., BOPS-1234)
 * @param {string} commentBody - Comment text (Wiki markup)
 * @returns {Promise<void>}
 */
async function postJiraComment(issueKey, commentBody) {
    const endpoint = `/rest/api/3/issue/${issueKey}/comment`;
    
    // Convert Wiki markup to ADF (Atlassian Document Format)
    // Split by newlines and create paragraphs, handling headers and lists
    const lines = commentBody.split('\n');
    const content = [];
    let currentList = null;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (currentList) {
                content.push(currentList);
                currentList = null;
            }
            continue;
        }

        // Handle headers
        if (trimmed.startsWith('h3.')) {
            if (currentList) {
                content.push(currentList);
                currentList = null;
            }
            content.push({
                type: 'heading',
                attrs: { level: 3 },
                content: [{ type: 'text', text: trimmed.substring(3).trim() }]
            });
        } else if (trimmed.startsWith('h4.')) {
            if (currentList) {
                content.push(currentList);
                currentList = null;
            }
            content.push({
                type: 'heading',
                attrs: { level: 4 },
                content: [{ type: 'text', text: trimmed.substring(3).trim() }]
            });
        } else if (trimmed.startsWith('*') && !trimmed.startsWith('**')) {
            // Bullet point
            if (!currentList) {
                currentList = {
                    type: 'bulletList',
                    content: []
                };
            }
            currentList.content.push({
                type: 'listItem',
                content: [{
                    type: 'paragraph',
                    content: [{ type: 'text', text: trimmed.substring(1).trim() }]
                }]
            });
        } else {
            // Regular paragraph
            if (currentList) {
                content.push(currentList);
                currentList = null;
            }
            content.push({
                type: 'paragraph',
                content: [{ type: 'text', text: trimmed }]
            });
        }
    }

    if (currentList) {
        content.push(currentList);
    }

    // Ensure at least one paragraph
    if (content.length === 0) {
        content.push({
            type: 'paragraph',
            content: [{ type: 'text', text: 'Test evidence posted' }]
        });
    }

    const data = {
        body: {
            type: 'doc',
            version: 1,
            content: content
        }
    };

    await jiraApiRequest('POST', endpoint, data);
}

/**
 * Post attachment to Jira issue
 * @param {string} issueKey - Jira issue key
 * @param {string} filePath - Path to file to attach
 * @param {string} fileName - Optional filename (defaults to basename of filePath)
 * @returns {Promise<void>}
 */
async function postJiraAttachment(issueKey, filePath, fileName = null) {
    return new Promise((resolve, reject) => {
        // Check file exists before reading
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠ File not found: ${filePath}`);
            return reject(new Error(`File not found: ${filePath}`));
        }

        const url = new URL(`/rest/api/3/issue/${issueKey}/attachments`, jiraConfig.url);
        const auth = Buffer.from(`${jiraConfig.username}:${jiraConfig.apiToken}`).toString('base64');

        const fileData = fs.readFileSync(filePath);
        const fileBaseName = fileName || path.basename(filePath);
        
        // Create multipart form data
        const boundary = `----WebKitFormBoundary${Date.now()}`;
        let formData = `--${boundary}\r\n`;
        formData += `Content-Disposition: form-data; name="file"; filename="${fileBaseName}"\r\n`;
        formData += `Content-Type: application/octet-stream\r\n\r\n`;
        
        const options = {
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'X-Atlassian-Token': 'no-check',
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(formData) + fileData.length + Buffer.byteLength(`\r\n--${boundary}--\r\n`)
            },
            rejectUnauthorized: jiraConfig.sslVerify
        };

        const client = url.protocol === 'https:' ? https : http;
        const req = client.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                } else {
                    reject(new Error(`Jira attachment error: ${res.statusCode} ${res.statusMessage}\n${responseData}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        // Add timeout handling (30 seconds)
        req.setTimeout(30000);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Attachment upload timeout after 30 seconds'));
        });

        // Write form data
        req.write(formData);
        req.write(fileData);
        req.write(`\r\n--${boundary}--\r\n`);
        req.end();
    });
}

/**
 * Find screenshot files for failed tests
 * @param {Object} test - Test object
 * @returns {string|null} Path to screenshot file or null
 */
function findScreenshotForTest(test) {
    const testResultsDir = path.join(PLAYWRIGHT_DIR, 'test-results');

    if (!fs.existsSync(testResultsDir)) {
        return null;
    }

    // Playwright creates directories named after the test file
    // Look for screenshots in those directories
    const testFileName = path.basename(test.file, '.spec.js');

    // Normalize test title for matching (remove special chars, lowercase)
    const testTitle = test.title ? test.title.replace(/[^a-z0-9]/gi, '-').toLowerCase() : '';

    try {
        const dirs = fs.readdirSync(testResultsDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const dir of dirs) {
            // Only check directories related to this test file
            if (!dir.includes(testFileName)) {
                continue;
            }

            const dirPath = path.join(testResultsDir, dir);
            const files = fs.readdirSync(dirPath);

            // Look for PNG files (screenshots) that match test title
            const screenshots = files.filter(f => {
                if (!f.endsWith('.png')) return false;

                // Try to match screenshot filename to test title
                const normalizedFilename = f.replace(/[^a-z0-9]/gi, '-').toLowerCase();
                return testTitle && normalizedFilename.includes(testTitle.substring(0, 20));
            });

            if (screenshots.length > 0) {
                // Return the best match (first matching screenshot)
                return path.join(dirPath, screenshots[0]);
            }

            // Fallback: if no title match, return first screenshot in matching directory
            const anyScreenshots = files.filter(f => f.endsWith('.png'));
            if (anyScreenshots.length > 0) {
                return path.join(dirPath, anyScreenshots[0]);
            }
        }
    } catch (error) {
        console.warn(`Could not search for screenshots: ${error.message}`);
    }

    return null;
}

/**
 * Post test evidence to Jira ticket
 * @param {string} issueKey - Jira issue key (e.g., BOPS-1234)
 * @param {Array} tests - Array of test objects
 * @param {Object} results - Overall results summary
 * @param {boolean} dryRun - If true, only show what would be posted
 */
async function postTestEvidence(issueKey, tests, results, dryRun = false) {
    console.log(`\n----------------------------------------`);
    console.log(`${dryRun ? '[DRY RUN] ' : ''}Posting evidence to ${issueKey}`);
    console.log(`----------------------------------------`);

    const comment = formatJiraComment(tests, results);

    if (dryRun) {
        console.log('\n[COMMENT PREVIEW]');
        console.log(comment);
        console.log('\n[ATTACHMENTS]');

        if (fs.existsSync(REPORT_PATH)) {
            console.log(`  ✓ Would attach: ${REPORT_PATH}`);
        } else {
            console.log(`  ⚠ Report not found: ${REPORT_PATH}`);
        }

        const failures = tests.filter(t => !t.ok);
        for (const failure of failures) {
            const screenshotPath = findScreenshotForTest(failure);
            if (screenshotPath) {
                console.log(`  ✓ Would attach screenshot: ${path.basename(screenshotPath)}`);
            }
        }

        return;
    }

    // Post comment to Jira using REST API
    if (!jiraConfig.url || !jiraConfig.username || !jiraConfig.apiToken) {
        console.log('⚠ Jira credentials not configured. Skipping actual post.');
        console.log('   Configure .env.atlassian with JIRA_URL, JIRA_USERNAME, and JIRA_API_TOKEN');
        console.log('\nPreview of what would be posted:');
        console.log(comment);
        return;
    }

    try {
        // Post comment
        await postJiraComment(issueKey, comment);
        console.log(`  ✓ Comment posted to ${issueKey}`);

        // Attach HTML report
        if (fs.existsSync(REPORT_PATH)) {
            await postJiraAttachment(issueKey, REPORT_PATH, 'test-report.html');
            console.log(`  ✓ HTML report attached`);
        }

        // Attach screenshots for failures
        const failures = tests.filter(t => !t.ok);
        for (const failure of failures) {
            const screenshotPath = findScreenshotForTest(failure);
            if (screenshotPath && fs.existsSync(screenshotPath)) {
                await postJiraAttachment(issueKey, screenshotPath);
                console.log(`  ✓ Screenshot attached: ${path.basename(screenshotPath)}`);
            }
        }

        console.log(`  ✓ All evidence posted to ${issueKey}`);
    } catch (error) {
        console.error(`  ✗ Error posting to Jira: ${error.message}`);
        throw error;
    }
}

/**
 * Main execution function
 * @param {string} module - Module to test (customer, commodity, barge, all)
 * @param {Object} options - Options object
 */
async function reportTestsToJira(module, options = {}) {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║   JIRA TEST REPORTER                  ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log(`\nModule: ${module}`);
    console.log(`Dry run: ${options.dryRun || false}`);
    console.log(`Skip tests: ${options.skipTests || false}\n`);

    try {
        // Step 1: Run tests (unless skipped)
        if (!options.skipTests) {
            await runPlaywrightTests(module);
        } else {
            console.log('\n⊳ Skipping test execution (using existing results)');
        }

        // Step 2: Parse results
        const results = parseTestResults(RESULTS_PATH);

        // Step 3: Group by ticket
        const ticketMap = groupTestsByTicket(results, module);

        if (Object.keys(ticketMap).length === 0) {
            console.log('\n⚠ No test-to-ticket mappings found');
            console.log('   Check test-config.json for mappings');
            return;
        }

        // Step 4: Post to Jira (or show preview if dry run)
        for (const [ticketKey, tests] of Object.entries(ticketMap)) {
            await postTestEvidence(ticketKey, tests, results, options.dryRun);
        }

        console.log('\n========================================');
        console.log(options.dryRun ? 'DRY RUN COMPLETE' : '✓ ALL EVIDENCE POSTED');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n========================================');
        console.error('ERROR');
        console.error('========================================');
        console.error(error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
Jira Test Reporter - Automated Playwright Test Results Poster

Usage:
  node jira-test-reporter.js <module> [options]

Modules:
  customer    Run tests for Customer module only
  commodity   Run tests for Commodity module only
  barge       Run tests for Barge module only
  all         Run tests for all modules

Options:
  --dry-run       Show what would be posted without actually posting to Jira
  --skip-tests    Use existing test results without re-running tests
  --help, -h      Show this help message

Examples:
  node jira-test-reporter.js customer
  node jira-test-reporter.js all --dry-run
  node jira-test-reporter.js commodity --skip-tests

Notes:
  - Test results must exist at: tests/playwright/test-results/results.json
  - Jira ticket mappings are configured in: scripts/test-config.json
  - Jira MCP must be configured in Claude Code for actual posting
        `);
        process.exit(0);
    }

    const module = args[0];
    const dryRun = args.includes('--dry-run');
    const skipTests = args.includes('--skip-tests');

    reportTestsToJira(module, { dryRun, skipTests });
}

module.exports = { reportTestsToJira, parseTestResults, formatJiraComment };
