const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('BargeSearch - Comprehensive Form Behavior Analysis', () => {
    let testReport = {
        testSuite: 'BargeSearch Form Behavior',
        timestamp: new Date().toISOString(),
        baseURL: 'https://localhost:6001/BargeSearch/Index',
        scenarios: []
    };

    let consoleLogs = [];
    let consoleErrors = [];
    let networkRequests = [];
    let networkResponses = [];

    test.beforeEach(async ({ page }) => {
        consoleLogs = [];
        consoleErrors = [];
        networkRequests = [];
        networkResponses = [];

        page.on('console', msg => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                location: msg.location(),
                timestamp: new Date().toISOString()
            };
            consoleLogs.push(logEntry);

            if (msg.type() === 'error' || msg.type() === 'warning') {
                consoleErrors.push(logEntry);
            }
        });

        page.on('pageerror', error => {
            consoleErrors.push({
                type: 'pageerror',
                text: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });

        page.on('request', request => {
            if (request.url().includes('BargeTable') || request.url().includes('Barge')) {
                networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    postData: request.postData(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        page.on('response', async response => {
            if (response.url().includes('BargeTable') || response.url().includes('Barge')) {
                const responseData = {
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText(),
                    timestamp: new Date().toISOString()
                };

                try {
                    const contentType = response.headers()['content-type'];
                    if (contentType && contentType.includes('application/json')) {
                        responseData.body = await response.json();
                    }
                } catch (e) {
                    responseData.bodyError = e.message;
                }

                networkResponses.push(responseData);
            }
        });

        await page.goto('https://localhost:6001/BargeSearch/Index');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
    });

    function captureScenarioResult(scenarioName, description, inputs, observations) {
        const scenario = {
            name: scenarioName,
            description: description,
            inputs: inputs,
            observations: observations,
            consoleLogs: {
                total: consoleLogs.length,
                errors: consoleErrors.length,
                logs: consoleLogs.filter(log =>
                    log.text.includes('[Barge]') ||
                    log.type === 'error' ||
                    log.type === 'warning'
                )
            },
            networkActivity: {
                requests: networkRequests.length,
                responses: networkResponses.length,
                details: networkResponses
            }
        };

        testReport.scenarios.push(scenario);

        console.log('\n========================================');
        console.log(`SCENARIO: ${scenarioName}`);
        console.log('========================================');
        console.log(`Description: ${description}`);
        console.log('\nINPUTS:');
        console.log(JSON.stringify(inputs, null, 2));
        console.log('\nOBSERVATIONS:');
        console.log(JSON.stringify(observations, null, 2));
        console.log('\nCONSOLE LOGS SUMMARY:');
        console.log(`Total logs: ${consoleLogs.length}`);
        console.log(`Errors: ${consoleErrors.length}`);
        console.log('\nRELEVANT CONSOLE LOGS:');
        scenario.consoleLogs.logs.forEach(log => {
            console.log(`[${log.type.toUpperCase()}] ${log.text}`);
        });
        console.log('\nNETWORK ACTIVITY:');
        networkResponses.forEach(resp => {
            console.log(`${resp.method || 'RESPONSE'} ${resp.url} - Status: ${resp.status}`);
            if (resp.body) {
                console.log(`Response data count: ${resp.body.data ? resp.body.data.length : 'N/A'}`);
            }
        });
        console.log('========================================\n');
    }

    test.afterAll(async () => {
        const reportPath = path.join(__dirname, '..', 'test-results', 'BargeSearch_FORM_BEHAVIOR_REPORT.md');

        let markdown = `# BargeSearch Form Behavior Report\n\n`;
        markdown += `**Generated:** ${testReport.timestamp}\n`;
        markdown += `**Base URL:** ${testReport.baseURL}\n`;
        markdown += `**Total Scenarios:** ${testReport.scenarios.length}\n\n`;
        markdown += `---\n\n`;

        testReport.scenarios.forEach((scenario, index) => {
            markdown += `## Scenario ${index + 1}: ${scenario.name}\n\n`;
            markdown += `**Description:** ${scenario.description}\n\n`;

            markdown += `### Inputs\n\`\`\`json\n${JSON.stringify(scenario.inputs, null, 2)}\n\`\`\`\n\n`;

            markdown += `### Observations\n\`\`\`json\n${JSON.stringify(scenario.observations, null, 2)}\n\`\`\`\n\n`;

            markdown += `### Console Logs\n`;
            markdown += `- **Total logs:** ${scenario.consoleLogs.total}\n`;
            markdown += `- **Errors:** ${scenario.consoleLogs.errors}\n\n`;

            if (scenario.consoleLogs.logs.length > 0) {
                markdown += `**Relevant Log Entries:**\n\n`;
                scenario.consoleLogs.logs.forEach(log => {
                    markdown += `- \`[${log.type.toUpperCase()}]\` ${log.text}\n`;
                });
                markdown += `\n`;
            }

            markdown += `### Network Activity\n`;
            markdown += `- **Requests:** ${scenario.networkActivity.requests}\n`;
            markdown += `- **Responses:** ${scenario.networkActivity.responses}\n\n`;

            if (scenario.networkActivity.details.length > 0) {
                markdown += `**Response Details:**\n\n`;
                scenario.networkActivity.details.forEach(resp => {
                    markdown += `- **URL:** ${resp.url}\n`;
                    markdown += `- **Status:** ${resp.status} ${resp.statusText}\n`;
                    if (resp.body && resp.body.recordsTotal !== undefined) {
                        markdown += `- **Records Total:** ${resp.body.recordsTotal}\n`;
                        markdown += `- **Records Filtered:** ${resp.body.recordsFiltered}\n`;
                        markdown += `- **Data Count:** ${resp.body.data ? resp.body.data.length : 0}\n`;
                    }
                    markdown += `\n`;
                });
            }

            markdown += `---\n\n`;
        });

        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, markdown);

        console.log('\n========================================');
        console.log('FINAL REPORT GENERATED');
        console.log('========================================');
        console.log(`Report saved to: ${reportPath}`);
        console.log(`Total scenarios tested: ${testReport.scenarios.length}`);
        console.log('========================================\n');
    });

    test('Scenario 1: Empty Submission - All Fields Blank', async ({ page }) => {
        const scenarioName = 'Empty Submission';
        const description = 'Submit the search form with all text fields empty and only default values. This tests whether the form allows empty searches and what default behavior occurs.';

        const findButton = page.locator('#btnSearch');
        const activeOnlySelect = page.locator('#ActiveOnly');
        const activeOnlyInitial = await activeOnlySelect.inputValue();

        const inputs = {
            Name: '',
            Description: '',
            BargeGroup: '',
            ActiveOnly: activeOnlyInitial,
            CdcOnly: '',
            CoverRequiredOnly: ''
        };

        await findButton.click();
        await page.waitForTimeout(3000);

        const resultsTable = page.locator('#bargeTable');
        const tableVisible = await resultsTable.count() > 0;
        let rowCount = 0;
        let noDataMessage = '';

        if (tableVisible) {
            await page.waitForTimeout(2000);
            rowCount = await page.locator('#bargeTable tbody tr').count();

            if (rowCount > 0) {
                const firstCell = await page.locator('#bargeTable tbody tr td').first();
                noDataMessage = await firstCell.textContent();
            }
        }

        const observations = {
            formSubmitted: true,
            resultsTableVisible: tableVisible,
            rowCount: rowCount,
            noDataMessage: noDataMessage,
            searchPerformed: networkResponses.length > 0,
            errorDisplayed: await page.locator('.alert-danger, .alert-warning').count() > 0,
            validationErrors: await page.locator('.field-validation-error').count()
        };

        await page.screenshot({ path: 'test-results/barge-scenario1-empty-submission.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 2: Search by Barge Name - Exact Match', async ({ page }) => {
        const scenarioName = 'Search by Name - Exact Match';
        const description = 'Search for a barge by exact name match to verify search functionality works correctly.';

        const nameInput = page.locator('#Name');
        const findButton = page.locator('#btnSearch');

        const inputs = {
            Name: 'PWTEST',
            Description: '',
            ActiveOnly: 'true'
        };

        await nameInput.fill(inputs.Name);
        await page.waitForTimeout(500);

        await findButton.click();
        await page.waitForTimeout(3000);

        const rowCount = await page.locator('#bargeTable tbody tr').count();
        const tableData = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('#bargeTable tbody tr'));
            return rows.map(row => {
                const cells = Array.from(row.querySelectorAll('td'));
                return cells.map(cell => cell.textContent.trim());
            });
        });

        const observations = {
            formSubmitted: networkRequests.length > 0,
            serverResponse: networkResponses.length > 0,
            rowCount: rowCount,
            resultsContainSearchTerm: tableData.some(row => row.some(cell => cell.includes('PWTEST'))),
            errorDisplayed: await page.locator('.alert-danger, .alert-warning').count() > 0
        };

        await page.screenshot({ path: 'test-results/barge-scenario2-exact-match.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 3: Search by Barge Name - Partial Match', async ({ page }) => {
        const scenarioName = 'Search by Name - Partial Match';
        const description = 'Search for commodities using partial name match to verify wildcard search functionality.';

        const nameInput = page.locator('#Name');
        const findButton = page.locator('#btnSearch');

        const inputs = {
            Name: 'PWTEST',
            Description: '',
            ActiveOnly: 'true'
        };

        await nameInput.fill(inputs.Name);
        await page.waitForTimeout(500);

        await findButton.click();
        await page.waitForTimeout(3000);

        const rowCount = await page.locator('#bargeTable tbody tr').count();

        const observations = {
            formSubmitted: networkRequests.length > 0,
            serverResponse: networkResponses.length > 0,
            rowCount: rowCount,
            partialMatchResults: rowCount > 0,
            errorDisplayed: await page.locator('.alert-danger, .alert-warning').count() > 0
        };

        await page.screenshot({ path: 'test-results/barge-scenario3-partial-match.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 4: Search by Description', async ({ page }) => {
        const scenarioName = 'Search by Description';
        const description = 'Search for commodities by description to verify description-based search functionality.';

        const descriptionInput = page.locator('#Description');
        const findButton = page.locator('#btnSearch');

        const inputs = {
            Name: '',
            Description: 'PWTEST',
            ActiveOnly: 'true'
        };

        await descriptionInput.fill(inputs.Description);
        await page.waitForTimeout(500);

        await findButton.click();
        await page.waitForTimeout(3000);

        const rowCount = await page.locator('#bargeTable tbody tr').count();

        const observations = {
            formSubmitted: networkRequests.length > 0,
            serverResponse: networkResponses.length > 0,
            rowCount: rowCount,
            errorDisplayed: await page.locator('.alert-danger, .alert-warning').count() > 0
        };

        await page.screenshot({ path: 'test-results/barge-scenario4-description.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 5: Active Only Filter', async ({ page }) => {
        const scenarioName = 'Active Only Filter';
        const description = 'Test the Active Only filter by toggling between Yes and No to verify filter behavior.';

        const activeOnlySelect = page.locator('#ActiveOnly');
        const findButton = page.locator('#btnSearch');

        // Test with Active Only = Yes
        await activeOnlySelect.selectOption('true');
        await page.waitForTimeout(500);
        await findButton.click();
        await page.waitForTimeout(3000);

        const activeOnlyRowCount = await page.locator('#bargeTable tbody tr').count();

        // Test with Active Only = No
        await activeOnlySelect.selectOption('false');
        await page.waitForTimeout(500);
        await findButton.click();
        await page.waitForTimeout(3000);

        const allRowCount = await page.locator('#bargeTable tbody tr').count();

        const inputs = {
            Name: '',
            Description: '',
            ActiveOnly: 'true then false'
        };

        const observations = {
            activeOnlyResults: activeOnlyRowCount,
            allResults: allRowCount,
            filterWorking: allRowCount >= activeOnlyRowCount,
            formSubmitted: networkRequests.length > 0
        };

        await page.screenshot({ path: 'test-results/barge-scenario5-active-filter.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 6: DataTable Pagination', async ({ page }) => {
        const scenarioName = 'DataTable Pagination';
        const description = 'Test DataTable pagination controls to verify pagination works correctly when there are multiple pages of results.';

        const findButton = page.locator('#btnSearch');
        await findButton.click();
        await page.waitForTimeout(3000);

        // Wait for DataTable to initialize
        await page.waitForSelector('#bargeTable', { state: 'visible' });
        await page.waitForTimeout(2000);

        const paginationControls = page.locator('#bargeTable_paginate');
        const hasPagination = await paginationControls.count() > 0;

        let canNavigatePages = false;
        if (hasPagination) {
            const nextButton = paginationControls.locator('.paginate_button.next');
            const nextButtonExists = await nextButton.count() > 0;
            const nextButtonDisabled = nextButtonExists ? await nextButton.getAttribute('class') : null;
            canNavigatePages = nextButtonExists && !nextButtonDisabled?.includes('disabled');
        }

        const inputs = {
            Name: '',
            Description: '',
            ActiveOnly: 'true'
        };

        const observations = {
            paginationControlsVisible: hasPagination,
            canNavigatePages: canNavigatePages,
            tableInitialized: await page.locator('#bargeTable').count() > 0
        };

        await page.screenshot({ path: 'test-results/barge-scenario6-pagination.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 7: DataTable Sorting', async ({ page }) => {
        const scenarioName = 'DataTable Sorting';
        const description = 'Test DataTable column sorting by clicking column headers to verify sorting functionality.';

        const findButton = page.locator('#btnSearch');
        await findButton.click();
        await page.waitForTimeout(3000);

        await page.waitForSelector('#bargeTable', { state: 'visible' });
        await page.waitForTimeout(2000);

        // Try clicking on Name column header
        const nameHeader = page.locator('#bargeTable thead th').nth(2); // Name column
        const headerExists = await nameHeader.count() > 0;

        if (headerExists) {
            await nameHeader.click();
            await page.waitForTimeout(2000);
        }

        const inputs = {
            Name: '',
            Description: '',
            ActiveOnly: 'true'
        };

        const observations = {
            columnHeadersVisible: headerExists,
            sortingTriggered: networkResponses.length > 0,
            tableStillFunctional: await page.locator('#bargeTable').count() > 0
        };

        await page.screenshot({ path: 'test-results/barge-scenario7-sorting.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 8: SQL Injection & XSS Attempts', async ({ page }) => {
        const scenarioName = 'Security Testing - SQL Injection & XSS';
        const description = 'Attempt to inject malicious SQL and JavaScript code to verify that inputs are properly sanitized and escaped.';

        const nameInput = page.locator('#Name');
        const descriptionInput = page.locator('#Description');
        const findButton = page.locator('#btnSearch');

        const inputs = {
            Name: "'; DROP TABLE Commodities; --",
            Description: "<script>alert('XSS')</script>",
            ActiveOnly: 'true'
        };

        await nameInput.fill(inputs.Name);
        await descriptionInput.fill(inputs.Description);
        await page.waitForTimeout(500);

        await findButton.click();
        await page.waitForTimeout(3000);

        const pageContent = await page.content();
        const hasUnescapedScript = pageContent.includes('<script>alert(');
        const hasScriptExecuted = await page.evaluate(() => {
            return window.xssTestExecuted === true;
        });

        const observations = {
            sqlInjectionAttempt: inputs.Name,
            xssAttempt: inputs.Description,
            formSubmitted: networkRequests.length > 0,
            serverResponse: networkResponses.length > 0,
            xssVulnerability: {
                unescapedScriptInDOM: hasUnescapedScript,
                scriptExecuted: hasScriptExecuted
            },
            serverError: await page.locator('.alert-danger').count() > 0,
            rowCount: await page.locator('#bargeTable tbody tr').count(),
            potentialVulnerability: hasUnescapedScript || hasScriptExecuted
        };

        await page.screenshot({ path: 'test-results/barge-scenario8-security-testing.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 9: Rapid Form Submission - Multiple Clicks', async ({ page }) => {
        const scenarioName = 'Rapid Form Submission';
        const description = 'Click the Search button multiple times rapidly to test if the application prevents duplicate submissions and handles concurrent requests properly.';

        const nameInput = page.locator('#Name');
        const findButton = page.locator('#btnSearch');

        const inputs = {
            Name: 'TEST',
            Description: '',
            ActiveOnly: 'true'
        };

        await nameInput.fill(inputs.Name);

        const initialRequestCount = networkRequests.length;

        await findButton.click();
        await findButton.click();
        await findButton.click();
        await findButton.click();
        await findButton.click();

        await page.waitForTimeout(4000);

        const finalRequestCount = networkRequests.length;
        const requestsCreated = finalRequestCount - initialRequestCount;

        const observations = {
            rapidClicks: 5,
            networkRequestsCreated: requestsCreated,
            multipleSubmissionsPrevented: requestsCreated <= 1,
            buttonDisabled: await findButton.isDisabled().catch(() => false),
            serverResponses: networkResponses.length,
            errorDisplayed: await page.locator('.alert-danger, .alert-warning').count() > 0,
            rowCount: await page.locator('#bargeTable tbody tr').count(),
            potentialIssue: requestsCreated > 1
        };

        await page.screenshot({ path: 'test-results/barge-scenario9-rapid-submission.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });
});

