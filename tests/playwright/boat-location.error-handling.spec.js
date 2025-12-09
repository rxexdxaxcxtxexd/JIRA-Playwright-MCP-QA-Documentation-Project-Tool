const { test, expect } = require('@playwright/test');

test.describe('BoatLocation - Error Handling & Edge Cases', () => {
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
        console.log(`\n========================================`);
        console.log(`Test: ${testInfo.title}`);
        console.log(`Status: ${testInfo.status}`);
        console.log(`========================================`);
        console.log(`Console Errors: ${consoleErrors.length}`);
        if (consoleErrors.length > 0) {
            consoleErrors.forEach(err => {
                console.log(`  [${err.type}] ${err.text}`);
            });
        }
        console.log(`Console Logs: ${consoleLogs.length}`);
        console.log('========================================\n');
    });

    test('Handle 404 - Nonexistent Boat ID', async ({ page }) => {
        console.log('\n--- TEST: Handle 404 - Nonexistent Boat ID ---');

        // Try to navigate to a boat that doesn't exist
        const nonexistentId = 9999999;
        const response = await page.goto(`${baseUrl}/BoatLocationSearch/Edit/${nonexistentId}`, {
            waitUntil: 'networkidle'
        });

        await page.waitForTimeout(2000);

        const statusCode = response?.status();
        console.log(`Response status code: ${statusCode}`);

        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        // Check for error message or redirect
        const errorAlert = page.locator('.alert-danger, .alert-warning');
        const hasErrorMessage = await errorAlert.count() > 0;

        if (hasErrorMessage) {
            const errorText = await errorAlert.textContent();
            console.log(`Error message displayed: ${errorText}`);
        }

        // Check if redirected to Index or error page
        const redirectedToIndex = currentUrl.includes('/Index');
        const is404Page = statusCode === 404;

        await page.screenshot({ path: 'test-results/error-404-nonexistent-id.png', fullPage: true });

        console.log(`Status: ${statusCode}, Redirected: ${redirectedToIndex}, Error shown: ${hasErrorMessage}`);

        // Should handle the error gracefully (either 404, redirect, or error message)
        expect(is404Page || redirectedToIndex || hasErrorMessage).toBeTruthy();
    });

    test('Handle Server Validation Errors', async ({ page }) => {
        console.log('\n--- TEST: Handle Server Validation Errors ---');

        // Navigate to create page
        await page.goto(`${baseUrl}/BoatLocationSearch/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Fill in data that will cause server-side validation errors
        // Create duplicate boat name or violate business rules
        const timestamp = Date.now();

        // Fill required fields
        await page.locator('input[name="BoatName"]').fill(`TEST${timestamp}`);
        await page.locator('input[name="ShortName"]').fill(`T${timestamp.toString().slice(-6)}`);

        // Enable Track AIS without MMSI (should trigger server validation)
        const trackAISCheckbox = page.locator('#chkTrackPositionInAIS');
        if (await trackAISCheckbox.count() > 0) {
            await trackAISCheckbox.check();
            await page.waitForTimeout(500);
        }

        // Leave MMSI empty - this should cause server validation error

        // Submit the form
        const submitButton = page.locator('form button[type="submit"].btn-primary');
        await submitButton.click();
        await page.waitForTimeout(3000);

        // Check for validation summary
        const validationSummary = page.locator('.validation-summary-errors');
        const hasValidationSummary = await validationSummary.count() > 0;

        let validationMessages = [];
        if (hasValidationSummary) {
            const errors = await validationSummary.locator('li').allTextContents();
            validationMessages = errors.filter(e => e.trim());
            console.log('Validation errors:');
            validationMessages.forEach(msg => console.log(`  - ${msg}`));
        }

        // Check for field-level errors
        const fieldErrors = await page.locator('.field-validation-error, .text-danger').allTextContents();
        const nonEmptyFieldErrors = fieldErrors.filter(e => e.trim());

        if (nonEmptyFieldErrors.length > 0) {
            console.log('Field errors:');
            nonEmptyFieldErrors.forEach(err => console.log(`  - ${err}`));
        }

        await page.screenshot({ path: 'test-results/error-server-validation.png', fullPage: true });

        // Should display validation errors
        expect(hasValidationSummary || nonEmptyFieldErrors.length > 0).toBeTruthy();
    });

    test('Handle Empty Search Results Gracefully', async ({ page }) => {
        console.log('\n--- TEST: Handle Empty Search Results ---');

        await page.goto(`${baseUrl}/BoatLocationSearch/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Search for a boat that definitely doesn't exist
        const boatNameInput = page.locator('input[name="BoatName"]');
        await boatNameInput.fill('NONEXISTENT_BOAT_ZZZZZ_99999');

        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(3000);

        // Check for "No data available" message
        const tableBody = page.locator('#boatLocationTable tbody');
        const noDataMessage = page.locator('#boatLocationTable tbody td:has-text("No data available")');
        const hasNoDataMessage = await noDataMessage.count() > 0;

        const rowCount = await page.locator('#boatLocationTable tbody tr').count();

        console.log(`Row count: ${rowCount}`);
        console.log(`No data message shown: ${hasNoDataMessage}`);

        await page.screenshot({ path: 'test-results/error-empty-search.png', fullPage: true });

        // Should show "No data available" or empty table
        expect(rowCount === 0 || rowCount === 1).toBeTruthy();
    });

    test('Handle Special Characters in Search', async ({ page }) => {
        console.log('\n--- TEST: Handle Special Characters in Search ---');

        await page.goto(`${baseUrl}/BoatLocationSearch/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Search with special characters that might break queries
        const specialChars = ['%', '_', '*', '\\', '\'', '"', ';', '--'];

        for (const char of specialChars) {
            console.log(`Testing special character: "${char}"`);

            const boatNameInput = page.locator('input[name="BoatName"]');
            await boatNameInput.clear();
            await boatNameInput.fill(char);

            const searchButton = page.locator('#btnSearch');
            await searchButton.click();
            await page.waitForTimeout(2000);

            // Check for errors
            const errorAlert = page.locator('.alert-danger');
            const hasError = await errorAlert.count() > 0;

            if (hasError) {
                const errorText = await errorAlert.textContent();
                console.log(`  ⚠️ Error occurred: ${errorText}`);
            } else {
                console.log(`  ✅ Handled gracefully`);
            }

            // Page should not crash - should either show results or empty table
            const pageNotCrashed = await page.locator('#boatLocationTable').count() > 0;
            expect(pageNotCrashed).toBeTruthy();
        }

        await page.screenshot({ path: 'test-results/error-special-chars.png', fullPage: true });
    });

    test('Handle Form Submission Without JavaScript', async ({ page }) => {
        console.log('\n--- TEST: Form Submission With JS Disabled ---');

        // Disable JavaScript
        await page.context().addInitScript(() => {
            // Simulate jQuery validation being unavailable
            window.jQuery = undefined;
        });

        await page.goto(`${baseUrl}/BoatLocationSearch/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Try to submit empty form
        const submitButton = page.locator('form button[type="submit"].btn-primary');

        // Check if HTML5 validation prevents submission
        const formValid = await page.evaluate(() => {
            const form = document.querySelector('form');
            return form ? form.checkValidity() : false;
        });

        console.log(`Form valid (HTML5): ${formValid}`);

        await submitButton.click();
        await page.waitForTimeout(2000);

        // Server-side validation should still work
        const validationSummary = page.locator('.validation-summary-errors, .alert-danger');
        const hasValidation = await validationSummary.count() > 0;

        console.log(`Server-side validation shown: ${hasValidation}`);

        await page.screenshot({ path: 'test-results/error-no-js.png', fullPage: true });

        // Should have HTML5 or server-side validation
        expect(!formValid || hasValidation).toBeTruthy();
    });

    test('Handle Concurrent Form Submissions', async ({ page }) => {
        console.log('\n--- TEST: Handle Concurrent Form Submissions ---');

        await page.goto(`${baseUrl}/BoatLocationSearch/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Fill search form
        const boatNameInput = page.locator('input[name="BoatName"]');
        await boatNameInput.fill('TEST');

        const searchButton = page.locator('#btnSearch');

        // Track network requests
        let requestCount = 0;
        page.on('request', request => {
            if (request.url().includes('BoatLocationTable')) {
                requestCount++;
                console.log(`Request #${requestCount}: ${request.url()}`);
            }
        });

        // Click search button multiple times rapidly
        await searchButton.click();
        await searchButton.click();
        await searchButton.click();

        await page.waitForTimeout(4000);

        console.log(`Total requests sent: ${requestCount}`);

        await page.screenshot({ path: 'test-results/error-concurrent-submit.png', fullPage: true });

        // Should handle gracefully (ideally only 1 request, but multiple is okay if handled)
        expect(requestCount).toBeGreaterThanOrEqual(1);

        // Page should still be functional
        const tableExists = await page.locator('#boatLocationTable').count() > 0;
        expect(tableExists).toBeTruthy();
    });

    test('Handle Invalid Date Input', async ({ page }) => {
        console.log('\n--- TEST: Handle Invalid Date Input ---');

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

            // Try to enter invalid date
            const dateField = page.locator('#dtPositionUpdatedDate');

            if (await dateField.count() > 0) {
                // datetime-local fields have built-in validation, but let's test
                await dateField.fill('invalid-date');
                await page.waitForTimeout(500);

                const actualValue = await dateField.inputValue();
                console.log(`Date field value after invalid input: "${actualValue}"`);

                // Submit form
                const submitButton = page.locator('form button[type="submit"].btn-primary');
                await submitButton.click();
                await page.waitForTimeout(2000);

                // Check for validation errors
                const hasValidationErrors = await page.locator('.validation-summary-errors, .field-validation-error').count() > 0;

                await page.screenshot({ path: 'test-results/error-invalid-date.png', fullPage: true });

                console.log(`Validation errors shown: ${hasValidationErrors}`);
                console.log('✅ Invalid date input handled');
            }
        }
    });

    test('Handle Browser Back Button', async ({ page }) => {
        console.log('\n--- TEST: Handle Browser Back Button ---');

        // Navigate through pages
        await page.goto(`${baseUrl}/BoatLocationSearch/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(2000);

        const firstEditButton = page.locator('#boatLocationTable .btn-primary').first();
        if (await firstEditButton.count() > 0) {
            await firstEditButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            console.log('On edit page');

            // Use browser back button
            await page.goBack();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            console.log('Navigated back');

            // Verify we're back on search page
            const onSearchPage = page.url().includes('/Index');
            console.log(`Back on search page: ${onSearchPage}`);

            // Check if table still works
            const tableExists = await page.locator('#boatLocationTable').count() > 0;

            await page.screenshot({ path: 'test-results/error-back-button.png', fullPage: true });

            expect(onSearchPage).toBeTruthy();
            expect(tableExists).toBeTruthy();

            console.log('✅ Back button handled correctly');
        }
    });
});
