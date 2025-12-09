const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Barge Create - Comprehensive Form Behavior Analysis', () => {
    let testReport = {
        testSuite: 'Barge Create Form Behavior',
        timestamp: new Date().toISOString(),
        baseURL: 'https://localhost:6001/Barge/Create',
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
            if (request.url().includes('Barge')) {
                networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    postData: request.postData(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        page.on('response', async response => {
            if (response.url().includes('Barge')) {
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

        await page.goto('https://localhost:6001/Barge/Create');
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
        const reportPath = path.join(__dirname, '..', 'test-results', 'Barge_CREATE_BEHAVIOR_REPORT.md');

        let markdown = `# Barge Create Form Behavior Report\n\n`;
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
        const description = 'Submit the create form with all fields empty to identify which fields are actually required and what validation errors appear.';

        const inputs = {
            BargeNum: '',
            UscgNum: '',
            HullType: '',
            IsActive: true,
            EquipmentType: 'Barge',
            BargeType: '',
            allFieldsEmpty: true
        };

        const submitButton = page.locator('form button[type="submit"][value="save"]');
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
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/barge-create-scenario1-empty-submission.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 2: Valid Barge Creation - Minimal Required Fields', async ({ page }) => {
        const scenarioName = 'Valid Barge Creation - PWTEST Barge 1';
        const description = 'Create a valid barge with only minimal required fields filled in to establish baseline. Uses "PWTEST" prefix to identify test data.';

        const timestamp = Date.now();
        const inputs = {
            BargeNum: `PWTST${timestamp.toString().slice(-6)}`,
            UscgNum: '',
            HullType: 'R',
            IsActive: true,
            EquipmentType: 'Barge',
            BargeType: ''
        };

        await page.locator('input[name="BargeNum"]').fill(inputs.BargeNum);

        const hullTypeDropdown = page.locator('select[name="HullType"]');
        await hullTypeDropdown.selectOption(inputs.HullType);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"]');
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
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url(),
            bargeCreated: hasSuccessMessage || page.url().includes('/Details')
        };

        await page.screenshot({ path: 'test-results/barge-create-scenario2-valid-minimal.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 3: Complete Valid Barge Creation with All Fields', async ({ page }) => {
        const scenarioName = 'Complete Valid Barge - PWTEST Barge 2';
        const description = 'Create a complete valid barge with all fields properly filled to verify successful creation flow.';

        const timestamp = Date.now();
        const inputs = {
            BargeNum: `PWTEST-${timestamp.toString().slice(-6)}`,
            UscgNum: `TST${timestamp.toString().slice(-6)}`,
            HullType: 'T',
            IsActive: true,
            EquipmentType: 'Fleet-Owned',
            BargeType: 'Tank',
            ExternalLength: 195.5,
            ExternalWidth: 35.0,
            ExternalDepth: 12.5,
            SizeCategory: 'Standard',
            Draft: 9.5,
            DraftPortBow: 9.4,
            DraftPortStern: 9.6,
            DraftStarboardBow: 9.4,
            DraftStarboardStern: 9.6,
            CoverType: 'RIG',
            CoverConfig: 'Standard Rigid',
            LoadStatus: 'Empty',
            CleanStatus: 'Clean',
            RepairStatus: 'Good',
            DamageLevel: 'None',
            IsDamaged: false,
            IsCargoDamaged: false,
            IsLeaker: false,
            IsDryDocked: false,
            IsRepairScheduled: false,
            HasInsufficientFreeboard: false,
            HasAnchorWire: true
        };

        await page.locator('input[name="BargeNum"]').fill(inputs.BargeNum);
        await page.locator('input[name="UscgNum"]').fill(inputs.UscgNum);

        await page.locator('select[name="HullType"]').selectOption(inputs.HullType);
        await page.locator('select[name="EquipmentType"]').selectOption(inputs.EquipmentType);
        await page.locator('select[name="BargeType"]').selectOption(inputs.BargeType);

        await page.locator('input[name="ExternalLength"]').fill(inputs.ExternalLength.toString());
        await page.locator('input[name="ExternalWidth"]').fill(inputs.ExternalWidth.toString());
        await page.locator('input[name="ExternalDepth"]').fill(inputs.ExternalDepth.toString());

        await page.locator('select[name="SizeCategory"]').selectOption(inputs.SizeCategory);

        await page.locator('input[name="Draft"]').fill(inputs.Draft.toString());
        await page.locator('input[name="DraftPortBow"]').fill(inputs.DraftPortBow.toString());
        await page.locator('input[name="DraftPortStern"]').fill(inputs.DraftPortStern.toString());
        await page.locator('input[name="DraftStarboardBow"]').fill(inputs.DraftStarboardBow.toString());
        await page.locator('input[name="DraftStarboardStern"]').fill(inputs.DraftStarboardStern.toString());

        await page.locator('select[name="CoverType"]').selectOption(inputs.CoverType);
        await page.locator('input[name="CoverConfig"]').fill(inputs.CoverConfig);

        await page.locator('select[name="LoadStatus"]').selectOption(inputs.LoadStatus);
        await page.locator('input[name="CleanStatus"]').fill(inputs.CleanStatus);
        await page.locator('input[name="RepairStatus"]').fill(inputs.RepairStatus);

        await page.locator('select[name="DamageLevel"]').selectOption(inputs.DamageLevel);

        const anchorWireCheckbox = page.locator('input[name="HasAnchorWire"]');
        if (!await anchorWireCheckbox.isChecked()) {
            await anchorWireCheckbox.check();
        }

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"]');
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
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url(),
            bargeCreated: hasSuccessMessage || page.url().includes('/Details')
        };

        await page.screenshot({ path: 'test-results/barge-create-scenario3-complete-valid.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 4: Invalid Data Types and Boundary Values', async ({ page }) => {
        const scenarioName = 'Invalid Data Types and Formats';
        const description = 'Test boundary conditions and invalid formats: negative dimensions, excessive lengths, invalid barge number format.';

        const timestamp = Date.now();
        const inputs = {
            BargeNum: 'X'.repeat(100),
            UscgNum: 'X'.repeat(100),
            HullType: 'R',
            ExternalLength: -50,
            ExternalWidth: 99999,
            ExternalDepth: -10,
            Draft: 999.999,
            CoverConfig: 'X'.repeat(200)
        };

        await page.locator('input[name="BargeNum"]').fill(inputs.BargeNum);
        await page.locator('input[name="UscgNum"]').fill(inputs.UscgNum);
        await page.locator('select[name="HullType"]').selectOption(inputs.HullType);

        await page.locator('input[name="ExternalLength"]').fill(inputs.ExternalLength.toString());
        await page.locator('input[name="ExternalWidth"]').fill(inputs.ExternalWidth.toString());
        await page.locator('input[name="ExternalDepth"]').fill(inputs.ExternalDepth.toString());
        await page.locator('input[name="Draft"]').fill(inputs.Draft.toString());
        await page.locator('input[name="CoverConfig"]').fill(inputs.CoverConfig);

        await page.waitForTimeout(1000);

        const actualBargeNum = await page.locator('input[name="BargeNum"]').inputValue();
        const actualUscgNum = await page.locator('input[name="UscgNum"]').inputValue();
        const actualCoverConfig = await page.locator('input[name="CoverConfig"]').inputValue();

        const submitButton = page.locator('form button[type="submit"][value="save"]');
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
                bargeNum: actualBargeNum,
                uscgNum: actualUscgNum,
                coverConfig: actualCoverConfig
            },
            inputTruncatedOrRejected: {
                bargeNum: actualBargeNum.length < inputs.BargeNum.length,
                uscgNum: actualUscgNum.length < inputs.UscgNum.length,
                coverConfig: actualCoverConfig.length < inputs.CoverConfig.length
            },
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            lengthError: validationMessages.some(msg => msg.toLowerCase().includes('length') || msg.toLowerCase().includes('maximum')),
            numericError: validationMessages.some(msg => msg.toLowerCase().includes('must be') || msg.toLowerCase().includes('range')),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/barge-create-scenario4-invalid-formats.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 5: SQL Injection & XSS Security Testing', async ({ page }) => {
        const scenarioName = 'Security Testing - SQL Injection & XSS';
        const description = 'Attempt to inject malicious SQL and JavaScript code in various fields to verify input sanitization.';

        const timestamp = Date.now();
        const inputs = {
            BargeNum: `'; DROP TABLE Barge; -- ${timestamp}`,
            UscgNum: `1' OR '1'='1`,
            HullType: 'R',
            CoverConfig: `<script>alert('XSS');</script>`,
            CleanStatus: `Robert'); DELETE FROM Barge WHERE 1=1; --`,
            RepairStatus: `<img src=x onerror=alert('XSS')>`,
            DamageNote: `<iframe src="javascript:alert('XSS')"></iframe>`
        };

        await page.locator('input[name="BargeNum"]').fill(inputs.BargeNum);
        await page.locator('input[name="UscgNum"]').fill(inputs.UscgNum);
        await page.locator('select[name="HullType"]').selectOption(inputs.HullType);
        await page.locator('input[name="CoverConfig"]').fill(inputs.CoverConfig);
        await page.locator('input[name="CleanStatus"]').fill(inputs.CleanStatus);
        await page.locator('input[name="RepairStatus"]').fill(inputs.RepairStatus);
        await page.locator('textarea[name="DamageNote"]').fill(inputs.DamageNote);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"]');
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
            maliciousInputsAttempted: Object.keys(inputs).length,
            xssVulnerability: {
                unescapedScriptInDOM: hasUnescapedScript,
                scriptExecuted: hasScriptExecuted
            },
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            serverError: validationMessages.some(msg => msg.toLowerCase().includes('error')),
            potentialVulnerability: hasUnescapedScript || hasScriptExecuted,
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/barge-create-scenario5-security-testing.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 6: Conditional Validation - Damage Fields', async ({ page }) => {
        const scenarioName = 'Conditional Validation - Damage Consistency';
        const description = 'Check "Is Damaged" without providing damage level to verify conditional validation.';

        const timestamp = Date.now();
        const inputs = {
            BargeNum: `PWTEST-DMG-${timestamp.toString().slice(-6)}`,
            HullType: 'R',
            IsDamaged: true,
            DamageLevel: ''
        };

        await page.locator('input[name="BargeNum"]').fill(inputs.BargeNum);
        await page.locator('select[name="HullType"]').selectOption(inputs.HullType);

        const damagedCheckbox = page.locator('input[name="IsDamaged"]');
        await damagedCheckbox.check();

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"]');
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
            damagedCheckboxChecked: await damagedCheckbox.isChecked(),
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            damageLevelError: validationMessages.some(msg => msg.toLowerCase().includes('damage level')),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/barge-create-scenario6-damage-validation.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 7: Service Date Validation', async ({ page }) => {
        const scenarioName = 'Service Date Validation';
        const description = 'Set out of service date before in service date to test date validation logic.';

        const timestamp = Date.now();
        const inputs = {
            BargeNum: `PWTEST-SVC-${timestamp.toString().slice(-6)}`,
            HullType: 'R',
            InServiceDate: '2024-12-01',
            OutOfServiceDate: '2024-01-01'
        };

        await page.locator('input[name="BargeNum"]').fill(inputs.BargeNum);
        await page.locator('select[name="HullType"]').selectOption(inputs.HullType);
        await page.locator('input[name="InServiceDate"]').fill(inputs.InServiceDate);
        await page.locator('input[name="OutOfServiceDate"]').fill(inputs.OutOfServiceDate);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"]');
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
            serviceDateError: validationMessages.some(msg => msg.toLowerCase().includes('service date') || msg.toLowerCase().includes('after')),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/barge-create-scenario7-service-date-validation.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 8: Rapid Form Submission Prevention', async ({ page }) => {
        const scenarioName = 'Rapid Form Submission';
        const description = 'Submit the form multiple times in rapid succession to verify duplicate submission prevention.';

        const timestamp = Date.now();
        const inputs = {
            BargeNum: `PWTEST-RAPID-${timestamp.toString().slice(-6)}`,
            HullType: 'R'
        };

        await page.locator('input[name="BargeNum"]').fill(inputs.BargeNum);
        await page.locator('select[name="HullType"]').selectOption(inputs.HullType);

        await page.waitForTimeout(500);

        const submitButton = page.locator('form button[type="submit"][value="save"]');

        const requestsBefore = networkRequests.length;

        await submitButton.click();
        await page.waitForTimeout(100);
        await submitButton.click();
        await page.waitForTimeout(100);
        await submitButton.click();

        await page.waitForTimeout(4000);

        const requestsAfter = networkRequests.length;
        const submissionCount = requestsAfter - requestsBefore;

        const observations = {
            rapidSubmissionsAttempted: 3,
            actualSubmissionCount: submissionCount,
            duplicateSubmissionPrevented: submissionCount === 1,
            buttonDisabledAfterClick: await submitButton.isDisabled(),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/barge-create-scenario8-rapid-submission.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });
});
