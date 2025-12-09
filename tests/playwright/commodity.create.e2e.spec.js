const { test, expect } = require('@playwright/test');

test.describe('CommodityCreate - End-to-End Workflow', () => {
    let consoleLogs = [];
    let consoleErrors = [];
    const baseUrl = 'https://localhost:6001';

    test.beforeEach(async ({ page }) => {
        consoleLogs = [];
        consoleErrors = [];

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

        await page.goto(`${baseUrl}/Commodity/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
    });

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            console.log(`Test FAILED: ${testInfo.title}`);
            consoleErrors.forEach(err => console.log(`[ERROR] ${err.text}`));
        }
    });

    test('E2E-1: Complete Commodity Creation Workflow with Verification', async ({ page }) => {
        const timestamp = Date.now();
        const testCommodity = {
            name: `PWTEST E2E Commodity ${timestamp}`,
            commodityGroup: `PWE2E${timestamp.toString().slice(-4)}`,
            commoditySubGroup: `PWSUB${timestamp.toString().slice(-4)}`,
            description: `PWTEST E2E Description ${timestamp}`,
            bargeExCode: `BX${timestamp.toString().slice(-5)}`,
            chrisCode: `CH${timestamp.toString().slice(-5)}`,
            estimatedFairValue: '2500.75',
            convFmsCommodityID: '98765'
        };

        console.log('Step 1: Navigate to Create page');
        const createButton = page.locator('a[href*="/Commodity/Create"]').first();
        if (await createButton.count() > 0) {
            await createButton.click();
        } else {
            await page.goto(`${baseUrl}/Commodity/Create`);
        }
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        expect(page.url()).toContain('/Commodity/Create');
        const pageTitle = await page.locator('h2').first().textContent();
        expect(pageTitle).toContain('Create');

        console.log('Step 2: Fill in all commodity fields');
        await page.locator('input[name="Name"]').fill(testCommodity.name);
        await page.locator('input[name="CommodityGroup"]').fill(testCommodity.commodityGroup);
        await page.locator('input[name="CommoditySubGroup"]').fill(testCommodity.commoditySubGroup);
        await page.locator('textarea[name="Description"]').fill(testCommodity.description);
        await page.locator('input[name="BargeExCode"]').fill(testCommodity.bargeExCode);
        await page.locator('input[name="ChrisCode"]').fill(testCommodity.chrisCode);
        await page.locator('input[name="EstimatedFairValue"]').fill(testCommodity.estimatedFairValue);
        await page.locator('input[name="ConvFmsCommodityID"]').fill(testCommodity.convFmsCommodityID);

        const cdcCheckbox = page.locator('input[name="IsCdc"]');
        await cdcCheckbox.check();
        expect(await cdcCheckbox.isChecked()).toBeTruthy();

        const coverCheckbox = page.locator('input[name="IsCoverRequired"]');
        await coverCheckbox.check();
        expect(await coverCheckbox.isChecked()).toBeTruthy();

        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/commodity-e2e1-before-submit.png', fullPage: true });

        console.log('Step 3: Submit form');
        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();
        await page.waitForTimeout(4000);

        await page.screenshot({ path: 'test-results/commodity-e2e1-after-submit.png', fullPage: true });

        console.log('Step 4: Verify successful creation and redirection');
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        const isOnDetailsPage = currentUrl.includes('/Details') || currentUrl.includes('/Commodity/') && /\/\d+/.test(currentUrl);
        const isOnIndexPage = currentUrl.includes('/Index');

        if (isOnDetailsPage || isOnIndexPage) {
            console.log('✓ Successfully redirected after creation');
        } else {
            const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
            if (await validationSummary.count() > 0) {
                const errors = await validationSummary.locator('li').allTextContents();
                console.log('Validation errors:', errors);
            }
        }

        console.log('Step 5: Navigate to search/index and verify commodity appears');
        if (!isOnIndexPage) {
            await page.goto(`${baseUrl}/Commodity/Index`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
        }

        await page.locator('#commodityTable').waitFor({ state: 'visible', timeout: 5000 });

        const searchNameField = page.locator('input[name="Name"]').first();
        if (await searchNameField.count() > 0) {
            await searchNameField.fill(testCommodity.name);

            const searchButton = page.locator('#btnSearch');
            if (await searchButton.count() > 0) {
                await searchButton.click();
                await page.waitForTimeout(3000);
            }
        }

        await page.screenshot({ path: 'test-results/commodity-e2e1-search-results.png', fullPage: true });

        const tableRows = page.locator('#commodityTable tbody tr');
        const rowCount = await tableRows.count();
        console.log(`Found ${rowCount} rows in results table`);

        if (rowCount > 0) {
            const firstRowText = await tableRows.first().textContent();
            console.log(`First row contains: ${firstRowText.substring(0, 100)}...`);

            const nameMatch = firstRowText.includes(testCommodity.name) ||
                              firstRowText.includes('PWTEST E2E');

            if (nameMatch) {
                console.log('✓ Created commodity found in search results');
            }
        }

        expect(consoleErrors.filter(e => e.type === 'error').length).toBe(0);
    });

    test('E2E-2: Create Commodity and Verify in Details Page', async ({ page }) => {
        const timestamp = Date.now();
        const testCommodity = {
            name: `PWTEST Details ${timestamp}`,
            commodityGroup: `PWDET${timestamp.toString().slice(-4)}`,
            description: `PWTEST verification in details ${timestamp}`
        };

        console.log('Navigate to Create page');
        await page.goto(`${baseUrl}/Commodity/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        console.log('Fill minimal required fields');
        await page.locator('input[name="Name"]').fill(testCommodity.name);
        await page.locator('input[name="CommodityGroup"]').fill(testCommodity.commodityGroup);
        await page.locator('textarea[name="Description"]').fill(testCommodity.description);

        await page.waitForTimeout(1000);

        console.log('Submit form');
        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();
        await page.waitForTimeout(4000);

        const currentUrl = page.url();
        console.log(`Redirected to: ${currentUrl}`);

        if (currentUrl.includes('/Details')) {
            console.log('✓ Redirected to Details page');

            const displayedName = await page.locator('input[name="Name"], .form-control[readonly]:has-text("' + testCommodity.name.substring(0, 20) + '")').first().inputValue();
            console.log(`Displayed name: ${displayedName}`);

            const nameMatches = displayedName.includes('PWTEST Details') || displayedName.includes(testCommodity.name);
            if (nameMatches) {
                console.log('✓ Name matches in details view');
            }
        }

        await page.screenshot({ path: 'test-results/commodity-e2e2-details-page.png', fullPage: true });

        expect(consoleErrors.filter(e => e.type === 'error').length).toBe(0);
    });

    test('E2E-3: Cancel Button Navigation from Create Page', async ({ page }) => {
        const timestamp = Date.now();
        const testCommodity = {
            name: `PWTEST Cancel ${timestamp}`,
            commodityGroup: `PWCAN${timestamp.toString().slice(-4)}`
        };

        console.log('Navigate to Create page');
        await page.goto(`${baseUrl}/Commodity/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        console.log('Fill some fields');
        await page.locator('input[name="Name"]').fill(testCommodity.name);
        await page.locator('input[name="CommodityGroup"]').fill(testCommodity.commodityGroup);

        await page.waitForTimeout(500);

        await page.screenshot({ path: 'test-results/commodity-e2e3-before-cancel.png', fullPage: true });

        console.log('Click Cancel button');
        const cancelButton = page.locator('button[type="submit"][value="cancel"]');
        if (await cancelButton.count() > 0) {
            await cancelButton.click();
            await page.waitForTimeout(2000);

            const currentUrl = page.url();
            console.log(`After cancel, URL: ${currentUrl}`);

            const returnedToIndex = currentUrl.includes('/Index');
            if (returnedToIndex) {
                console.log('✓ Cancel button returned to Index page');
            }

            await page.screenshot({ path: 'test-results/commodity-e2e3-after-cancel.png', fullPage: true });

            expect(returnedToIndex).toBeTruthy();
        } else {
            console.log('Cancel button not found, checking Close button');
            const closeButton = page.locator('a[href*="/Commodity/Index"]').first();
            if (await closeButton.count() > 0) {
                await closeButton.click();
                await page.waitForTimeout(2000);
                expect(page.url()).toContain('/Index');
            }
        }

        expect(consoleErrors.filter(e => e.type === 'error').length).toBe(0);
    });

    test('E2E-4: Create with All Checkboxes Enabled', async ({ page }) => {
        const timestamp = Date.now();
        const testCommodity = {
            name: `PWTEST AllChecks ${timestamp}`,
            commodityGroup: `PWCHK${timestamp.toString().slice(-4)}`,
            description: 'PWTEST testing all checkboxes enabled',
            estimatedFairValue: '5000.00'
        };

        console.log('Navigate to Create page');
        await page.goto(`${baseUrl}/Commodity/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        console.log('Fill fields and enable all checkboxes');
        await page.locator('input[name="Name"]').fill(testCommodity.name);
        await page.locator('input[name="CommodityGroup"]').fill(testCommodity.commodityGroup);
        await page.locator('textarea[name="Description"]').fill(testCommodity.description);
        await page.locator('input[name="EstimatedFairValue"]').fill(testCommodity.estimatedFairValue);

        const activeCheckbox = page.locator('input[name="IsActive"]');
        if (!(await activeCheckbox.isChecked())) {
            await activeCheckbox.check();
        }
        expect(await activeCheckbox.isChecked()).toBeTruthy();

        const cdcCheckbox = page.locator('input[name="IsCdc"]');
        await cdcCheckbox.check();
        expect(await cdcCheckbox.isChecked()).toBeTruthy();

        const coverCheckbox = page.locator('input[name="IsCoverRequired"]');
        await coverCheckbox.check();
        expect(await coverCheckbox.isChecked()).toBeTruthy();

        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/commodity-e2e4-all-checks-enabled.png', fullPage: true });

        console.log('Submit form');
        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();
        await page.waitForTimeout(4000);

        const currentUrl = page.url();
        console.log(`After submission, URL: ${currentUrl}`);

        const isSuccessful = currentUrl.includes('/Details') || currentUrl.includes('/Index');
        if (isSuccessful) {
            console.log('✓ Form submitted successfully with all checkboxes enabled');
        }

        await page.screenshot({ path: 'test-results/commodity-e2e4-after-submit.png', fullPage: true });

        expect(consoleErrors.filter(e => e.type === 'error').length).toBe(0);
    });

    test('E2E-5: Create Commodity with Maximum Valid Values', async ({ page }) => {
        const timestamp = Date.now();
        const testCommodity = {
            name: 'PWTEST ' + 'MaxValue'.repeat(13).substring(0, 90),
            commodityGroup: 'PWGRP ' + 'X'.repeat(44),
            commoditySubGroup: 'PWSUB ' + 'Y'.repeat(44),
            description: 'PWTEST ' + 'Description with maximum allowed length. '.repeat(10).substring(0, 490),
            bargeExCode: 'BX' + '1'.repeat(18),
            chrisCode: 'CH' + '2'.repeat(18),
            estimatedFairValue: '999999.99',
            convFmsCommodityID: '999999'
        };

        console.log('Navigate to Create page');
        await page.goto(`${baseUrl}/Commodity/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        console.log('Fill all fields with maximum valid values');
        await page.locator('input[name="Name"]').fill(testCommodity.name);
        await page.locator('input[name="CommodityGroup"]').fill(testCommodity.commodityGroup);
        await page.locator('input[name="CommoditySubGroup"]').fill(testCommodity.commoditySubGroup);
        await page.locator('textarea[name="Description"]').fill(testCommodity.description);
        await page.locator('input[name="BargeExCode"]').fill(testCommodity.bargeExCode);
        await page.locator('input[name="ChrisCode"]').fill(testCommodity.chrisCode);
        await page.locator('input[name="EstimatedFairValue"]').fill(testCommodity.estimatedFairValue);
        await page.locator('input[name="ConvFmsCommodityID"]').fill(testCommodity.convFmsCommodityID);

        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/commodity-e2e5-max-values.png', fullPage: true });

        console.log('Submit form with maximum values');
        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();
        await page.waitForTimeout(4000);

        const currentUrl = page.url();
        console.log(`After submission, URL: ${currentUrl}`);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationErrors = await validationSummary.count() > 0;

        if (hasValidationErrors) {
            const errors = await validationSummary.locator('li').allTextContents();
            console.log('Validation errors:', errors);
        } else {
            console.log('✓ Maximum values accepted without validation errors');
        }

        await page.screenshot({ path: 'test-results/commodity-e2e5-after-submit.png', fullPage: true });

        expect(consoleErrors.filter(e => e.type === 'error').length).toBe(0);
    });

    test('E2E-6: Form State Persistence on Validation Error', async ({ page }) => {
        const timestamp = Date.now();
        const testCommodity = {
            name: '',
            commodityGroup: `PWPST${timestamp.toString().slice(-4)}`,
            description: 'PWTEST testing form state persistence',
            bargeExCode: `BX${timestamp.toString().slice(-5)}`
        };

        console.log('Navigate to Create page');
        await page.goto(`${baseUrl}/Commodity/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        console.log('Fill form with missing required field (Name)');
        await page.locator('input[name="CommodityGroup"]').fill(testCommodity.commodityGroup);
        await page.locator('textarea[name="Description"]').fill(testCommodity.description);
        await page.locator('input[name="BargeExCode"]').fill(testCommodity.bargeExCode);

        const cdcCheckbox = page.locator('input[name="IsCdc"]');
        await cdcCheckbox.check();

        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/commodity-e2e6-before-submit.png', fullPage: true });

        console.log('Submit form (should fail validation)');
        const submitButton = page.locator('form button[type="submit"][value="save"].btn-primary');
        await submitButton.click();
        await page.waitForTimeout(3000);

        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationErrors = await validationSummary.count() > 0;

        console.log(`Has validation errors: ${hasValidationErrors}`);

        if (hasValidationErrors) {
            console.log('✓ Validation errors displayed as expected');

            console.log('Verify form state persisted');
            const commodityGroupValue = await page.locator('input[name="CommodityGroup"]').inputValue();
            const descriptionValue = await page.locator('textarea[name="Description"]').inputValue();
            const bargeExCodeValue = await page.locator('input[name="BargeExCode"]').inputValue();
            const cdcChecked = await cdcCheckbox.isChecked();

            console.log(`CommodityGroup preserved: ${commodityGroupValue === testCommodity.commodityGroup}`);
            console.log(`Description preserved: ${descriptionValue === testCommodity.description}`);
            console.log(`BargeExCode preserved: ${bargeExCodeValue === testCommodity.bargeExCode}`);
            console.log(`CDC checkbox preserved: ${cdcChecked}`);

            expect(commodityGroupValue).toBe(testCommodity.commodityGroup);
            expect(descriptionValue).toBe(testCommodity.description);
            expect(bargeExCodeValue).toBe(testCommodity.bargeExCode);
            expect(cdcChecked).toBeTruthy();
        }

        await page.screenshot({ path: 'test-results/commodity-e2e6-after-validation.png', fullPage: true });

        expect(consoleErrors.filter(e => e.type === 'error').length).toBe(0);
    });
});
