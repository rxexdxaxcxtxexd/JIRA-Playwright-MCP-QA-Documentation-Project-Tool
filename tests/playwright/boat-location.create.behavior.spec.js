const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('BoatLocationCreate - Comprehensive Form Behavior Analysis', () => {
    let testReport = {
        testSuite: 'BoatLocationCreate Form Behavior',
        timestamp: new Date().toISOString(),
        baseURL: 'https://localhost:6001/BoatLocationSearch/Create',
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

        await page.goto('https://localhost:6001/BoatLocationSearch/Create');
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
        const reportPath = path.join(__dirname, '..', 'test-results', 'BoatLocationCreate_FORM_BEHAVIOR_REPORT.md');

        let markdown = `# BoatLocationCreate Form Behavior Report\n\n`;
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
            BoatName: '',
            ShortName: '',
            UscgNum: '',
            MMSI: '',
            CallSign: '',
            IsFleetBoat: false,
            TrackPositionInAis: false,
            Owner: '',
            Operator: '',
            allFieldsEmpty: true
        };

        const submitButton = page.locator('form button[type="submit"].btn-primary');
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
            redirectedToIndex: page.url().includes('/Index'),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/create-scenario1-empty-submission.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 2: Valid Boat Creation - Minimal Required Fields', async ({ page }) => {
        const scenarioName = 'Valid Boat Creation - PWTEST Boat 1';
        const description = 'Create a valid boat with only minimal required fields filled in to establish baseline. Uses "PWTEST" prefix to identify test data.';

        const timestamp = Date.now();
        const inputs = {
            BoatName: `PWTEST Boat ${timestamp}`,
            ShortName: `PW${timestamp.toString().slice(-6)}`,
            UscgNum: '',
            MMSI: '',
            CallSign: '',
            IsFleetBoat: false,
            TrackPositionInAis: false,
            Owner: '',
            Operator: ''
        };

        await page.locator('input[name="BoatName"]').fill(inputs.BoatName);
        await page.locator('input[name="ShortName"]').fill(inputs.ShortName);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"].btn-primary');
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
            redirectedToIndex: page.url().includes('/Index'),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url(),
            boatCreated: hasSuccessMessage && page.url().includes('/Index')
        };

        await page.screenshot({ path: 'test-results/create-scenario2-valid-minimal.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 3: Fleet Boat Without Required Fields', async ({ page }) => {
        const scenarioName = 'Fleet Boat Validation - Missing Required Fields';
        const description = 'Check "Is Fleet Boat" without providing required USCG# and Fleet selection to verify conditional validation.';

        const timestamp = Date.now();
        const inputs = {
            BoatName: `PWTEST Fleet ${timestamp}`,
            ShortName: `PF${timestamp.toString().slice(-6)}`,
            IsFleetBoat: true,
            UscgNum: '',
            FleetId: null,
            Owner: '',
            Operator: ''
        };

        await page.locator('input[name="BoatName"]').fill(inputs.BoatName);
        await page.locator('input[name="ShortName"]').fill(inputs.ShortName);

        const fleetCheckbox = page.locator('input[id="chkIsFleet"]');
        await fleetCheckbox.check();

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"].btn-primary');
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
            fleetCheckboxChecked: await fleetCheckbox.isChecked(),
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            uscgValidationError: validationMessages.some(msg => msg.toLowerCase().includes('uscg')),
            fleetValidationError: validationMessages.some(msg => msg.toLowerCase().includes('fleet')),
            redirectedToIndex: page.url().includes('/Index'),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/create-scenario3-fleet-missing-fields.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 4: Track AIS Without MMSI - Conditional Validation', async ({ page }) => {
        const scenarioName = 'Track AIS Validation - Missing MMSI';
        const description = 'Enable "Track Position in AIS" without providing the required 9-digit MMSI to test conditional validation logic.';

        const timestamp = Date.now();
        const inputs = {
            BoatName: `PWTEST AIS ${timestamp}`,
            ShortName: `PA${timestamp.toString().slice(-6)}`,
            TrackPositionInAis: true,
            MMSI: '',
            CallSign: 'TEST123',
            IsFleetBoat: false
        };

        await page.locator('input[name="BoatName"]').fill(inputs.BoatName);
        await page.locator('input[name="ShortName"]').fill(inputs.ShortName);
        await page.locator('input[name="CallSign"]').fill(inputs.CallSign);

        const aisCheckbox = page.locator('input[id="chkTrackPositionInAIS"]');
        await aisCheckbox.check();

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"].btn-primary');
        await submitButton.click();

        await page.waitForTimeout(3000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const mmsiFieldError = page.locator('span[data-valmsg-for="MMSI"]');
        const mmsiErrorText = await mmsiFieldError.textContent();

        const observations = {
            formSubmitted: networkRequests.length > 0,
            trackAisChecked: await aisCheckbox.isChecked(),
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            mmsiValidationError: validationMessages.some(msg => msg.toLowerCase().includes('mmsi')),
            mmsiFieldErrorText: mmsiErrorText.trim(),
            redirectedToIndex: page.url().includes('/Index'),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/create-scenario4-ais-no-mmsi.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 5: Invalid Data Types and Formats', async ({ page }) => {
        const scenarioName = 'Invalid Data Types and Formats';
        const description = 'Test boundary conditions and invalid formats: lowercase USCG#, wrong MMSI format, invalid year, negative numbers, excessive lengths.';

        const timestamp = Date.now();
        const inputs = {
            BoatName: `PWTEST Invalid ${timestamp}`,
            ShortName: `PI${timestamp.toString().slice(-6)}`,
            UscgNum: 'abc123xyz', // Should be uppercase only
            MMSI: '12345', // Should be exactly 9 digits
            CallSign: 'X'.repeat(50), // Exceeds max length of 20
            Horsepower: -100, // Negative value
            ExternalLength: 99999, // Exceeds max 10000
            CurrentYearBuilt: '99', // Should be 4 digits
            TrackPositionInAis: false,
            IsFleetBoat: false
        };

        await page.locator('input[name="BoatName"]').fill(inputs.BoatName);
        await page.locator('input[name="ShortName"]').fill(inputs.ShortName);
        await page.locator('input[name="UscgNum"]').fill(inputs.UscgNum);
        await page.locator('input[name="MMSI"]').fill(inputs.MMSI);
        await page.locator('input[name="CallSign"]').fill(inputs.CallSign);

        // Find horsepower field
        const horsepowerField = page.locator('input[name="Horsepower"]');
        if (await horsepowerField.count() > 0) {
            await horsepowerField.fill(inputs.Horsepower.toString());
        }

        // Find external length field
        const lengthField = page.locator('input[name="ExternalLength"]');
        if (await lengthField.count() > 0) {
            await lengthField.fill(inputs.ExternalLength.toString());
        }

        // Find year built field
        const yearField = page.locator('input[name="CurrentYearBuilt"]');
        if (await yearField.count() > 0) {
            await yearField.fill(inputs.CurrentYearBuilt);
        }

        await page.waitForTimeout(1000);

        // Check actual field values after validation
        const actualUscg = await page.locator('input[name="UscgNum"]').inputValue();
        const actualMmsi = await page.locator('input[name="MMSI"]').inputValue();
        const actualCallSign = await page.locator('input[name="CallSign"]').inputValue();
        const actualYear = await yearField.count() > 0 ? await yearField.inputValue() : '';

        const submitButton = page.locator('form button[type="submit"].btn-primary');
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
                uscgNum: actualUscg,
                mmsi: actualMmsi,
                callSign: actualCallSign,
                yearBuilt: actualYear
            },
            inputTruncatedOrRejected: {
                callSign: actualCallSign.length < inputs.CallSign.length,
                uscg: actualUscg !== inputs.UscgNum,
                mmsi: actualMmsi !== inputs.MMSI
            },
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            uscgFormatError: validationMessages.some(msg => msg.toLowerCase().includes('uscg')),
            mmsiFormatError: validationMessages.some(msg => msg.toLowerCase().includes('mmsi')),
            yearFormatError: validationMessages.some(msg => msg.toLowerCase().includes('year')),
            lengthError: validationMessages.some(msg => msg.toLowerCase().includes('length')),
            redirectedToIndex: page.url().includes('/Index'),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/create-scenario5-invalid-formats.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 6: Complete Valid Fleet Boat Creation', async ({ page }) => {
        const scenarioName = 'Complete Valid Fleet Boat - PWTEST Boat 2';
        const description = 'Create a complete valid fleet boat with all required fields properly filled to verify successful creation flow.';

        const timestamp = Date.now();
        const inputs = {
            BoatName: `PWTEST Complete Fleet ${timestamp}`,
            ShortName: `PCF${timestamp.toString().slice(-6)}`,
            UscgNum: `TEST${timestamp.toString().slice(-6)}`,
            MMSI: '987654321',
            CallSign: 'PWTST',
            IsFleetBoat: true,
            FleetId: 'first-available',
            OwnerId: 'first-available',
            OperatorId: 'first-available',
            TrackPositionInAis: true,
            Horsepower: 2500,
            ExternalLength: 120,
            ExternalWidth: 35,
            CurrentYearBuilt: '2020'
        };

        await page.locator('input[name="BoatName"]').fill(inputs.BoatName);
        await page.locator('input[name="ShortName"]').fill(inputs.ShortName);
        await page.locator('input[name="UscgNum"]').fill(inputs.UscgNum);
        await page.locator('input[name="MMSI"]').fill(inputs.MMSI);
        await page.locator('input[name="CallSign"]').fill(inputs.CallSign);

        const fleetCheckbox = page.locator('input[id="chkIsFleet"]');
        await fleetCheckbox.check();
        await page.waitForTimeout(500);

        // Select first available fleet
        const fleetDropdown = page.locator('select[name="FleetId"]');
        if (await fleetDropdown.count() > 0) {
            const options = await fleetDropdown.locator('option').count();
            if (options > 1) {
                await fleetDropdown.selectOption({ index: 1 });
            }
        }

        // Select first available owner
        const ownerDropdown = page.locator('select[name="OwnerId"]');
        if (await ownerDropdown.count() > 0) {
            const options = await ownerDropdown.locator('option').count();
            if (options > 1) {
                await ownerDropdown.selectOption({ index: 1 });
            }
        }

        // Select first available operator
        const operatorDropdown = page.locator('select[name="OperatorId"]');
        if (await operatorDropdown.count() > 0) {
            const options = await operatorDropdown.locator('option').count();
            if (options > 1) {
                await operatorDropdown.selectOption({ index: 1 });
            }
        }

        const aisCheckbox = page.locator('input[id="chkTrackPositionInAIS"]');
        await aisCheckbox.check();

        // Fill in optional numeric fields
        const horsepowerField = page.locator('input[name="Horsepower"]');
        if (await horsepowerField.count() > 0) {
            await horsepowerField.fill(inputs.Horsepower.toString());
        }

        const lengthField = page.locator('input[name="ExternalLength"]');
        if (await lengthField.count() > 0) {
            await lengthField.fill(inputs.ExternalLength.toString());
        }

        const widthField = page.locator('input[name="ExternalWidth"]');
        if (await widthField.count() > 0) {
            await widthField.fill(inputs.ExternalWidth.toString());
        }

        const yearField = page.locator('input[name="CurrentYearBuilt"]');
        if (await yearField.count() > 0) {
            await yearField.fill(inputs.CurrentYearBuilt);
        }

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"].btn-primary');
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
            redirectedToIndex: page.url().includes('/Index'),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url(),
            boatCreated: hasSuccessMessage && page.url().includes('/Index')
        };

        await page.screenshot({ path: 'test-results/create-scenario6-complete-valid-fleet.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 7: SQL Injection & XSS Security Testing', async ({ page }) => {
        const scenarioName = 'Security Testing - SQL Injection & XSS';
        const description = 'Attempt to inject malicious SQL and JavaScript code in various fields to verify input sanitization.';

        const timestamp = Date.now();
        const inputs = {
            BoatName: `'; DROP TABLE BoatLocation; -- ${timestamp}`,
            ShortName: `<script>alert('XSS');</script>`,
            UscgNum: `1' OR '1'='1`,
            CallSign: `<img src=x onerror=alert('XSS')>`,
            ContactName: `Robert'); DROP TABLE Users; --`,
            ContactEmail: `test+<script>@example.com`,
            Note: `<iframe src="javascript:alert('XSS')"></iframe>`,
            IsFleetBoat: false,
            TrackPositionInAis: false
        };

        await page.locator('input[name="BoatName"]').fill(inputs.BoatName);
        await page.locator('input[name="ShortName"]').fill(inputs.ShortName);
        await page.locator('input[name="UscgNum"]').fill(inputs.UscgNum);
        await page.locator('input[name="CallSign"]').fill(inputs.CallSign);

        const contactNameField = page.locator('input[name="ContactName"]');
        if (await contactNameField.count() > 0) {
            await contactNameField.fill(inputs.ContactName);
        }

        const contactEmailField = page.locator('input[name="ContactEmail"]');
        if (await contactEmailField.count() > 0) {
            await contactEmailField.fill(inputs.ContactEmail);
        }

        const noteField = page.locator('textarea[name="Note"]');
        if (await noteField.count() > 0) {
            await noteField.fill(inputs.Note);
        }

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"].btn-primary');
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
            redirectedToIndex: page.url().includes('/Index'),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/create-scenario7-security-testing.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });
});
