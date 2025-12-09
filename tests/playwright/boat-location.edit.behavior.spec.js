const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('BoatLocationEdit - Edit Form Behavior Analysis', () => {
    let testReport = {
        testSuite: 'BoatLocationEdit Form Behavior',
        timestamp: new Date().toISOString(),
        baseURL: 'https://localhost:6001/BoatLocationSearch/Edit',
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
            if (request.url().includes('BoatLocationSearch')) {
                networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    postData: request.postData(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        page.on('response', async response => {
            if (response.url().includes('BoatLocationSearch')) {
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
        await page.goto('https://localhost:6001/BoatLocationSearch/Index');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Click search to load boats
        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(3000);

        // Click the first edit button to get to edit page
        const editButton = page.locator('#boatLocationTable .btn-primary').first();
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
                    log.text.includes('[BoatLocationEdit]') ||
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
        const reportPath = path.join(__dirname, '..', 'test-results', 'BoatLocationEdit_FORM_BEHAVIOR_REPORT.md');

        let markdown = `# BoatLocationEdit Form Behavior Report\n\n`;
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

    test('Scenario 1: Clear Required Field - Boat Name', async ({ page }) => {
        const scenarioName = 'Clear Required Field - Boat Name';
        const description = 'Clear the Boat Name field (required) and attempt to save to verify validation.';

        const boatNameField = page.locator('input[name="BoatName"]');
        const originalValue = await boatNameField.inputValue();

        const inputs = {
            action: 'Clear Boat Name field',
            originalValue: originalValue,
            newValue: ''
        };

        await boatNameField.clear();
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

        const fieldError = await page.locator('span[data-valmsg-for="BoatName"]').textContent();

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            fieldErrorMessage: fieldError.trim(),
            stayedOnEditPage: page.url().includes('/Edit/'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/edit-scenario1-clear-required.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);

        expect(hasValidationSummary || fieldError.trim().length > 0).toBeTruthy();
    });

    test('Scenario 2: Invalid MMSI Format', async ({ page }) => {
        const scenarioName = 'Invalid MMSI Format';
        const description = 'Enter invalid MMSI (not 9 digits) to test format validation.';

        const mmsiField = page.locator('input[name="MMSI"]');
        const invalidMMSI = '12345';

        const inputs = {
            field: 'MMSI',
            value: invalidMMSI,
            expectedFormat: '9 digits'
        };

        await mmsiField.fill(invalidMMSI);
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

        const mmsiError = await page.locator('span[data-valmsg-for="MMSI"]').textContent();

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationTriggered: hasValidationSummary || mmsiError.trim().length > 0,
            validationMessages: validationMessages,
            mmsiFieldError: mmsiError.trim(),
            stayedOnEditPage: page.url().includes('/Edit/')
        };

        await page.screenshot({ path: 'test-results/edit-scenario2-invalid-mmsi.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 3: Negative Horsepower Value', async ({ page }) => {
        const scenarioName = 'Negative Horsepower Value';
        const description = 'Enter negative horsepower to test numeric range validation.';

        const horsepowerField = page.locator('input[name="Horsepower"]');
        const negativeValue = '-500';

        const inputs = {
            field: 'Horsepower',
            value: negativeValue,
            expectedRange: '>= 0'
        };

        if (await horsepowerField.count() > 0) {
            await horsepowerField.fill(negativeValue);
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

            const observations = {
                formSubmitted: networkRequests.length > 0,
                validationTriggered: hasValidationSummary,
                validationMessages: validationMessages,
                stayedOnEditPage: page.url().includes('/Edit/')
            };

            await page.screenshot({ path: 'test-results/edit-scenario3-negative-hp.png', fullPage: true });
            captureScenarioResult(scenarioName, description, inputs, observations);
        }
    });

    test('Scenario 4: SQL Injection in Note Field', async ({ page }) => {
        const scenarioName = 'SQL Injection in Note Field';
        const description = 'Attempt SQL injection in Note field to verify input sanitization.';

        const noteField = page.locator('textarea[name="Note"]');
        const maliciousInput = "'; DROP TABLE BoatLocation; --";

        const inputs = {
            field: 'Note',
            value: maliciousInput,
            testType: 'SQL Injection'
        };

        if (await noteField.count() > 0) {
            await noteField.fill(maliciousInput);
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

            await page.screenshot({ path: 'test-results/edit-scenario4-sql-injection.png', fullPage: true });
            captureScenarioResult(scenarioName, description, inputs, observations);
        }
    });

    test('Scenario 5: Exceed Maximum Length - Short Name', async ({ page }) => {
        const scenarioName = 'Exceed Maximum Length - Short Name';
        const description = 'Enter more than 10 characters in Short Name to test maxlength validation.';

        const shortNameField = page.locator('input[name="ShortName"]');
        const longValue = 'VERYLONGNAME123';

        const inputs = {
            field: 'ShortName',
            value: longValue,
            maxLength: 10,
            inputLength: longValue.length
        };

        await shortNameField.fill(longValue);
        await page.waitForTimeout(500);

        const actualValue = await shortNameField.inputValue();

        const observations = {
            inputTruncated: actualValue.length < longValue.length,
            actualLength: actualValue.length,
            actualValue: actualValue,
            maxLengthEnforced: actualValue.length <= 10
        };

        await page.screenshot({ path: 'test-results/edit-scenario5-max-length.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);

        expect(actualValue.length).toBeLessThanOrEqual(10);
    });

    test('Scenario 6: Valid Edit - Update Contact Email', async ({ page }) => {
        const scenarioName = 'Valid Edit - Update Contact Email';
        const description = 'Update contact email with valid value and save successfully.';

        const emailField = page.locator('input[name="ContactEmail"]');
        const timestamp = Date.now();
        const newEmail = `test${timestamp}@example.com`;

        const inputs = {
            field: 'ContactEmail',
            newValue: newEmail
        };

        if (await emailField.count() > 0) {
            await emailField.clear();
            await emailField.fill(newEmail);
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

            await page.screenshot({ path: 'test-results/edit-scenario6-valid-edit.png', fullPage: true });
            captureScenarioResult(scenarioName, description, inputs, observations);
        }
    });

    test('Scenario 7: Toggle Business Unit Dropdown', async ({ page }) => {
        const scenarioName = 'Toggle Business Unit Dropdown';
        const description = 'Check/uncheck "Business unit" checkbox and verify dropdown enable/disable behavior.';

        const fleetCheckbox = page.locator('#chkIsFleet');
        const fleetDropdown = page.locator('#cboFleetID');

        const inputs = {
            checkbox: 'IsFleetBoat',
            dropdown: 'FleetId'
        };

        const initialCheckboxState = await fleetCheckbox.isChecked();
        const initialDropdownState = await fleetDropdown.isEnabled();

        if (initialCheckboxState) {
            await fleetCheckbox.uncheck();
        } else {
            await fleetCheckbox.check();
        }
        await page.waitForTimeout(500);

        const afterToggleDropdownState = await fleetDropdown.isEnabled();

        await fleetCheckbox.click();
        await page.waitForTimeout(500);

        const finalDropdownState = await fleetDropdown.isEnabled();

        const observations = {
            initialCheckboxState: initialCheckboxState,
            initialDropdownEnabled: initialDropdownState,
            afterToggleDropdownEnabled: afterToggleDropdownState,
            finalDropdownEnabled: finalDropdownState,
            toggleBehaviorCorrect: initialDropdownState !== afterToggleDropdownState
        };

        await page.screenshot({ path: 'test-results/edit-scenario7-toggle-fleet.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);

        expect(observations.toggleBehaviorCorrect).toBeTruthy();
    });
});
