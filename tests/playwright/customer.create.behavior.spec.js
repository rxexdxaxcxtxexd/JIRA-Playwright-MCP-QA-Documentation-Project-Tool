const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('CustomerCreate - Comprehensive Form Behavior Analysis', () => {
    let testReport = {
        testSuite: 'CustomerCreate Form Behavior',
        timestamp: new Date().toISOString(),
        baseURL: 'https://localhost:6001/Customer/Create',
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
            if (request.url().includes('Customer')) {
                networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    postData: request.postData(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        page.on('response', async response => {
            if (response.url().includes('Customer')) {
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

        await page.goto('https://localhost:6001/Customer/Create');
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
                    log.text.includes('[Customer]') ||
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
        const reportPath = path.join(__dirname, '..', 'test-results', 'CustomerCreate_FORM_BEHAVIOR_REPORT.md');

        let markdown = `# CustomerCreate Form Behavior Report\n\n`;
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
            Name: '',
            BillingName: '',
            AccountingCode: '',
            EmailAddress: '',
            PhoneNumber: '',
            Address: '',
            City: '',
            State: '',
            Zip: '',
            allFieldsEmpty: true
        };

        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
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
        const nonEmptyFieldErrors = fieldErrors.filter(e => e.trim() && !e.includes('*'));

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

        await page.screenshot({ path: 'test-results/customer-scenario1-empty-submission.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 2: Valid Customer Creation - Minimal Required Fields', async ({ page }) => {
        const scenarioName = 'Valid Customer Creation - PWTEST Customer 1';
        const description = 'Create a valid customer with only minimal required fields filled in to establish baseline. Uses "PWTEST" prefix to identify test data.';

        const timestamp = Date.now();
        const inputs = {
            Name: `PWTEST${timestamp.toString().slice(-6)}`,
            BillingName: `PWTEST Customer ${timestamp}`,
            AccountingCode: '',
            EmailAddress: '',
            PhoneNumber: '',
            Address: '',
            City: '',
            State: '',
            Zip: ''
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="BillingName"]').fill(inputs.BillingName);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
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
            customerCreated: hasSuccessMessage || page.url().includes('/Details')
        };

        await page.screenshot({ path: 'test-results/customer-scenario2-valid-minimal.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 3: Complete Valid Customer Creation with All Fields', async ({ page }) => {
        const scenarioName = 'Complete Valid Customer - PWTEST Customer 2';
        const description = 'Create a complete valid customer with all optional fields properly filled to verify full data acceptance.';

        const timestamp = Date.now();
        const inputs = {
            Name: `PWTEST${timestamp.toString().slice(-6)}`,
            BillingName: `PWTEST Complete Customer ${timestamp}`,
            AccountingCode: `ACCT${timestamp.toString().slice(-4)}`,
            AccountingSyncId: `SYNC${timestamp.toString().slice(-6)}`,
            TermsCode: 'NET30',
            EmailAddress: `pwtest${timestamp}@example.com`,
            PhoneNumber: '5551234567',
            FaxNumber: '5557654321',
            Address: '123 PWTEST Street',
            City: 'PWTEST City',
            State: 'TX',
            Zip: '12345',
            ExternalCode: `EXT${timestamp.toString().slice(-6)}`,
            FreightCode: 'FRT',
            CustomerType: 'Commercial',
            SendInvoiceOptions: 'Email',
            SendSingleInvoicePerEmail: true,
            EnablePortal: true,
            IsBargeExEnabled: false,
            IsActive: true
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="BillingName"]').fill(inputs.BillingName);
        await page.locator('input[name="AccountingCode"]').fill(inputs.AccountingCode);
        await page.locator('input[name="AccountingSyncId"]').fill(inputs.AccountingSyncId);
        await page.locator('input[name="TermsCode"]').fill(inputs.TermsCode);
        await page.locator('input[name="EmailAddress"]').fill(inputs.EmailAddress);
        await page.locator('input[name="PhoneNumber"]').fill(inputs.PhoneNumber);
        await page.locator('input[name="FaxNumber"]').fill(inputs.FaxNumber);
        await page.locator('input[name="Address"]').fill(inputs.Address);
        await page.locator('input[name="City"]').fill(inputs.City);
        await page.locator('input[name="State"]').fill(inputs.State);
        await page.locator('input[name="Zip"]').fill(inputs.Zip);
        await page.locator('input[name="ExternalCode"]').fill(inputs.ExternalCode);
        await page.locator('input[name="FreightCode"]').fill(inputs.FreightCode);
        await page.locator('input[name="CustomerType"]').fill(inputs.CustomerType);

        const invoiceDropdown = page.locator('select[name="SendInvoiceOptions"]');
        await invoiceDropdown.selectOption('Email');

        const singleInvoiceCheckbox = page.locator('input[name="SendSingleInvoicePerEmail"]');
        await singleInvoiceCheckbox.check();

        const portalCheckbox = page.locator('input[name="EnablePortal"]');
        await portalCheckbox.check();

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
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
            customerCreated: hasSuccessMessage || page.url().includes('/Details')
        };

        await page.screenshot({ path: 'test-results/customer-scenario3-complete-valid.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 4: Invalid Email Format Validation', async ({ page }) => {
        const scenarioName = 'Invalid Email Format';
        const description = 'Test email field validation with various invalid email formats.';

        const timestamp = Date.now();
        const inputs = {
            Name: `PWTEST${timestamp.toString().slice(-6)}`,
            BillingName: `PWTEST Email Test ${timestamp}`,
            EmailAddress: 'invalid-email-format',
            invalidEmailFormats: ['plaintext', '@example.com', 'user@', 'user @example.com']
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="BillingName"]').fill(inputs.BillingName);
        await page.locator('input[name="EmailAddress"]').fill(inputs.EmailAddress);

        await page.waitForTimeout(500);

        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
        await submitButton.click();

        await page.waitForTimeout(3000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationSummary = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const emailFieldError = page.locator('span[data-valmsg-for="EmailAddress"]');
        const emailErrorText = await emailFieldError.textContent();

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            emailValidationError: validationMessages.some(msg => msg.toLowerCase().includes('email')),
            emailFieldErrorText: emailErrorText.trim(),
            redirectedToDetails: page.url().includes('/Details'),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/customer-scenario4-invalid-email.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 5: Freight Code Length Validation', async ({ page }) => {
        const scenarioName = 'Freight Code Length Validation';
        const description = 'Test that FreightCode must be exactly 3 characters if provided.';

        const timestamp = Date.now();
        const inputs = {
            Name: `PWTEST${timestamp.toString().slice(-6)}`,
            BillingName: `PWTEST Freight Test ${timestamp}`,
            FreightCode: 'AB', // Invalid - must be 3 characters
            invalidFormats: ['A', 'AB', 'ABCD', '12345']
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="BillingName"]').fill(inputs.BillingName);
        await page.locator('input[name="FreightCode"]').fill(inputs.FreightCode);

        await page.waitForTimeout(500);

        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
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
            freightCodeError: validationMessages.some(msg => msg.toLowerCase().includes('freight')),
            redirectedToDetails: page.url().includes('/Details'),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/customer-scenario5-freight-code.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 6: Max Length Boundary Testing', async ({ page }) => {
        const scenarioName = 'Max Length Boundary Testing';
        const description = 'Test boundary conditions for maximum field lengths.';

        const timestamp = Date.now();
        const inputs = {
            Name: 'X'.repeat(25), // Max 20
            BillingName: 'Y'.repeat(60), // Max 50
            AccountingCode: 'Z'.repeat(25), // Max 20
            AccountingSyncId: 'A'.repeat(35), // Max 32
            TermsCode: 'B'.repeat(10), // Max 8
            PhoneNumber: '12345678901', // Max 10
            FaxNumber: '98765432101', // Max 10
            Address: 'C'.repeat(85), // Max 80
            City: 'D'.repeat(35), // Max 30
            State: 'TXX', // Max 2
            Zip: 'E'.repeat(15), // Max 10
            ExternalCode: 'F'.repeat(25), // Max 20
            FreightCode: 'ABCD', // Max 3
            CustomerType: 'G'.repeat(25) // Max 20
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="BillingName"]').fill(inputs.BillingName);
        await page.locator('input[name="AccountingCode"]').fill(inputs.AccountingCode);
        await page.locator('input[name="AccountingSyncId"]').fill(inputs.AccountingSyncId);
        await page.locator('input[name="TermsCode"]').fill(inputs.TermsCode);
        await page.locator('input[name="PhoneNumber"]').fill(inputs.PhoneNumber);
        await page.locator('input[name="FaxNumber"]').fill(inputs.FaxNumber);
        await page.locator('input[name="Address"]').fill(inputs.Address);
        await page.locator('input[name="City"]').fill(inputs.City);
        await page.locator('input[name="State"]').fill(inputs.State);
        await page.locator('input[name="Zip"]').fill(inputs.Zip);
        await page.locator('input[name="ExternalCode"]').fill(inputs.ExternalCode);
        await page.locator('input[name="FreightCode"]').fill(inputs.FreightCode);
        await page.locator('input[name="CustomerType"]').fill(inputs.CustomerType);

        await page.waitForTimeout(1000);

        // Check actual field values after input (client-side truncation)
        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
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
            fieldValuesAfterInput: actualValues,
            inputTruncatedByBrowser: {
                name: actualValues.name.length < inputs.Name.length,
                billingName: actualValues.billingName.length < inputs.BillingName.length,
                accountingCode: actualValues.accountingCode.length < inputs.AccountingCode.length,
                phoneNumber: actualValues.phoneNumber.length < inputs.PhoneNumber.length,
                state: actualValues.state.length < inputs.State.length
            },
            validationSummaryDisplayed: hasValidationSummary,
            validationMessages: validationMessages,
            redirectedToDetails: page.url().includes('/Details'),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/customer-scenario6-max-length.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 7: SQL Injection & XSS Security Testing', async ({ page }) => {
        const scenarioName = 'Security Testing - SQL Injection & XSS';
        const description = 'Attempt to inject malicious SQL and JavaScript code in various fields to verify input sanitization.';

        const timestamp = Date.now();
        const inputs = {
            Name: `'; DROP TABLE Customer; -- ${timestamp}`,
            BillingName: `<script>alert('XSS');</script>`,
            AccountingCode: `1' OR '1'='1`,
            EmailAddress: `test+<script>@example.com`,
            PhoneNumber: `<img src=x onerror=alert('XSS')>`,
            Address: `Robert'); DELETE FROM Customer WHERE 1=1; --`,
            City: `<iframe src="javascript:alert('XSS')"></iframe>`,
            State: `TX`,
            Zip: `12345`
        };

        await page.locator('input[name="Name"]').fill(inputs.Name);
        await page.locator('input[name="BillingName"]').fill(inputs.BillingName);
        await page.locator('input[name="AccountingCode"]').fill(inputs.AccountingCode);
        await page.locator('input[name="EmailAddress"]').fill(inputs.EmailAddress);
        await page.locator('input[name="PhoneNumber"]').fill(inputs.PhoneNumber);
        await page.locator('input[name="Address"]').fill(inputs.Address);
        await page.locator('input[name="City"]').fill(inputs.City);
        await page.locator('input[name="State"]').fill(inputs.State);
        await page.locator('input[name="Zip"]').fill(inputs.Zip);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
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
            redirectedToDetails: page.url().includes('/Details'),
            stayedOnCreatePage: page.url().includes('/Create'),
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/customer-scenario7-security-testing.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });
});
