const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('CommodityCreate - Comprehensive Form Behavior Analysis', () => {
    let testReport = {
        testSuite: 'CommodityCreate Form Behavior',
        timestamp: new Date().toISOString(),
        baseURL: 'https://localhost:6001/Commodity/Create',
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
            if (request.url().includes('Commodity')) {
                networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    postData: request.postData(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        page.on('response', async response => {
            if (response.url().includes('Commodity')) {
                const responseData = {
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText(),
                    timestamp: new Date().toISOString()
                };

                try {
                    const contentType = response.headers()['content-type'];
                    if (contentType && contentType.includes('text/html')) {
                        const body = await response.text();
                        responseData.containsValidationErrors = body.includes('validation-summary-errors') ||
                            body.includes('field-validation-error') ||
                            body.includes('alert-danger');
                        responseData.bodyLength = body.length;
                    } else if (contentType && contentType.includes('application/json')) {
                        responseData.body = await response.json();
                    }
                } catch (e) {
                    responseData.bodyError = e.message;
                }

                networkResponses.push(responseData);
            }
        });

        await page.goto('https://localhost:6001/Commodity/Create');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
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
                    log.text.includes('[Commodity]') ||
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
        scenario.consoleLogs.logs.slice(-15).forEach(log => {
            console.log(`[${log.type.toUpperCase()}] ${log.text}`);
        });
        console.log('\nNETWORK ACTIVITY:');
        networkResponses.forEach(resp => {
            console.log(`${resp.method || 'RESPONSE'} ${resp.url} - Status: ${resp.status}`);
        });
        console.log('========================================\n');
    }

    test.afterAll(async () => {
        const reportPath = path.join(__dirname, '..', 'test-results', 'CommodityCreate_FORM_BEHAVIOR_REPORT.md');

        let markdown = `# CommodityCreate Form Behavior Report\n\n`;
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
                markdown += `**Relevant Log Entries (last 10):**\n\n`;
                scenario.consoleLogs.logs.slice(-10).forEach(log => {
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
                    if (resp.containsValidationErrors !== undefined) {
                        markdown += `- **Contains Validation Errors:** ${resp.containsValidationErrors}\n`;
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

    test('Scenario 1: Empty Form Submission - All Required Fields Missing', async ({ page }) => {
        const scenarioName = 'Empty Form Submission';
        const description = 'Submit the create form with all fields empty to identify which fields are required (Name and CommodityGroup) and what validation errors appear.';

        const inputs = {
            Name: '',
            Description: '',
            CommodityGroup: '',
            CommoditySubGroup: '',
            BargeExCode: '',
            ChrisCode: '',
            EstimatedFairValue: '',
            ConvFmsCommodityID: '',
            IsActive: true,
            IsCdc: false,
            IsCoverRequired: false,
            allFieldsEmpty: true
        };

        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();

        await page.waitForTimeout(3000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const fieldErrors = await page.locator('.field-validation-error, .text-danger').allTextContents();
        const nonEmptyFieldErrors = fieldErrors.filter(e => e.trim());

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            fieldErrorCount: nonEmptyFieldErrors.length,
            fieldErrors: nonEmptyFieldErrors,
            redirectedToDetails: page.url().includes('/Details'),
            stayedOnCreatePage: page.url().includes('/Create') || page.url().includes('/Edit'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/commodity-scenario1-empty-submission.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 2: Valid Commodity Creation - Minimal Required Fields', async ({ page }) => {
        const scenarioName = 'Valid Commodity Creation - PWTEST Commodity 1';
        const description = 'Create a valid commodity with only minimal required fields (Name and CommodityGroup) filled in to establish baseline. Uses "PWTEST" prefix to identify test data.';

        const timestamp = Date.now();
        const inputs = {
            Name: `PWTEST Commodity ${timestamp}`,
            CommodityGroup: `PWTST${timestamp.toString().slice(-4)}`,
            Description: '',
            CommoditySubGroup: '',
            BargeExCode: '',
            ChrisCode: '',
            EstimatedFairValue: '',
            ConvFmsCommodityID: '',
            IsActive: true,
            IsCdc: false,
            IsCoverRequired: false
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="CommodityGroup"]').fill(inputs.CommodityGroup);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();

        await page.waitForTimeout(4000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const successAlert = page.locator('.alert-success');
        const hasSuccessMessage = await successAlert.count() > 0;
        const successMessage = hasSuccessMessage ? await successAlert.textContent() : '';

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            successMessageDisplayed: hasSuccessMessage,
            successMessage: successMessage,
            redirectedToDetails: page.url().includes('/Details'),
            stayedOnCreatePage: page.url().includes('/Create') || page.url().includes('/Edit'),
            currentUrl: page.url(),
            commodityCreated: hasSuccessMessage || page.url().includes('/Details')
        };

        await page.screenshot({ path: 'test-results/commodity-scenario2-valid-minimal.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 3: Valid Complete Commodity Creation', async ({ page }) => {
        const scenarioName = 'Valid Complete Commodity - PWTEST Commodity 2';
        const description = 'Create a commodity with all fields filled in to verify complete data submission.';

        const timestamp = Date.now();
        const inputs = {
            Name: `PWTEST Complete Commodity ${timestamp}`,
            CommodityGroup: `PWGRP${timestamp.toString().slice(-4)}`,
            CommoditySubGroup: `PWSUB${timestamp.toString().slice(-4)}`,
            Description: `PWTEST Description for testing ${timestamp}`,
            BargeExCode: `BX${timestamp.toString().slice(-5)}`,
            ChrisCode: `CH${timestamp.toString().slice(-5)}`,
            EstimatedFairValue: '1250.50',
            ConvFmsCommodityID: '12345',
            IsActive: true,
            IsCdc: true,
            IsCoverRequired: true
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="CommodityGroup"]').fill(inputs.CommodityGroup);
        await page.locator('input[name="CommoditySubGroup"]').fill(inputs.CommoditySubGroup);
        await page.locator('textarea[name="Description"]').fill(inputs.Description);
        await page.locator('input[name="BargeExCode"]').fill(inputs.BargeExCode);
        await page.locator('input[name="ChrisCode"]').fill(inputs.ChrisCode);
        await page.locator('input[name="EstimatedFairValue"]').fill(inputs.EstimatedFairValue);
        await page.locator('input[name="ConvFmsCommodityID"]').fill(inputs.ConvFmsCommodityID);

        const cdcCheckbox = page.locator('input[name="IsCdc"]');
        await cdcCheckbox.check();

        const coverCheckbox = page.locator('input[name="IsCoverRequired"]');
        await coverCheckbox.check();

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();

        await page.waitForTimeout(4000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            redirectedToDetails: page.url().includes('/Details'),
            currentUrl: page.url(),
            commodityCreated: page.url().includes('/Details')
        };

        await page.screenshot({ path: 'test-results/commodity-scenario3-valid-complete.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 4: Invalid Data Types and Max Length Validation', async ({ page }) => {
        const scenarioName = 'Invalid Data Types and Max Lengths';
        const description = 'Test boundary conditions: exceed max lengths for Name (100), CommodityGroup (50), CommoditySubGroup (50), Description (500), BargeExCode (20), ChrisCode (20), negative EstimatedFairValue.';

        const timestamp = Date.now();
        const inputs = {
            Name: 'PWTEST Name ' + 'X'.repeat(100),
            CommodityGroup: 'PWTEST Group ' + 'Y'.repeat(50),
            CommoditySubGroup: 'PWTEST SubGroup ' + 'Z'.repeat(50),
            Description: 'PWTEST Description ' + 'D'.repeat(500),
            BargeExCode: 'BX' + '1'.repeat(25),
            ChrisCode: 'CH' + '2'.repeat(25),
            EstimatedFairValue: '-100.00',
            ConvFmsCommodityID: 'INVALID',
            IsActive: true,
            IsCdc: false,
            IsCoverRequired: false
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="CommodityGroup"]').fill(inputs.CommodityGroup);
        await page.locator('input[name="CommoditySubGroup"]').fill(inputs.CommoditySubGroup);
        await page.locator('textarea[name="Description"]').fill(inputs.Description);
        await page.locator('input[name="BargeExCode"]').fill(inputs.BargeExCode);
        await page.locator('input[name="ChrisCode"]').fill(inputs.ChrisCode);
        await page.locator('input[name="EstimatedFairValue"]').fill(inputs.EstimatedFairValue);
        await page.locator('input[name="ConvFmsCommodityID"]').fill(inputs.ConvFmsCommodityID);

        await page.waitForTimeout(1000);

        const actualName = await page.locator('input[name="Name"]').inputValue();
        const actualGroup = await page.locator('input[name="CommodityGroup"]').inputValue();
        const actualSubGroup = await page.locator('input[name="CommoditySubGroup"]').inputValue();
        const actualDescription = await page.locator('textarea[name="Description"]').inputValue();
        const actualBargeExCode = await page.locator('input[name="BargeExCode"]').inputValue();
        const actualChrisCode = await page.locator('input[name="ChrisCode"]').inputValue();

        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();

        await page.waitForTimeout(3000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const observations = {
            formSubmitted: networkRequests.length > 0,
            fieldValuesAfterInput: {
                name: actualName,
                commodityGroup: actualGroup,
                commoditySubGroup: actualSubGroup,
                description: actualDescription,
                bargeExCode: actualBargeExCode,
                chrisCode: actualChrisCode
            },
            inputTruncatedOrRejected: {
                name: actualName.length < inputs.Name.length,
                commodityGroup: actualGroup.length < inputs.CommodityGroup.length,
                commoditySubGroup: actualSubGroup.length < inputs.CommoditySubGroup.length,
                description: actualDescription.length < inputs.Description.length,
                bargeExCode: actualBargeExCode.length < inputs.BargeExCode.length,
                chrisCode: actualChrisCode.length < inputs.ChrisCode.length
            },
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            lengthErrors: validationMessages.some(msg => msg.toLowerCase().includes('length') || msg.toLowerCase().includes('exceed')),
            estimatedFairValueError: validationMessages.some(msg => msg.toLowerCase().includes('estimated') || msg.toLowerCase().includes('value')),
            redirectedToDetails: page.url().includes('/Details'),
            stayedOnCreatePage: page.url().includes('/Create') || page.url().includes('/Edit'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/commodity-scenario4-invalid-formats.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 5: SQL Injection & XSS Security Testing', async ({ page }) => {
        const scenarioName = 'Security Testing - SQL Injection & XSS';
        const description = 'Attempt to inject malicious SQL and JavaScript code in various fields to verify input sanitization and encoding.';

        const timestamp = Date.now();
        const inputs = {
            Name: `'; DROP TABLE Commodity; -- ${timestamp}`,
            CommodityGroup: `1' OR '1'='1`,
            CommoditySubGroup: `<script>alert('XSS');</script>`,
            Description: `<img src=x onerror=alert('XSS')>`,
            BargeExCode: `Robert'); DROP TABLE Users; --`,
            ChrisCode: `<iframe src="javascript:alert('XSS')"></iframe>`,
            EstimatedFairValue: '100',
            ConvFmsCommodityID: '999',
            IsActive: true,
            IsCdc: false,
            IsCoverRequired: false
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="CommodityGroup"]').fill(inputs.CommodityGroup);
        await page.locator('input[name="CommoditySubGroup"]').fill(inputs.CommoditySubGroup);
        await page.locator('textarea[name="Description"]').fill(inputs.Description);
        await page.locator('input[name="BargeExCode"]').fill(inputs.BargeExCode);
        await page.locator('input[name="ChrisCode"]').fill(inputs.ChrisCode);
        await page.locator('input[name="EstimatedFairValue"]').fill(inputs.EstimatedFairValue);
        await page.locator('input[name="ConvFmsCommodityID"]').fill(inputs.ConvFmsCommodityID);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();

        await page.waitForTimeout(3000);

        const pageContent = await page.content();
        const hasUnescapedScript = pageContent.includes('<script>alert(') ||
            pageContent.includes('<img src=x onerror=') ||
            pageContent.includes('<iframe src="javascript:');

        const hasScriptExecuted = await page.evaluate(() => {
            return window.xssTestExecuted === true;
        });

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const observations = {
            formSubmitted: networkRequests.length > 0,
            maliciousInputsAttempted: Object.keys(inputs).filter(k => typeof inputs[k] === 'string').length,
            xssVulnerability: {
                unescapedScriptInDOM: hasUnescapedScript,
                scriptExecuted: hasScriptExecuted
            },
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            serverError: validationMessages.some(msg => msg.toLowerCase().includes('error')),
            potentialVulnerability: hasUnescapedScript || hasScriptExecuted,
            redirectedToDetails: page.url().includes('/Details'),
            stayedOnCreatePage: page.url().includes('/Create') || page.url().includes('/Edit'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/commodity-scenario5-security-testing.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 6: Special Characters in Input Fields', async ({ page }) => {
        const scenarioName = 'Special Characters Handling';
        const description = 'Test handling of special characters: %, _, *, \\, \', ", ;, -- in various fields to verify proper encoding and storage.';

        const timestamp = Date.now();
        const inputs = {
            Name: `PWTEST %_*\\'";--% ${timestamp}`,
            CommodityGroup: `PWGRP % _ * ${timestamp}`,
            CommoditySubGroup: `PWSUB \\ " ' ; ${timestamp}`,
            Description: `PWTEST Description with special chars: %, _, *, \\, ', ", ;, --`,
            BargeExCode: `BX%_*`,
            ChrisCode: `CH'"--`,
            EstimatedFairValue: '500.00',
            ConvFmsCommodityID: '777',
            IsActive: true,
            IsCdc: false,
            IsCoverRequired: false
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="CommodityGroup"]').fill(inputs.CommodityGroup);
        await page.locator('input[name="CommoditySubGroup"]').fill(inputs.CommoditySubGroup);
        await page.locator('textarea[name="Description"]').fill(inputs.Description);
        await page.locator('input[name="BargeExCode"]').fill(inputs.BargeExCode);
        await page.locator('input[name="ChrisCode"]').fill(inputs.ChrisCode);
        await page.locator('input[name="EstimatedFairValue"]').fill(inputs.EstimatedFairValue);
        await page.locator('input[name="ConvFmsCommodityID"]').fill(inputs.ConvFmsCommodityID);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();

        await page.waitForTimeout(3000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const observations = {
            formSubmitted: networkRequests.length > 0,
            specialCharactersUsed: '%, _, *, \\, \', ", ;, --',
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            redirectedToDetails: page.url().includes('/Details'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/commodity-scenario6-special-characters.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 7: Rapid Form Submission Prevention', async ({ page }) => {
        const scenarioName = 'Rapid Submission Prevention';
        const description = 'Attempt rapid consecutive form submissions to verify the system prevents duplicate submissions.';

        const timestamp = Date.now();
        const inputs = {
            Name: `PWTEST Rapid ${timestamp}`,
            CommodityGroup: `PWRPD${timestamp.toString().slice(-4)}`,
            Description: 'PWTEST testing rapid submission',
            rapidSubmissions: 3
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="CommodityGroup"]').fill(inputs.CommodityGroup);
        await page.locator('textarea[name="Description"]').fill(inputs.Description);

        await page.waitForTimeout(500);

        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');

        const requestCountBefore = networkRequests.length;

        await submitButton.click();
        await page.waitForTimeout(100);
        await submitButton.click();
        await page.waitForTimeout(100);
        await submitButton.click();

        await page.waitForTimeout(4000);

        const requestCountAfter = networkRequests.length;
        const actualSubmissions = requestCountAfter - requestCountBefore;

        const observations = {
            clicksAttempted: inputs.rapidSubmissions,
            actualFormSubmissions: actualSubmissions,
            duplicatePreventionWorking: actualSubmissions === 1,
            buttonDisabledAfterClick: await submitButton.isDisabled(),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/commodity-scenario7-rapid-submission.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 8: Missing Name Field Only', async ({ page }) => {
        const scenarioName = 'Missing Name Field';
        const description = 'Submit form with CommodityGroup but without Name to verify field-specific validation.';

        const timestamp = Date.now();
        const inputs = {
            Name: '',
            CommodityGroup: `PWGRP${timestamp.toString().slice(-4)}`,
            Description: 'PWTEST Description without name',
            CommoditySubGroup: 'PWTEST SubGroup',
            IsActive: true
        };

        await page.locator('input[name="CommodityGroup"]').fill(inputs.CommodityGroup);
        await page.locator('textarea[name="Description"]').fill(inputs.Description);
        await page.locator('input[name="CommoditySubGroup"]').fill(inputs.CommoditySubGroup);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();

        await page.waitForTimeout(3000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const nameFieldError = page.locator('span[data-valmsg-for="Name"]');
        const nameErrorText = await nameFieldError.textContent();

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            nameValidationError: validationMessages.some(msg => msg.toLowerCase().includes('name')),
            nameFieldErrorText: nameErrorText.trim(),
            redirectedToDetails: page.url().includes('/Details'),
            stayedOnCreatePage: page.url().includes('/Create') || page.url().includes('/Edit'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/commodity-scenario8-missing-name.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 9: Missing CommodityGroup Field Only', async ({ page }) => {
        const scenarioName = 'Missing CommodityGroup Field';
        const description = 'Submit form with Name but without CommodityGroup to verify field-specific validation.';

        const timestamp = Date.now();
        const inputs = {
            Name: `PWTEST Commodity ${timestamp}`,
            CommodityGroup: '',
            Description: 'PWTEST Description without group',
            CommoditySubGroup: 'PWTEST SubGroup',
            IsActive: true
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('textarea[name="Description"]').fill(inputs.Description);
        await page.locator('input[name="CommoditySubGroup"]').fill(inputs.CommoditySubGroup);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();

        await page.waitForTimeout(3000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const groupFieldError = page.locator('span[data-valmsg-for="CommodityGroup"]');
        const groupErrorText = await groupFieldError.textContent();

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            groupValidationError: validationMessages.some(msg => msg.toLowerCase().includes('group')),
            groupFieldErrorText: groupErrorText.trim(),
            redirectedToDetails: page.url().includes('/Details'),
            stayedOnCreatePage: page.url().includes('/Create') || page.url().includes('/Edit'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/commodity-scenario9-missing-group.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 10: EstimatedFairValue Boundary Testing', async ({ page }) => {
        const scenarioName = 'EstimatedFairValue Boundary Testing';
        const description = 'Test EstimatedFairValue with boundary values: 0, max value (999999.99), and out of range value.';

        const timestamp = Date.now();
        const inputs = {
            Name: `PWTEST Boundary ${timestamp}`,
            CommodityGroup: `PWBND${timestamp.toString().slice(-4)}`,
            EstimatedFairValue: '1000000.00',
            Description: 'PWTEST testing value boundary',
            IsActive: true
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="CommodityGroup"]').fill(inputs.CommodityGroup);
        await page.locator('textarea[name="Description"]').fill(inputs.Description);
        await page.locator('input[name="EstimatedFairValue"]').fill(inputs.EstimatedFairValue);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();

        await page.waitForTimeout(3000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            rangeValidationError: validationMessages.some(msg => msg.toLowerCase().includes('range') || msg.toLowerCase().includes('between')),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/commodity-scenario10-boundary-testing.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });
});
