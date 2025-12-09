const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('BoatLocationSearch - Comprehensive Form Behavior Analysis', () => {
    let testReport = {
        testSuite: 'BoatLocationSearch Form Behavior',
        timestamp: new Date().toISOString(),
        baseURL: 'https://localhost:6001/BoatLocationSearch/Index',
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
            if (request.url().includes('BoatLocationTable') || request.url().includes('BoatLocationSearch')) {
                networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    postData: request.postData(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        page.on('response', async response => {
            if (response.url().includes('BoatLocationTable') || response.url().includes('BoatLocationSearch')) {
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

        await page.goto('https://localhost:6001/BoatLocationSearch/Index');
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
                    log.text.includes('[BoatLocationSearch]') ||
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
        const reportPath = path.join(__dirname, '..', 'test-results', 'BoatLocationSearch_FORM_BEHAVIOR_REPORT.md');

        let markdown = `# BoatLocationSearch Form Behavior Report\n\n`;
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
        const description = 'Submit the search form with all text fields empty and only default checkbox values. This tests whether the form allows empty searches and what default behavior occurs.';

        const findButton = page.locator('#btnSearch');

        const activeOnlyInitial = await page.locator('input[name="ActiveOnly"][type="checkbox"]').isChecked();

        const inputs = {
            BoatName: '',
            ShortName: '',
            UscgNum: '',
            OwnerId: '',
            OperatorId: '',
            ActiveOnly: activeOnlyInitial,
            FleetOnly: false,
            AssistSupplyTugsOnly: false,
            OnboardOnly: false
        };

        await findButton.click();
        await page.waitForTimeout(3000);

        const resultsTable = page.locator('#boatLocationTable');
        const tableVisible = await resultsTable.count() > 0;
        let rowCount = 0;
        let noDataMessage = '';

        if (tableVisible) {
            await page.waitForTimeout(2000);
            rowCount = await page.locator('#boatLocationTable tbody tr').count();

            if (rowCount > 0) {
                const firstCell = await page.locator('#boatLocationTable tbody tr td').first();
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

        await page.screenshot({ path: 'test-results/scenario1-empty-submission.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 2: Invalid Data Types - Text in Numeric Fields', async ({ page }) => {
        const scenarioName = 'Invalid Data Types';
        const description = 'Attempt to enter alphabetic characters in USCG number field and verify client-side validation. Also test dropdown selections with invalid values.';

        const uscgInput = page.locator('input[name="UscgNum"]');
        const ownerSelect = page.locator('select[name="OwnerId"]');
        const findButton = page.locator('#btnSearch');

        const inputs = {
            BoatName: '',
            ShortName: '',
            UscgNum: 'ABCD-XYZ-9999',
            OwnerId: 'invalid',
            OperatorId: '',
            ActiveOnly: true,
            FleetOnly: false,
            AssistSupplyTugsOnly: false,
            OnboardOnly: false
        };

        await uscgInput.fill(inputs.UscgNum);

        await page.waitForTimeout(500);

        const actualUscg = await uscgInput.inputValue();
        const hasValidationError = await page.locator('span[data-valmsg-for="UscgNum"]').count() > 0;
        const validationMessage = hasValidationError
            ? await page.locator('span[data-valmsg-for="UscgNum"]').textContent()
            : '';

        await findButton.click();
        await page.waitForTimeout(3000);

        const observations = {
            inputAccepted: actualUscg === inputs.UscgNum,
            actualValue: actualUscg,
            clientValidationTriggered: hasValidationError,
            validationMessage: validationMessage,
            formSubmitted: networkRequests.length > 0,
            serverResponse: networkResponses.length > 0,
            errorDisplayed: await page.locator('.alert-danger, .alert-warning').count() > 0,
            rowCount: await page.locator('#boatLocationTable tbody tr').count()
        };

        await page.screenshot({ path: 'test-results/scenario2-invalid-data-types.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 3: Boundary Values - Maximum Length Exceeded', async ({ page }) => {
        const scenarioName = 'Boundary Values - Maximum Length';
        const description = 'Test field length restrictions by entering values that exceed the maximum allowed length (BoatName: 50, ShortName: 10, UscgNum: 10).';

        const boatNameInput = page.locator('input[name="BoatName"]');
        const shortNameInput = page.locator('input[name="ShortName"]');
        const uscgInput = page.locator('input[name="UscgNum"]');
        const findButton = page.locator('#btnSearch');

        const inputs = {
            BoatName: 'A'.repeat(75),
            ShortName: 'B'.repeat(20),
            UscgNum: '1'.repeat(25),
            OwnerId: '',
            OperatorId: '',
            ActiveOnly: true,
            FleetOnly: false,
            AssistSupplyTugsOnly: false,
            OnboardOnly: false
        };

        await boatNameInput.fill(inputs.BoatName);
        await shortNameInput.fill(inputs.ShortName);
        await uscgInput.fill(inputs.UscgNum);

        await page.waitForTimeout(500);

        const actualBoatName = await boatNameInput.inputValue();
        const actualShortName = await shortNameInput.inputValue();
        const actualUscg = await uscgInput.inputValue();

        await findButton.click();
        await page.waitForTimeout(3000);

        const observations = {
            boatName: {
                inputLength: inputs.BoatName.length,
                actualLength: actualBoatName.length,
                truncated: actualBoatName.length < inputs.BoatName.length,
                maxLengthEnforced: actualBoatName.length <= 50
            },
            shortName: {
                inputLength: inputs.ShortName.length,
                actualLength: actualShortName.length,
                truncated: actualShortName.length < inputs.ShortName.length,
                maxLengthEnforced: actualShortName.length <= 10
            },
            uscgNum: {
                inputLength: inputs.UscgNum.length,
                actualLength: actualUscg.length,
                truncated: actualUscg.length < inputs.UscgNum.length,
                maxLengthEnforced: actualUscg.length <= 10
            },
            formSubmitted: networkRequests.length > 0,
            errorDisplayed: await page.locator('.alert-danger, .alert-warning').count() > 0,
            rowCount: await page.locator('#boatLocationTable tbody tr').count()
        };

        await page.screenshot({ path: 'test-results/scenario3-boundary-values.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 4: SQL Injection & XSS Attempts', async ({ page }) => {
        const scenarioName = 'Security Testing - SQL Injection & XSS';
        const description = 'Attempt to inject malicious SQL and JavaScript code to verify that inputs are properly sanitized and escaped.';

        const boatNameInput = page.locator('input[name="BoatName"]');
        const shortNameInput = page.locator('input[name="ShortName"]');
        const uscgInput = page.locator('input[name="UscgNum"]');
        const findButton = page.locator('#btnSearch');

        const inputs = {
            BoatName: "'; DROP TABLE BoatLocation; --",
            ShortName: "<script>alert('XSS')</script>",
            UscgNum: "1' OR '1'='1",
            OwnerId: '',
            OperatorId: '',
            ActiveOnly: true,
            FleetOnly: false,
            AssistSupplyTugsOnly: false,
            OnboardOnly: false
        };

        await boatNameInput.fill(inputs.BoatName);
        await shortNameInput.fill(inputs.ShortName);
        await uscgInput.fill(inputs.UscgNum);

        await page.waitForTimeout(500);

        await findButton.click();
        await page.waitForTimeout(3000);

        const pageContent = await page.content();
        const hasUnescapedScript = pageContent.includes('<script>alert(');
        const hasScriptExecuted = await page.evaluate(() => {
            return window.xssTestExecuted === true;
        });

        const observations = {
            sqlInjectionAttempt: inputs.BoatName,
            xssAttempt: inputs.ShortName,
            formSubmitted: networkRequests.length > 0,
            serverResponse: networkResponses.length > 0,
            xssVulnerability: {
                unescapedScriptInDOM: hasUnescapedScript,
                scriptExecuted: hasScriptExecuted
            },
            serverError: await page.locator('.alert-danger').count() > 0,
            errorMessage: await page.locator('.alert-danger').count() > 0
                ? await page.locator('.alert-danger').textContent()
                : '',
            rowCount: await page.locator('#boatLocationTable tbody tr').count(),
            potentialVulnerability: hasUnescapedScript || hasScriptExecuted
        };

        await page.screenshot({ path: 'test-results/scenario4-security-testing.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 5: Mismatched Data - Conflicting Filter Combinations', async ({ page }) => {
        const scenarioName = 'Mismatched Data - Conflicting Filters';
        const description = 'Select multiple exclusive filters simultaneously (e.g., Fleet Only + Onboard Only) to test if the application handles logical conflicts appropriately.';

        const boatNameInput = page.locator('input[name="BoatName"]');
        const activeOnlyCheck = page.locator('input[name="ActiveOnly"][type="checkbox"]');
        const fleetOnlyCheck = page.locator('input[name="FleetOnly"][type="checkbox"]');
        const assistSupplyCheck = page.locator('input[name="AssistSupplyTugsOnly"][type="checkbox"]');
        const onboardOnlyCheck = page.locator('input[name="OnboardOnly"][type="checkbox"]');
        const findButton = page.locator('#btnSearch');

        const inputs = {
            BoatName: 'NONEXISTENT_BOAT_12345',
            ShortName: '',
            UscgNum: '',
            OwnerId: '',
            OperatorId: '',
            ActiveOnly: false,
            FleetOnly: true,
            AssistSupplyTugsOnly: true,
            OnboardOnly: true
        };

        await boatNameInput.fill(inputs.BoatName);

        if (await activeOnlyCheck.isChecked()) {
            await activeOnlyCheck.uncheck();
        }

        await fleetOnlyCheck.check();
        await assistSupplyCheck.check();
        await onboardOnlyCheck.check();

        await page.waitForTimeout(500);

        await findButton.click();
        await page.waitForTimeout(3000);

        const rowCount = await page.locator('#boatLocationTable tbody tr').count();
        const noDataMessage = rowCount > 0
            ? await page.locator('#boatLocationTable tbody tr td').first().textContent()
            : '';

        const observations = {
            allFiltersSelected: {
                ActiveOnly: await activeOnlyCheck.isChecked(),
                FleetOnly: await fleetOnlyCheck.isChecked(),
                AssistSupplyTugsOnly: await assistSupplyCheck.isChecked(),
                OnboardOnly: await onboardOnlyCheck.isChecked()
            },
            formSubmitted: networkRequests.length > 0,
            serverResponse: networkResponses.length > 0,
            rowCount: rowCount,
            noDataMessage: noDataMessage,
            errorDisplayed: await page.locator('.alert-danger, .alert-warning').count() > 0,
            emptyResultSet: rowCount === 0 || noDataMessage.toLowerCase().includes('no data')
        };

        await page.screenshot({ path: 'test-results/scenario5-mismatched-data.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 6: Special Characters & Unicode', async ({ page }) => {
        const scenarioName = 'Special Characters & Unicode';
        const description = 'Test form handling of special characters, Unicode symbols, and non-ASCII text to verify internationalization support.';

        const boatNameInput = page.locator('input[name="BoatName"]');
        const shortNameInput = page.locator('input[name="ShortName"]');
        const uscgInput = page.locator('input[name="UscgNum"]');
        const findButton = page.locator('#btnSearch');

        const inputs = {
            BoatName: '船舶名稱 Łódź Barco €$¥',
            ShortName: 'Ñoño™',
            UscgNum: '©®™',
            OwnerId: '',
            OperatorId: '',
            ActiveOnly: true,
            FleetOnly: false,
            AssistSupplyTugsOnly: false,
            OnboardOnly: false
        };

        await boatNameInput.fill(inputs.BoatName);
        await shortNameInput.fill(inputs.ShortName);
        await uscgInput.fill(inputs.UscgNum);

        await page.waitForTimeout(500);

        const actualBoatName = await boatNameInput.inputValue();
        const actualShortName = await shortNameInput.inputValue();
        const actualUscg = await uscgInput.inputValue();

        await findButton.click();
        await page.waitForTimeout(3000);

        const observations = {
            unicodeAccepted: {
                boatName: actualBoatName === inputs.BoatName,
                shortName: actualShortName === inputs.ShortName,
                uscgNum: actualUscg === inputs.UscgNum
            },
            actualValues: {
                boatName: actualBoatName,
                shortName: actualShortName,
                uscgNum: actualUscg
            },
            formSubmitted: networkRequests.length > 0,
            serverResponse: networkResponses.length > 0,
            errorDisplayed: await page.locator('.alert-danger, .alert-warning').count() > 0,
            rowCount: await page.locator('#boatLocationTable tbody tr').count(),
            encodingIssues: (
                actualBoatName !== inputs.BoatName ||
                actualShortName !== inputs.ShortName ||
                actualUscg !== inputs.UscgNum
            )
        };

        await page.screenshot({ path: 'test-results/scenario6-special-characters.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });

    test('Scenario 7: Rapid Form Submission - Multiple Clicks', async ({ page }) => {
        const scenarioName = 'Rapid Form Submission';
        const description = 'Click the Find button multiple times rapidly to test if the application prevents duplicate submissions and handles concurrent requests properly.';

        const boatNameInput = page.locator('input[name="BoatName"]');
        const findButton = page.locator('#btnSearch');

        const inputs = {
            BoatName: 'TEST',
            ShortName: '',
            UscgNum: '',
            OwnerId: '',
            OperatorId: '',
            ActiveOnly: true,
            FleetOnly: false,
            AssistSupplyTugsOnly: false,
            OnboardOnly: false
        };

        await boatNameInput.fill(inputs.BoatName);

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
            rowCount: await page.locator('#boatLocationTable tbody tr').count(),
            potentialIssue: requestsCreated > 1
        };

        await page.screenshot({ path: 'test-results/scenario7-rapid-submission.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);
    });
});
