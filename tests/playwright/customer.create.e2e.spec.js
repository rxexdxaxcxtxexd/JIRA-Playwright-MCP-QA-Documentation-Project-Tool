const { test, expect } = require('@playwright/test');

test.describe('CustomerCreate - End-to-End Workflow', () => {
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

        await page.goto('https://localhost:6001/Customer/Index');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
    });

    test('E2E 1: Complete Customer Creation Workflow', async ({ page }) => {
        const timestamp = Date.now();
        const testCustomer = {
            name: `PWTEST${timestamp.toString().slice(-6)}`,
            billingName: `PWTEST Customer ${timestamp}`,
            accountingCode: `ACCT${timestamp.toString().slice(-4)}`,
            emailAddress: `pwtest${timestamp}@example.com`,
            phoneNumber: '5551234567',
            address: '123 PWTEST Street',
            city: 'PWTEST City',
            state: 'TX',
            zip: '12345'
        };

        // Step 1: Navigate from Index to Create
        const addButton = page.locator('a.btn-outline-primary', { hasText: 'Add Customer' });
        await addButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        expect(page.url()).toContain('/Customer/Create');
        const pageTitle = await page.locator('h2').textContent();
        expect(pageTitle).toContain('Create New Customer');

        // Step 2: Fill in customer form
        await page.locator('input[name="Name"]').fill(testCustomer.name);
        await page.locator('input[name="BillingName"]').fill(testCustomer.billingName);
        await page.locator('input[name="AccountingCode"]').fill(testCustomer.accountingCode);
        await page.locator('input[name="EmailAddress"]').fill(testCustomer.emailAddress);
        await page.locator('input[name="PhoneNumber"]').fill(testCustomer.phoneNumber);
        await page.locator('input[name="Address"]').fill(testCustomer.address);
        await page.locator('input[name="City"]').fill(testCustomer.city);
        await page.locator('input[name="State"]').fill(testCustomer.state);
        await page.locator('input[name="Zip"]').fill(testCustomer.zip);

        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/customer-e2e1-form-filled.png', fullPage: true });

        // Step 3: Submit form
        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(4000);

        await page.screenshot({ path: 'test-results/customer-e2e1-after-submit.png', fullPage: true });

        // Step 4: Verify redirect to Details page
        expect(page.url()).toContain('/Customer/Details');

        const detailsTitle = await page.locator('h2').textContent();
        expect(detailsTitle).toContain('Edit Customer');

        // Step 5: Verify data appears correctly
        const nameValue = await page.locator('input[name="Name"]').inputValue();
        const billingNameValue = await page.locator('input[name="BillingName"]').inputValue();
        const emailValue = await page.locator('input[name="EmailAddress"]').inputValue();

        expect(nameValue).toBe(testCustomer.name);
        expect(billingNameValue).toBe(testCustomer.billingName);
        expect(emailValue).toBe(testCustomer.emailAddress);

        // Step 6: Navigate back to Index and verify customer appears
        await page.goto('https://localhost:6001/Customer/Index');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Search for the new customer
        await page.locator('#Name').fill(testCustomer.name);
        await page.locator('#btnSearch').click();
        await page.waitForTimeout(3000);

        const tableContent = await page.locator('#customerTable').textContent();
        const customerAppearsInSearch = tableContent.includes(testCustomer.name);

        await page.screenshot({ path: 'test-results/customer-e2e1-search-results.png', fullPage: true });

        expect(customerAppearsInSearch).toBeTruthy();

        console.log('\n========================================');
        console.log('E2E TEST COMPLETED SUCCESSFULLY');
        console.log('========================================');
        console.log('Customer created:', testCustomer.name);
        console.log('Customer appears in search:', customerAppearsInSearch);
        console.log('Console errors:', consoleErrors.length);
        console.log('========================================\n');
    });

    test('E2E 2: Cancel Button Navigation', async ({ page }) => {
        // Navigate to Create page
        const addButton = page.locator('a.btn-outline-primary', { hasText: 'Add Customer' });
        await addButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        expect(page.url()).toContain('/Customer/Create');

        // Fill in some data
        const timestamp = Date.now();
        await page.locator('input[name="Name"]').fill(`PWTEST${timestamp.toString().slice(-6)}`);
        await page.locator('input[name="BillingName"]').fill(`PWTEST Cancelled ${timestamp}`);

        await page.waitForTimeout(500);

        await page.screenshot({ path: 'test-results/customer-e2e2-before-cancel.png', fullPage: true });

        // Click Cancel button
        const cancelButton = page.locator('button[type="submit"][name="action"][value="cancel"]');
        await cancelButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'test-results/customer-e2e2-after-cancel.png', fullPage: true });

        // Verify returned to Index
        expect(page.url()).toContain('/Customer/Index');

        console.log('\n========================================');
        console.log('CANCEL BUTTON TEST COMPLETED');
        console.log('========================================');
        console.log('Successfully returned to Index page');
        console.log('Console errors:', consoleErrors.length);
        console.log('========================================\n');
    });

    test('E2E 3: Form State Persistence After Validation Error', async ({ page }) => {
        const timestamp = Date.now();
        const testData = {
            name: `PWTEST${timestamp.toString().slice(-6)}`,
            billingName: '', // Intentionally empty to trigger validation
            emailAddress: `pwtest${timestamp}@example.com`,
            phoneNumber: '5551234567'
        };

        // Navigate to Create page
        const addButton = page.locator('a.btn-outline-primary', { hasText: 'Add Customer' });
        await addButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Fill in form with missing required field
        await page.locator('input[name="Name"]').fill(testData.name);
        await page.locator('input[name="EmailAddress"]').fill(testData.emailAddress);
        await page.locator('input[name="PhoneNumber"]').fill(testData.phoneNumber);

        await page.waitForTimeout(500);

        await page.screenshot({ path: 'test-results/customer-e2e3-before-submit.png', fullPage: true });

        // Submit form
        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
        await submitButton.click();
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'test-results/customer-e2e3-validation-error.png', fullPage: true });

        // Verify validation error appears
        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidationError = await validationSummary.count() > 0;
        expect(hasValidationError).toBeTruthy();

        // Verify form stayed on Create page
        expect(page.url()).toContain('/Create');

        // Verify previously entered data is still present
        const nameValue = await page.locator('input[name="Name"]').inputValue();
        const emailValue = await page.locator('input[name="EmailAddress"]').inputValue();
        const phoneValue = await page.locator('input[name="PhoneNumber"]').inputValue();

        expect(nameValue).toBe(testData.name);
        expect(emailValue).toBe(testData.emailAddress);
        expect(phoneValue).toBe(testData.phoneNumber);

        console.log('\n========================================');
        console.log('FORM STATE PERSISTENCE TEST COMPLETED');
        console.log('========================================');
        console.log('Validation error displayed:', hasValidationError);
        console.log('Form data preserved:', nameValue === testData.name);
        console.log('Console errors:', consoleErrors.length);
        console.log('========================================\n');
    });

    test('E2E 4: Create Customer with BargeEx Settings Enabled', async ({ page }) => {
        const timestamp = Date.now();
        const testCustomer = {
            name: `PWTEST${timestamp.toString().slice(-6)}`,
            billingName: `PWTEST BargeEx Customer ${timestamp}`,
            emailAddress: `pwtest${timestamp}@example.com`,
            bargeExTradingPartnerNum: `BX${timestamp.toString().slice(-6)}`,
            bargeExConfigID: '12345'
        };

        // Navigate to Create page
        const addButton = page.locator('a.btn-outline-primary', { hasText: 'Add Customer' });
        await addButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Fill in basic fields
        await page.locator('input[name="Name"]').fill(testCustomer.name);
        await page.locator('input[name="BillingName"]').fill(testCustomer.billingName);
        await page.locator('input[name="EmailAddress"]').fill(testCustomer.emailAddress);

        // Enable BargeEx
        const bargeExCheckbox = page.locator('input[name="IsBargeExEnabled"]');
        await bargeExCheckbox.check();

        // Fill BargeEx fields
        await page.locator('input[name="BargeExTradingPartnerNum"]').fill(testCustomer.bargeExTradingPartnerNum);
        await page.locator('input[name="BargeExConfigID"]').fill(testCustomer.bargeExConfigID);

        await page.waitForTimeout(1000);

        await page.screenshot({ path: 'test-results/customer-e2e4-bargex-form.png', fullPage: true });

        // Submit form
        const submitButton = page.locator('form button[type="submit"][name="action"][value="save"]');
        await submitButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(4000);

        await page.screenshot({ path: 'test-results/customer-e2e4-after-submit.png', fullPage: true });

        // Verify redirect to Details
        expect(page.url()).toContain('/Customer/Details');

        // Verify BargeEx is enabled
        const bargeExEnabledValue = await page.locator('input[name="IsBargeExEnabled"]').isChecked();
        expect(bargeExEnabledValue).toBeTruthy();

        console.log('\n========================================');
        console.log('BARGEX CUSTOMER TEST COMPLETED');
        console.log('========================================');
        console.log('Customer created:', testCustomer.name);
        console.log('BargeEx enabled:', bargeExEnabledValue);
        console.log('Console errors:', consoleErrors.length);
        console.log('========================================\n');
    });

    test('E2E 5: Close Button Returns to Index', async ({ page }) => {
        // Navigate to Create page
        const addButton = page.locator('a.btn-outline-primary', { hasText: 'Add Customer' });
        await addButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        expect(page.url()).toContain('/Customer/Create');

        await page.screenshot({ path: 'test-results/customer-e2e5-before-close.png', fullPage: true });

        // Click Close button
        const closeButton = page.locator('a.btn-outline-secondary', { hasText: 'Close' });
        await closeButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: 'test-results/customer-e2e5-after-close.png', fullPage: true });

        // Verify returned to Index
        expect(page.url()).toContain('/Customer/Index');

        console.log('\n========================================');
        console.log('CLOSE BUTTON TEST COMPLETED');
        console.log('========================================');
        console.log('Successfully returned to Index page');
        console.log('Console errors:', consoleErrors.length);
        console.log('========================================\n');
    });
});
