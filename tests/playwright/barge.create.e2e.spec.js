const { test, expect } = require('@playwright/test');

test.describe('Barge Create - End-to-End Workflow', () => {
    let consoleLogs = [];
    let consoleErrors = [];

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

        await page.goto('https://localhost:6001/BargeSearch/Index');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
    });

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            console.log(`Test FAILED: ${testInfo.title}`);
            consoleErrors.forEach(err => console.log(`[ERROR] ${err.text}`));
            await page.screenshot({
                path: `test-results/barge-create-e2e-FAILED-${testInfo.title.replace(/\s+/g, '-')}.png`,
                fullPage: true
            });
        }
    });

    test('E2E Test 1: Complete Barge Creation Workflow with Verification', async ({ page }) => {
        const timestamp = Date.now();
        const testBarge = {
            bargeNum: `PWTEST-E2E-${timestamp.toString().slice(-6)}`,
            uscgNum: `E2E${timestamp.toString().slice(-6)}`,
            hullType: 'T',
            bargeType: 'Tank',
            equipmentType: 'Barge',
            externalLength: 195.5,
            externalWidth: 35.0
        };

        console.log('\n=== Step 1: Navigate to Create Page ===');
        const createButton = page.locator('a[href*="/Barge/Create"]').first();
        if (await createButton.count() > 0) {
            await createButton.click();
        } else {
            await page.goto('https://localhost:6001/Barge/Create');
        }
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        expect(page.url()).toContain('/Barge/Create');
        await page.screenshot({ path: 'test-results/barge-create-e2e-step1-create-page.png', fullPage: true });

        console.log('\n=== Step 2: Fill Form with Valid Data ===');
        await page.locator('input[name="BargeNum"]').fill(testBarge.bargeNum);
        await page.locator('input[name="UscgNum"]').fill(testBarge.uscgNum);
        await page.locator('select[name="HullType"]').selectOption(testBarge.hullType);
        await page.locator('select[name="BargeType"]').selectOption(testBarge.bargeType);
        await page.locator('select[name="EquipmentType"]').selectOption(testBarge.equipmentType);
        await page.locator('input[name="ExternalLength"]').fill(testBarge.externalLength.toString());
        await page.locator('input[name="ExternalWidth"]').fill(testBarge.externalWidth.toString());

        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/barge-create-e2e-step2-form-filled.png', fullPage: true });

        console.log('\n=== Step 3: Submit Form ===');
        const submitButton = page.locator('form button[type="submit"][value="save"]');
        await submitButton.click();
        await page.waitForTimeout(4000);

        await page.screenshot({ path: 'test-results/barge-create-e2e-step3-after-submit.png', fullPage: true });

        console.log('\n=== Step 4: Verify Redirect to Details or Index ===');
        const currentUrl = page.url();
        const redirectedToDetails = currentUrl.includes('/Details');
        const redirectedToIndex = currentUrl.includes('/BargeSearch/Index');

        expect(redirectedToDetails || redirectedToIndex).toBeTruthy();

        if (redirectedToDetails) {
            console.log('Redirected to Details page - verifying data...');

            const pageContent = await page.content();
            const hasBargeNum = pageContent.includes(testBarge.bargeNum);

            expect(hasBargeNum).toBeTruthy();
            await page.screenshot({ path: 'test-results/barge-create-e2e-step4-details-verification.png', fullPage: true });
        }

        console.log('\n=== Step 5: Search for Created Barge ===');
        await page.goto('https://localhost:6001/BargeSearch/Index');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const bargeNumSearch = page.locator('input[name="BargeNum"], input[id="BargeNum"]');
        if (await bargeNumSearch.count() > 0) {
            await bargeNumSearch.fill(testBarge.bargeNum);
        }

        const searchButton = page.locator('#btnSearch, button:has-text("Search")');
        if (await searchButton.count() > 0) {
            await searchButton.click();
            await page.waitForTimeout(3000);
        }

        await page.screenshot({ path: 'test-results/barge-create-e2e-step5-search-results.png', fullPage: true });

        const tableBody = page.locator('#bargeTable tbody, table tbody');
        const tableContent = await tableBody.textContent();
        const bargeFoundInTable = tableContent.includes(testBarge.bargeNum);

        console.log(`Barge found in search results: ${bargeFoundInTable}`);
        expect(bargeFoundInTable).toBeTruthy();

        console.log('\n=== E2E Test Complete ===');
        console.log(`Created barge: ${testBarge.bargeNum}`);
        console.log(`Verification: ${bargeFoundInTable ? 'PASSED' : 'FAILED'}`);
    });

    test('E2E Test 2: Cancel Button Navigation', async ({ page }) => {
        console.log('\n=== Testing Cancel Button Behavior ===');

        await page.goto('https://localhost:6001/Barge/Create');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        const timestamp = Date.now();
        await page.locator('input[name="BargeNum"]').fill(`PWTEST-CANCEL-${timestamp.toString().slice(-6)}`);
        await page.locator('select[name="HullType"]').selectOption('R');

        await page.waitForTimeout(500);
        await page.screenshot({ path: 'test-results/barge-create-e2e-cancel-before.png', fullPage: true });

        const cancelButton = page.locator('button[type="submit"][value="cancel"], a.btn-secondary:has-text("Cancel")').first();
        await cancelButton.click();
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        const redirectedToIndex = currentUrl.includes('/BargeSearch/Index') || currentUrl.includes('/Barge') && !currentUrl.includes('/Create');

        await page.screenshot({ path: 'test-results/barge-create-e2e-cancel-after.png', fullPage: true });

        expect(redirectedToIndex).toBeTruthy();
        console.log(`Cancel button redirected to: ${currentUrl}`);
    });

    test('E2E Test 3: Create with Return URL Navigation', async ({ page }) => {
        console.log('\n=== Testing Return URL Functionality ===');

        const returnUrl = encodeURIComponent('https://localhost:6001/BargeSearch/Index');
        await page.goto(`https://localhost:6001/Barge/Create?returnUrl=${returnUrl}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        const timestamp = Date.now();
        const testBarge = {
            bargeNum: `PWTEST-RTN-${timestamp.toString().slice(-6)}`,
            hullType: 'R'
        };

        await page.locator('input[name="BargeNum"]').fill(testBarge.bargeNum);
        await page.locator('select[name="HullType"]').selectOption(testBarge.hullType);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"]');
        await submitButton.click();
        await page.waitForTimeout(4000);

        const currentUrl = page.url();
        console.log(`After submit, redirected to: ${currentUrl}`);

        await page.screenshot({ path: 'test-results/barge-create-e2e-returnurl.png', fullPage: true });

        expect(currentUrl.includes('/Barge') || currentUrl.includes('/BargeSearch')).toBeTruthy();
    });

    test('E2E Test 4: Form State Persistence on Validation Error', async ({ page }) => {
        console.log('\n=== Testing Form State Persistence ===');

        await page.goto('https://localhost:6001/Barge/Create');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        const timestamp = Date.now();
        const testData = {
            bargeNum: `PWTEST-PERSIST-${timestamp.toString().slice(-6)}`,
            uscgNum: `PST${timestamp.toString().slice(-6)}`,
            coverConfig: 'Test Configuration'
        };

        await page.locator('input[name="BargeNum"]').fill(testData.bargeNum);
        await page.locator('input[name="UscgNum"]').fill(testData.uscgNum);
        await page.locator('input[name="CoverConfig"]').fill(testData.coverConfig);

        const damagedCheckbox = page.locator('input[name="IsDamaged"]');
        await damagedCheckbox.check();

        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/barge-create-e2e-persist-before-submit.png', fullPage: true });

        const submitButton = page.locator('form button[type="submit"][value="save"]');
        await submitButton.click();
        await page.waitForTimeout(3000);

        const stayedOnPage = page.url().includes('/Create') || page.url().includes('/Save');

        if (stayedOnPage) {
            const bargeNumValue = await page.locator('input[name="BargeNum"]').inputValue();
            const uscgNumValue = await page.locator('input[name="UscgNum"]').inputValue();
            const coverConfigValue = await page.locator('input[name="CoverConfig"]').inputValue();
            const isDamagedChecked = await damagedCheckbox.isChecked();

            await page.screenshot({ path: 'test-results/barge-create-e2e-persist-after-validation.png', fullPage: true });

            expect(bargeNumValue).toBe(testData.bargeNum);
            expect(uscgNumValue).toBe(testData.uscgNum);
            expect(coverConfigValue).toBe(testData.coverConfig);
            expect(isDamagedChecked).toBeTruthy();

            console.log('Form state persisted after validation error:');
            console.log(`- Barge Number: ${bargeNumValue === testData.bargeNum ? 'PRESERVED' : 'LOST'}`);
            console.log(`- USCG Number: ${uscgNumValue === testData.uscgNum ? 'PRESERVED' : 'LOST'}`);
            console.log(`- Cover Config: ${coverConfigValue === testData.coverConfig ? 'PRESERVED' : 'LOST'}`);
            console.log(`- Is Damaged: ${isDamagedChecked ? 'PRESERVED' : 'LOST'}`);
        } else {
            console.log('Form submitted successfully - skipping persistence check');
        }
    });

    test('E2E Test 5: Create Barge and Navigate to Edit', async ({ page }) => {
        console.log('\n=== Create Barge and Navigate to Edit ===');

        const timestamp = Date.now();
        const testBarge = {
            bargeNum: `PWTEST-EDIT-${timestamp.toString().slice(-6)}`,
            hullType: 'B'
        };

        await page.goto('https://localhost:6001/Barge/Create');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        await page.locator('input[name="BargeNum"]').fill(testBarge.bargeNum);
        await page.locator('select[name="HullType"]').selectOption(testBarge.hullType);

        await page.waitForTimeout(1000);

        const submitButton = page.locator('form button[type="submit"][value="save"]');
        await submitButton.click();
        await page.waitForTimeout(4000);

        const currentUrl = page.url();
        console.log(`After creation, URL: ${currentUrl}`);

        let bargeId = null;
        if (currentUrl.includes('/Details/')) {
            const match = currentUrl.match(/\/Details\/(\d+)/);
            if (match) {
                bargeId = match[1];
                console.log(`Extracted Barge ID: ${bargeId}`);

                const editButton = page.locator(`a[href*="/Barge/Edit/${bargeId}"]`).first();
                if (await editButton.count() > 0) {
                    await editButton.click();
                } else {
                    await page.goto(`https://localhost:6001/Barge/Edit/${bargeId}`);
                }

                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(2000);

                expect(page.url()).toContain('/Barge/Edit/');

                const bargeNumValue = await page.locator('input[name="BargeNum"]').inputValue();
                expect(bargeNumValue).toBe(testBarge.bargeNum);

                await page.screenshot({ path: 'test-results/barge-create-e2e-navigate-to-edit.png', fullPage: true });

                console.log('Successfully navigated to Edit page');
                console.log(`Verified Barge Number: ${bargeNumValue}`);
            }
        } else {
            console.log('Did not redirect to Details page - searching for barge in index');

            await page.goto('https://localhost:6001/BargeSearch/Index');
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            const bargeNumSearch = page.locator('input[name="BargeNum"], input[id="BargeNum"]');
            if (await bargeNumSearch.count() > 0) {
                await bargeNumSearch.fill(testBarge.bargeNum);
            }

            const searchButton = page.locator('#btnSearch');
            if (await searchButton.count() > 0) {
                await searchButton.click();
                await page.waitForTimeout(3000);
            }

            await page.screenshot({ path: 'test-results/barge-create-e2e-search-for-edit.png', fullPage: true });
        }
    });
});
