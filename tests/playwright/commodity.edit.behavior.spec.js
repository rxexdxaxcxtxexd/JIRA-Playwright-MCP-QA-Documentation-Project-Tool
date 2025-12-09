const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('CommodityEdit - Edit Form Behavior Analysis', () => {
    let testReport = {
        testSuite: 'CommodityEdit Form Behavior',
        timestamp: new Date().toISOString(),
        baseURL: 'https://localhost:6001/Commodity/Edit',
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

        // Navigate to search page first
        await page.goto('https://localhost:6001/Commodity/Index');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Click search to load commodities
        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(3000);

        // Click the first edit button to get to edit page
        const editButton = page.locator('#commodityTable .btn-primary').first();
        if (await editButton.count() > 0) {
            await editButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
        }
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
        console.log('========================================\n');
    }

    test.afterAll(async () => {
        const reportPath = path.join(__dirname, '..', 'test-results', 'CommodityEdit_FORM_BEHAVIOR_REPORT.md');

        let markdown = `# CommodityEdit Form Behavior Report\n\n`;
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
                scenario.consoleLogs.logs.slice(-10).forEach(log => {
                    markdown += `- \`[${log.type.toUpperCase()}]\` ${log.text}\n`;
                });
                markdown += `\n`;
            }

            markdown += `### Network Activity\n`;
            markdown += `- **Requests:** ${scenario.networkActivity.requests}\n`;
            markdown += `- **Responses:** ${scenario.networkActivity.responses}\n\n`;

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

    test('Scenario 1: Clear Required Field - Commodity Code', async ({ page }) => {
        const scenarioName = 'Clear Required Field - Commodity Code';
        const description = 'Clear the Commodity Code field (required) and attempt to save to verify validation.';

        const codeField = page.locator('input[name="CommodityCode"]');
        const originalValue = await codeField.inputValue();

        const inputs = {
            action: 'Clear Commodity Code field',
            originalValue: originalValue,
            newValue: ''
        };

        await codeField.clear();
        await page.waitForTimeout(500);

        const submitButton = page.locator('form button[type="submit"].btn-primary');
        await submitButton.click();
        await page.waitForTimeout(2000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const fieldError = await page.locator('span[data-valmsg-for="CommodityCode"]').textContent().catch(() => '');

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            fieldErrorMessage: fieldError.trim(),
            stayedOnEditPage: page.url().includes('/Edit/'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/commodity-edit-scenario1-clear-required.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);

        expect(hasValidationSummary || fieldError.trim().length > 0).toBeTruthy();
    });

    test('Scenario 2: Clear Required Field - Commodity Name', async ({ page }) => {
        const scenarioName = 'Clear Required Field - Commodity Name';
        const description = 'Clear the Commodity Name field (required) and attempt to save to verify validation.';

        const nameField = page.locator('input[name="CommodityName"]');
        const originalValue = await nameField.inputValue();

        const inputs = {
            action: 'Clear Commodity Name field',
            originalValue: originalValue,
            newValue: ''
        };

        await nameField.clear();
        await page.waitForTimeout(500);

        const submitButton = page.locator('form button[type="submit"].btn-primary');
        await submitButton.click();
        await page.waitForTimeout(2000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;

        const fieldError = await page.locator('span[data-valmsg-for="CommodityName"]').textContent().catch(() => '');

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationTriggered: hasValidationSummary || fieldError.trim().length > 0,
            stayedOnEditPage: page.url().includes('/Edit/')
        };

        await page.screenshot({ path: 'test-results/commodity-edit-scenario2-clear-name.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 3: Exceed Maximum Length - Commodity Code', async ({ page }) => {
        const scenarioName = 'Exceed Maximum Length - Commodity Code';
        const description = 'Enter more than 20 characters in Commodity Code to test maxlength validation.';

        const codeField = page.locator('input[name="CommodityCode"]');
        const longValue = 'VERYLONGCOMMODITYCODE12345';

        const inputs = {
            field: 'CommodityCode',
            value: longValue,
            maxLength: 20,
            inputLength: longValue.length
        };

        await codeField.fill(longValue);
        await page.waitForTimeout(500);

        const actualValue = await codeField.inputValue();

        const observations = {
            inputTruncated: actualValue.length < longValue.length,
            actualLength: actualValue.length,
            actualValue: actualValue,
            maxLengthEnforced: actualValue.length <= 20
        };

        await page.screenshot({ path: 'test-results/commodity-edit-scenario3-max-length-code.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);

        expect(actualValue.length).toBeLessThanOrEqual(20);
    });

    test('Scenario 4: Exceed Maximum Length - Commodity Name', async ({ page }) => {
        const scenarioName = 'Exceed Maximum Length - Commodity Name';
        const description = 'Enter more than 100 characters in Commodity Name to test maxlength validation.';

        const nameField = page.locator('input[name="CommodityName"]');
        const longValue = 'A'.repeat(150);

        const inputs = {
            field: 'CommodityName',
            value: longValue,
            maxLength: 100,
            inputLength: longValue.length
        };

        await nameField.fill(longValue);
        await page.waitForTimeout(500);

        const actualValue = await nameField.inputValue();

        const observations = {
            inputTruncated: actualValue.length < longValue.length,
            actualLength: actualValue.length,
            maxLengthEnforced: actualValue.length <= 100
        };

        await page.screenshot({ path: 'test-results/commodity-edit-scenario4-max-length-name.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);

        expect(actualValue.length).toBeLessThanOrEqual(100);
    });

    test('Scenario 5: SQL Injection in Description Field', async ({ page }) => {
        const scenarioName = 'SQL Injection in Description Field';
        const description = 'Attempt SQL injection in Description field to verify input sanitization.';

        const descriptionField = page.locator('textarea[name="Description"]');
        const maliciousInput = "'; DROP TABLE Commodities; --";

        const inputs = {
            field: 'Description',
            value: maliciousInput,
            testType: 'SQL Injection'
        };

        if (await descriptionField.count() > 0) {
            await descriptionField.fill(maliciousInput);
            await page.waitForTimeout(500);

            const submitButton = page.locator('form button[type="submit"].btn-primary');
            await submitButton.click();
            await page.waitForTimeout(3000);

            const serverError = await page.locator('.alert-danger').count() > 0;
            const errorMessage = serverError ? await page.locator('.alert-danger').textContent() : '';

            const observations = {
                formSubmitted: networkRequests.length > 0,
                serverError: serverError,
                errorMessage: errorMessage,
                inputAccepted: !serverError && page.url().includes('/Index'),
                properlyEscaped: !errorMessage.toLowerCase().includes('sql')
            };

            await page.screenshot({ path: 'test-results/commodity-edit-scenario5-sql-injection.png', fullPage: true });
            captureScenarioResult(scenarioName, description, inputs, observations);
        }
    });

    test('Scenario 6: Valid Edit - Update Description', async ({ page }) => {
        const scenarioName = 'Valid Edit - Update Description';
        const description = 'Update description with valid value and save successfully.';

        const descriptionField = page.locator('textarea[name="Description"]');
        const timestamp = Date.now();
        const newDescription = `PWTEST Updated description ${timestamp}`;

        const inputs = {
            field: 'Description',
            newValue: newDescription
        };

        if (await descriptionField.count() > 0) {
            await descriptionField.clear();
            await descriptionField.fill(newDescription);
            await page.waitForTimeout(500);

            const submitButton = page.locator('form button[type="submit"].btn-primary');
            await submitButton.click();
            await page.waitForTimeout(3000);

            const successAlert = page.locator('.alert-success');
            const hasSuccessMessage = await successAlert.count() > 0;
            const successMessage = hasSuccessMessage ? await successAlert.textContent() : '';

            const redirectedToIndex = page.url().includes('/Index');

            const observations = {
                formSubmitted: networkRequests.length > 0,
                successMessageDisplayed: hasSuccessMessage,
                successMessage: successMessage,
                redirectedToIndex: redirectedToIndex,
                updateSuccessful: hasSuccessMessage || redirectedToIndex
            };

            await page.screenshot({ path: 'test-results/commodity-edit-scenario6-valid-edit.png', fullPage: true });
            captureScenarioResult(scenarioName, description, inputs, observations);
        }
    });

    test('Scenario 7: Toggle IsActive Checkbox', async ({ page }) => {
        const scenarioName = 'Toggle IsActive Checkbox';
        const description = 'Check/uncheck IsActive checkbox and verify save behavior.';

        const isActiveCheckbox = page.locator('input[name="IsActive"][type="checkbox"]');

        const inputs = {
            checkbox: 'IsActive'
        };

        const initialCheckboxState = await isActiveCheckbox.isChecked();

        // Toggle checkbox
        if (initialCheckboxState) {
            await isActiveCheckbox.uncheck();
        } else {
            await isActiveCheckbox.check();
        }
        await page.waitForTimeout(500);

        const afterToggleState = await isActiveCheckbox.isChecked();

        // Save
        const submitButton = page.locator('form button[type="submit"].btn-primary');
        await submitButton.click();
        await page.waitForTimeout(3000);

        const observations = {
            initialCheckboxState: initialCheckboxState,
            afterToggleState: afterToggleState,
            toggleBehaviorCorrect: initialCheckboxState !== afterToggleState,
            formSubmitted: networkRequests.length > 0
        };

        await page.screenshot({ path: 'test-results/commodity-edit-scenario7-toggle-active.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);

        expect(observations.toggleBehaviorCorrect).toBeTruthy();
    });
});

