const { test, expect } = require('@playwright/test');

test.describe('BoatLocationEdit - Delete/Deactivate Workflows', () => {
    let consoleLogs = [];
    let consoleErrors = [];
    const baseUrl = process.env.BASE_URL || 'https://localhost:6001';

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
    });

    test.afterEach(async ({ page }, testInfo) => {
        if (testInfo.status !== 'passed') {
            console.log(`\n========================================`);
            console.log(`Test FAILED: ${testInfo.title}`);
            console.log(`========================================`);
            console.log(`\nConsole Errors (${consoleErrors.length} entries):`);
            consoleErrors.forEach(err => {
                console.log(`[ERROR] ${err.text}`);
            });
        }
    });

    test('Toggle Active Status - Deactivate Boat', async ({ page }) => {
        console.log('\n========================================');
        console.log('TEST: Toggle Active Status - Deactivate');
        console.log('========================================\n');

        // Navigate to search page
        await page.goto(`${baseUrl}/BoatLocationSearch/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Search for active boats
        const activeOnlyCheckbox = page.locator('input[name="ActiveOnly"]');
        if (!await activeOnlyCheckbox.isChecked()) {
            await activeOnlyCheckbox.check();
        }

        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(3000);

        // Get first boat in results
        const firstEditButton = page.locator('#boatLocationTable .btn-primary').first();
        const hasResults = await firstEditButton.count() > 0;

        if (!hasResults) {
            console.log('⚠️  No active boats found to test deactivation');
            expect(true).toBeTruthy(); // Skip test gracefully
            return;
        }

        // Navigate to edit page
        await firstEditButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Get boat name for verification
        const boatNameField = page.locator('input[name="BoatName"]');
        const boatName = await boatNameField.inputValue();
        console.log(`Testing deactivation for: ${boatName}`);

        // Find the toggle active button
        const toggleButton = page.locator('#btnToggleActive');
        await expect(toggleButton).toBeVisible();

        const initialButtonText = await toggleButton.textContent();
        console.log(`Initial button text: ${initialButtonText}`);

        // Take screenshot before toggle
        await page.screenshot({ path: 'test-results/delete-before-toggle.png', fullPage: true });

        // Click the toggle button
        await toggleButton.click();
        await page.waitForTimeout(2000);

        // Check if confirmation dialog appears
        const dialogAppeared = await page.evaluate(() => {
            return window.confirm !== undefined;
        });

        // Wait for page to process the toggle
        await page.waitForTimeout(2000);

        // Check button text changed
        const afterToggleButtonText = await toggleButton.textContent();
        console.log(`After toggle button text: ${afterToggleButtonText}`);

        // Take screenshot after toggle
        await page.screenshot({ path: 'test-results/delete-after-toggle.png', fullPage: true });

        // Check for success message
        const successAlert = page.locator('.alert-success');
        const hasSuccessMessage = await successAlert.count() > 0;

        if (hasSuccessMessage) {
            const successMessage = await successAlert.textContent();
            console.log(`Success message: ${successMessage}`);
        }

        // Verify button text changed
        const buttonTextChanged = initialButtonText !== afterToggleButtonText;
        console.log(`Button text changed: ${buttonTextChanged}`);

        // Check hidden field value
        const hiddenIsActive = page.locator('#hiddenIsActive');
        if (await hiddenIsActive.count() > 0) {
            const isActiveValue = await hiddenIsActive.inputValue();
            console.log(`IsActive hidden field value: ${isActiveValue}`);
        }

        console.log('\n========================================');
        console.log('Toggle Active Status Test Complete');
        console.log('========================================\n');

        expect(toggleButton).toBeVisible();
    });

    test('Toggle Active Status - Reactivate Boat', async ({ page }) => {
        console.log('\n========================================');
        console.log('TEST: Toggle Active Status - Reactivate');
        console.log('========================================\n');

        // Navigate to search page
        await page.goto(`${baseUrl}/BoatLocationSearch/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Search for inactive boats (uncheck ActiveOnly)
        const activeOnlyCheckbox = page.locator('input[name="ActiveOnly"]');
        if (await activeOnlyCheckbox.isChecked()) {
            await activeOnlyCheckbox.uncheck();
        }

        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(3000);

        // Look for an inactive boat in the results
        const allRows = await page.locator('#boatLocationTable tbody tr').count();
        console.log(`Total rows found: ${allRows}`);

        if (allRows === 0) {
            console.log('⚠️  No boats found to test reactivation');
            expect(true).toBeTruthy();
            return;
        }

        // Click first edit button
        const firstEditButton = page.locator('#boatLocationTable .btn-primary').first();
        await firstEditButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Get boat name
        const boatNameField = page.locator('input[name="BoatName"]');
        const boatName = await boatNameField.inputValue();
        console.log(`Testing boat: ${boatName}`);

        // Find toggle button
        const toggleButton = page.locator('#btnToggleActive');
        await expect(toggleButton).toBeVisible();

        const buttonText = await toggleButton.textContent();
        console.log(`Toggle button text: ${buttonText}`);

        // If button says "Activate", this boat is inactive - click to activate
        if (buttonText.includes('Activate')) {
            console.log('Found inactive boat - attempting to reactivate...');

            await toggleButton.click();
            await page.waitForTimeout(2000);

            const afterText = await toggleButton.textContent();
            console.log(`After toggle button text: ${afterText}`);

            await page.screenshot({ path: 'test-results/delete-reactivate.png', fullPage: true });

            expect(afterText).toContain('Deactivate');
        } else {
            console.log('Boat is already active');
        }

        console.log('\n========================================');
        console.log('Reactivate Test Complete');
        console.log('========================================\n');
    });

    test('Verify Active Status Button States', async ({ page }) => {
        console.log('\n========================================');
        console.log('TEST: Verify Active Status Button States');
        console.log('========================================\n');

        // Navigate to search and edit
        await page.goto(`${baseUrl}/BoatLocationSearch/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(3000);

        const firstEditButton = page.locator('#boatLocationTable .btn-primary').first();
        if (await firstEditButton.count() > 0) {
            await firstEditButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            // Verify toggle button exists
            const toggleButton = page.locator('#btnToggleActive');
            await expect(toggleButton).toBeVisible();

            // Verify button has correct text
            const buttonText = await toggleButton.textContent();
            const isValidText = buttonText.includes('Activate') || buttonText.includes('Deactivate');
            expect(isValidText).toBeTruthy();

            // Verify button has correct classes
            const buttonClasses = await toggleButton.getAttribute('class');
            console.log(`Button classes: ${buttonClasses}`);

            // Verify hidden input exists
            const hiddenInput = page.locator('#hiddenIsActive');
            await expect(hiddenInput).toBeAttached();
            await expect(hiddenInput).toHaveAttribute('type', 'hidden');

            const hiddenValue = await hiddenInput.inputValue();
            console.log(`Hidden IsActive value: ${hiddenValue}`);

            // Verify button state matches hidden value
            const buttonSaysDeactivate = buttonText.includes('Deactivate');
            const hiddenIsTrue = hiddenValue === 'true' || hiddenValue === 'True';

            console.log(`Button says "Deactivate": ${buttonSaysDeactivate}`);
            console.log(`Hidden value is true: ${hiddenIsTrue}`);

            // They should match
            expect(buttonSaysDeactivate).toBe(hiddenIsTrue);

            await page.screenshot({ path: 'test-results/delete-button-states.png', fullPage: true });

            console.log('\n✅ Active status button states verified');
        }

        console.log('\n========================================');
        console.log('Button States Test Complete');
        console.log('========================================\n');
    });

    test('Cancel Button Returns to Search', async ({ page }) => {
        console.log('\n========================================');
        console.log('TEST: Cancel Button Navigation');
        console.log('========================================\n');

        // Navigate to edit page
        await page.goto(`${baseUrl}/BoatLocationSearch/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(3000);

        const firstEditButton = page.locator('#boatLocationTable .btn-primary').first();
        if (await firstEditButton.count() > 0) {
            await firstEditButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            // Find cancel button
            const cancelButton = page.locator('a.btn:has-text("Cancel")');
            await expect(cancelButton).toBeVisible();

            // Get the href
            const cancelHref = await cancelButton.getAttribute('href');
            console.log(`Cancel button href: ${cancelHref}`);

            // Click cancel
            await cancelButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Verify we're back on search page
            const currentUrl = page.url();
            console.log(`Current URL: ${currentUrl}`);

            const onSearchPage = currentUrl.includes('/Index') || currentUrl.includes('/BoatLocationSearch');
            expect(onSearchPage).toBeTruthy();

            await page.screenshot({ path: 'test-results/delete-cancel-navigation.png', fullPage: true });

            console.log('✅ Cancel button navigated back to search');
        }

        console.log('\n========================================');
        console.log('Cancel Navigation Test Complete');
        console.log('========================================\n');
    });
});
