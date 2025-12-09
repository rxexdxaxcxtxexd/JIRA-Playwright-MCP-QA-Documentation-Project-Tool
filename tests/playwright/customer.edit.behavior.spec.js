const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('CustomerEdit - Form Behavior Analysis', () => {
    let testReport = {
        testSuite: 'CustomerEdit Form Behavior',
        timestamp: new Date().toISOString(),
        baseURL: 'https://localhost:6001/Customer/Edit',
        scenarios: []
    };

    let consoleLogs = [];
    let consoleErrors = [];
    let networkRequests = [];
    let networkResponses = [];
    let testCustomerId = null;

    test.beforeAll(async ({ browser }) => {
        // Create a test customer to use for edit tests
        const page = await browser.newPage();
        const timestamp = Date.now();

        await page.goto('https://localhost:6001/Customer/Create');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        const testCustomer = {
            name: `PWTEST${timestamp.toString().slice(-6)}`,
            billingName: `PWTEST Edit Test Customer ${timestamp}`
        };

        await page.locator('input[name="Name"]').fill(testCustomer.name);
        await page.locator('input[name="BillingName"]').fill(testCustomer.billingName);

        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(4000);

        // Extract customer ID from URL
        const url = page.url();
        const match = url.match(/\/Customer\/Details\/(\d+)/);
        if (match) {
            testCustomerId = match[1];
            console.log('Created test customer with ID:', testCustomerId);
        }

        await page.close();
    });

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

        if (testCustomerId) {
            await page.goto(`https://localhost:6001/Customer/Edit/${testCustomerId}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1500);
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
        console.log('\nNETWORK ACTIVITY:');
        networkResponses.forEach(resp => {
            console.log(`${resp.method || 'RESPONSE'} ${resp.url} - Status: ${resp.status}`);
        });
        console.log('========================================\n');
    }

    test.afterAll(async () => {
        const reportPath = path.join(__dirname, '..', 'test-results', 'CustomerEdit_FORM_BEHAVIOR_REPORT.md');

        let markdown = `# CustomerEdit Form Behavior Report\n\n`;
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

    test('Scenario 1: Load Existing Customer for Edit', async ({ page }) => {
        const scenarioName = 'Load Existing Customer';
        const description = 'Verify that existing customer data loads correctly in edit form.';

        const inputs = {
            customerId: testCustomerId,
            action: 'load'
        };

        // Capture loaded values
        const originalName = await page.locator('input[name="Name"]').inputValue();
        const originalBillingName = await page.locator('input[name="BillingName"]').inputValue();
        const isActive = await page.locator('input[name="IsActive"]').isChecked();

        const observations = {
            customerIdLoaded: testCustomerId,
            formLoaded: true,
            nameFieldPopulated: originalName.length > 0,
            billingNameFieldPopulated: originalBillingName.length > 0,
            originalName: originalName,
            originalBillingName: originalBillingName,
            isActive: isActive,
            pageTitle: await page.locator('h2').textContent()
        };

        await page.screenshot({ path: 'test-results/customer-edit-scenario1-load.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);

        expect(originalName).toContain('PWTEST');
        expect(originalBillingName).toContain('PWTEST');
    });

    test('Scenario 2: Update Valid Customer Fields', async ({ page }) => {
        const scenarioName = 'Update Valid Customer Fields';
        const description = 'Update customer fields with valid data and verify successful save.';

        const timestamp = Date.now();
        const inputs = {
            customerId: testCustomerId,
            updatedEmail: `updated${timestamp}@example.com`,
            updatedPhone: '5559876543',
            updatedAddress: 'Updated PWTEST Address',
            updatedCity: 'Updated City',
            updatedState: 'CA',
            updatedZip: '54321'
        };

        // Update fields
        await page.locator('input[name="EmailAddress"]').fill(inputs.updatedEmail);
        await page.locator('input[name="PhoneNumber"]').fill(inputs.updatedPhone);
        await page.locator('input[name="Address"]').fill(inputs.updatedAddress);
        await page.locator('input[name="City"]').fill(inputs.updatedCity);
        await page.locator('input[name="State"]').fill(inputs.updatedState);
        await page.locator('input[name="Zip"]').fill(inputs.updatedZip);

        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/customer-edit-scenario2-before-save.png', fullPage: true });

        // Submit form
        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(4000);

        await page.screenshot({ path: 'test-results/customer-edit-scenario2-after-save.png', fullPage: true });

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationError = await validationSummary.count() > 0;

        // Verify updated values
        const savedEmail = await page.locator('input[name="EmailAddress"]').inputValue();
        const savedPhone = await page.locator('input[name="PhoneNumber"]').inputValue();
        const savedCity = await page.locator('input[name="City"]').inputValue();

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationErrorDisplayed: hasValidationError,
            redirectedToDetails: page.url().includes('/Details'),
            emailUpdated: savedEmail === inputs.updatedEmail,
            phoneUpdated: savedPhone === inputs.updatedPhone,
            cityUpdated: savedCity === inputs.updatedCity,
            currentUrl: page.url()
        };

        captureScenarioResult(scenarioName, description, inputs, observations);

        expect(hasValidationError).toBeFalsy();
        expect(savedEmail).toBe(inputs.updatedEmail);
    });

    test('Scenario 3: Clear Required Fields - Validation Error', async ({ page }) => {
        const scenarioName = 'Clear Required Fields';
        const description = 'Clear required Name and BillingName fields to trigger validation errors.';

        const inputs = {
            customerId: testCustomerId,
            name: '',
            billingName: '',
            action: 'clear_required_fields'
        };

        // Clear required fields
        await page.locator('input[name="Name"]').fill('');
        await page.locator('input[name="BillingName"]').fill('');

        await page.waitForTimeout(500);

        await page.screenshot({ path: 'test-results/customer-edit-scenario3-before-submit.png', fullPage: true });

        // Submit form
        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
        await submitButton.click();
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'test-results/customer-edit-scenario3-validation-error.png', fullPage: true });

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationError = await validationSummary.count() > 0;
        let validationMessages = [];

        if (hasValidationError) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
        }

        const observations = {
            formSubmitted: networkRequests.length > 0,
            validationErrorDisplayed: hasValidationError,
            validationMessages: validationMessages,
            nameErrorPresent: validationMessages.some(msg => msg.toLowerCase().includes('name')),
            stayedOnEditPage: page.url().includes('/Edit') || page.url().includes('/Save'),
            currentUrl: page.url()
        };

        captureScenarioResult(scenarioName, description, inputs, observations);

        expect(hasValidationError).toBeTruthy();
    });

    test('Scenario 4: Update Invoice Settings', async ({ page }) => {
        const scenarioName = 'Update Invoice Settings';
        const description = 'Change invoice delivery options and verify settings persist.';

        const inputs = {
            customerId: testCustomerId,
            sendInvoiceOptions: 'Print and Email',
            sendSingleInvoicePerEmail: true
        };

        // Update invoice settings
        const invoiceDropdown = page.locator('select[name="SendInvoiceOptions"]');
        await invoiceDropdown.selectOption('Print and Email');

        const singleInvoiceCheckbox = page.locator('input[name="SendSingleInvoicePerEmail"]');
        await singleInvoiceCheckbox.check();

        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/customer-edit-scenario4-before-save.png', fullPage: true });

        // Submit form
        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(4000);

        await page.screenshot({ path: 'test-results/customer-edit-scenario4-after-save.png', fullPage: true });

        // Verify settings saved
        const savedInvoiceOption = await page.locator('select[name="SendInvoiceOptions"]').inputValue();
        const savedSingleInvoice = await page.locator('input[name="SendSingleInvoicePerEmail"]').isChecked();

        const observations = {
            formSubmitted: networkRequests.length > 0,
            invoiceOptionSaved: savedInvoiceOption === 'Print and Email',
            singleInvoiceSaved: savedSingleInvoice === true,
            currentUrl: page.url()
        };

        captureScenarioResult(scenarioName, description, inputs, observations);

        expect(savedInvoiceOption).toBe('Print and Email');
        expect(savedSingleInvoice).toBeTruthy();
    });

    test('Scenario 5: Toggle Portal and BargeEx Settings', async ({ page }) => {
        const scenarioName = 'Toggle Portal and BargeEx';
        const description = 'Enable/disable Portal and BargeEx settings and verify they persist.';

        const inputs = {
            customerId: testCustomerId,
            enablePortal: true,
            isBargeExEnabled: true
        };

        // Enable checkboxes
        const portalCheckbox = page.locator('input[name="EnablePortal"]');
        await portalCheckbox.check();

        const bargeExCheckbox = page.locator('input[name="IsBargeExEnabled"]');
        await bargeExCheckbox.check();

        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/customer-edit-scenario5-before-save.png', fullPage: true });

        // Submit form
        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(4000);

        await page.screenshot({ path: 'test-results/customer-edit-scenario5-after-save.png', fullPage: true });

        // Verify settings saved
        const portalEnabled = await page.locator('input[name="EnablePortal"]').isChecked();
        const bargeExEnabled = await page.locator('input[name="IsBargeExEnabled"]').isChecked();

        const observations = {
            formSubmitted: networkRequests.length > 0,
            portalEnabledSaved: portalEnabled === true,
            bargeExEnabledSaved: bargeExEnabled === true,
            currentUrl: page.url()
        };

        captureScenarioResult(scenarioName, description, inputs, observations);

        expect(portalEnabled).toBeTruthy();
        expect(bargeExEnabled).toBeTruthy();
    });

    test('Scenario 6: SQL Injection & XSS Security Testing', async ({ page }) => {
        const scenarioName = 'Security Testing - SQL Injection & XSS';
        const description = 'Attempt to inject malicious SQL and JavaScript code in edit form fields.';

        const timestamp = Date.now();
        const inputs = {
            customerId: testCustomerId,
            accountingCode: `'; DROP TABLE Customer; --`,
            address: `<script>alert('XSS');</script>`,
            city: `Robert'); DELETE FROM Customer; --`,
            emailAddress: `test+<script>@example.com`
        };

        await page.locator('input[name="AccountingCode"]').fill(inputs.accountingCode);
        await page.locator('input[name="Address"]').fill(inputs.address);
        await page.locator('input[name="City"]').fill(inputs.city);
        await page.locator('input[name="EmailAddress"]').fill(inputs.emailAddress);

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
        const hasValidationError = await validationSummary.count() > 0;

        const observations = {
            formSubmitted: networkRequests.length > 0,
            maliciousInputsAttempted: Object.keys(inputs).length - 1,
            xssVulnerability: {
                unescapedScriptInDOM: hasUnescapedScript,
                scriptExecuted: hasScriptExecuted
            },
            validationErrorDisplayed: hasValidationError,
            potentialVulnerability: hasUnescapedScript || hasScriptExecuted,
            currentUrl: page.url()
        };

        await page.screenshot({ path: 'test-results/customer-edit-scenario6-security.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });
});
