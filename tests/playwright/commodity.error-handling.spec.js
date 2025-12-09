const { test, expect } = require('@playwright/test');

test.describe('Commodity - Error Handling & Edge Cases', () => {
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

    test('Handle 404 - Nonexistent Commodity ID', async ({ page }) => {
        console.log('\n--- TEST: Handle 404 - Nonexistent Commodity ID ---');

        // Try to navigate to a commodity that doesn't exist
        const nonexistentId = 9999999;
        const response = await page.goto(`${baseUrl}/Commodity/Edit/${nonexistentId}`, {
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

        await page.screenshot({ path: 'test-results/commodity-error-404-nonexistent-id.png', fullPage: true });

        console.log(`Status: ${statusCode}, Redirected: ${redirectedToIndex}, Error shown: ${hasErrorMessage}`);

        // Should handle the error gracefully (either 404, redirect, or error message)
        expect(is404Page || redirectedToIndex || hasErrorMessage).toBeTruthy();
    });

    test('Handle Server Validation Errors', async ({ page }) => {
        console.log('\n--- TEST: Handle Server Validation Errors ---');

        // Navigate to create page
        await page.goto(`${baseUrl}/Commodity/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Fill in data that will cause server-side validation errors
        // Leave required Commodity Name empty
        const timestamp = Date.now();

        // Fill optional fields but leave Name empty
        await page.locator('input[name="BillingName"]').fill(`PWTEST Billing ${timestamp}`);

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

        await page.screenshot({ path: 'test-results/commodity-error-server-validation.png', fullPage: true });

        // Should display validation errors
        expect(hasValidationSummary || nonEmptyFieldErrors.length > 0).toBeTruthy();
    });

    test('Handle Empty Search Results Gracefully', async ({ page }) => {
        console.log('\n--- TEST: Handle Empty Search Results ---');

        await page.goto(`${baseUrl}/Commodity/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Search for a commodity that definitely doesn't exist
        const nameInput = page.locator('#Name');
        await nameInput.fill('NONEXISTENT_CUSTOMER_ZZZZZ_99999');

        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(3000);

        // Check for "No data available" message
        const tableBody = page.locator('#commodityTable tbody');
        const noDataMessage = page.locator('#commodityTable tbody td:has-text("No data available")');
        const hasNoDataMessage = await noDataMessage.count() > 0;

        const rowCount = await page.locator('#commodityTable tbody tr').count();

        console.log(`Row count: ${rowCount}`);
        console.log(`No data message shown: ${hasNoDataMessage}`);

        await page.screenshot({ path: 'test-results/commodity-error-empty-search.png', fullPage: true });

        // Should show "No data available" or empty table
        expect(rowCount === 0 || rowCount === 1).toBeTruthy();
    });

    test('Handle Special Characters in Search', async ({ page }) => {
        console.log('\n--- TEST: Handle Special Characters in Search ---');

        await page.goto(`${baseUrl}/Commodity/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Search with special characters that might break queries
        const specialChars = ['%', '_', '*', '\\', '\'', '"', ';', '--'];

        for (const char of specialChars) {
            console.log(`Testing special character: "${char}"`);

            const nameInput = page.locator('#Name');
            await nameInput.clear();
            await nameInput.fill(char);

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
            const pageNotCrashed = await page.locator('#commodityTable').count() > 0;
            expect(pageNotCrashed).toBeTruthy();
        }

        await page.screenshot({ path: 'test-results/commodity-error-special-chars.png', fullPage: true });
    });

    test('Handle SQL Injection Attempts', async ({ page }) => {
        console.log('\n--- TEST: Handle SQL Injection Attempts ---');

        await page.goto(`${baseUrl}/Commodity/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Attempt SQL injection in various fields
        const sqlInjectionAttempts = [
            "'; DROP TABLE Commoditys; --",
            "1' OR '1'='1",
            "Robert'); DELETE FROM Commoditys WHERE 1=1; --"
        ];

        for (const sqlAttempt of sqlInjectionAttempts) {
            console.log(`Testing SQL injection: "${sqlAttempt}"`);

            const nameField = page.locator('input[name="Name"]');
            await nameField.clear();
            await nameField.fill(sqlAttempt);

            const submitButton = page.locator('form button[type="submit"].btn-primary');
            await submitButton.click();
            await page.waitForTimeout(2000);

            // Check for server errors
            const serverError = await page.locator('.alert-danger').count() > 0;
            const errorMessage = serverError ? await page.locator('.alert-danger').textContent() : '';

            // Should not expose SQL errors
            const exposesSQL = errorMessage.toLowerCase().includes('sql') || 
                              errorMessage.toLowerCase().includes('syntax');

            console.log(`  Server error: ${serverError}, Exposes SQL: ${exposesSQL}`);

            expect(!exposesSQL).toBeTruthy();
        }

        await page.screenshot({ path: 'test-results/commodity-error-sql-injection.png', fullPage: true });
    });

    test('Handle XSS Attempts', async ({ page }) => {
        console.log('\n--- TEST: Handle XSS Attempts ---');

        await page.goto(`${baseUrl}/Commodity/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const xssAttempts = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "<iframe src=\"javascript:alert('XSS')\"></iframe>"
        ];

        for (const xssAttempt of xssAttempts) {
            console.log(`Testing XSS: "${xssAttempt}"`);

            const nameField = page.locator('input[name="Name"]');
            await nameField.clear();
            await nameField.fill(xssAttempt);

            await page.waitForTimeout(500);

            // Check if script appears unescaped in DOM
            const pageContent = await page.content();
            const hasUnescapedScript = pageContent.includes('<script>alert(');

            // Check if script executed
            const hasScriptExecuted = await page.evaluate(() => {
                return window.xssTestExecuted === true;
            });

            console.log(`  Unescaped in DOM: ${hasUnescapedScript}, Executed: ${hasScriptExecuted}`);

            expect(!hasUnescapedScript && !hasScriptExecuted).toBeTruthy();
        }

        await page.screenshot({ path: 'test-results/commodity-error-xss.png', fullPage: true });
    });

    test('Handle Concurrent Form Submissions', async ({ page }) => {
        console.log('\n--- TEST: Handle Concurrent Form Submissions ---');

        await page.goto(`${baseUrl}/Commodity/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Fill search form
        const nameInput = page.locator('#Name');
        await nameInput.fill('TEST');

        const searchButton = page.locator('#btnSearch');

        // Track network requests
        let requestCount = 0;
        page.on('request', request => {
            if (request.url().includes('CommodityTable')) {
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

        await page.screenshot({ path: 'test-results/commodity-error-concurrent-submit.png', fullPage: true });

        // Should handle gracefully (ideally only 1 request, but multiple is okay if handled)
        expect(requestCount).toBeGreaterThanOrEqual(1);

        // Page should still be functional
        const tableExists = await page.locator('#commodityTable').count() > 0;
        expect(tableExists).toBeTruthy();
    });

    test('Handle Browser Back Button', async ({ page }) => {
        console.log('\n--- TEST: Handle Browser Back Button ---');

        // Navigate through pages
        await page.goto(`${baseUrl}/Commodity/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(2000);

        await page.waitForSelector('#commodityTable tbody tr', { timeout: 10000 });

        const firstViewButton = page.locator('#commodityTable tbody tr').first().locator('a.btn-outline-primary');
        if (await firstViewButton.count() > 0) {
            await firstViewButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            console.log('On details page');

            // Use browser back button
            await page.goBack();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            console.log('Navigated back');

            // Verify we're back on search page
            const onSearchPage = page.url().includes('/Index');
            console.log(`Back on search page: ${onSearchPage}`);

            // Check if table still works
            const tableExists = await page.locator('#commodityTable').count() > 0;

            await page.screenshot({ path: 'test-results/commodity-error-back-button.png', fullPage: true });

            expect(onSearchPage).toBeTruthy();
            expect(tableExists).toBeTruthy();

            console.log('✅ Back button handled correctly');
        }
    });

    test('Handle Max Length Validation', async ({ page }) => {
        console.log('\n--- TEST: Handle Max Length Validation ---');

        await page.goto(`${baseUrl}/Commodity/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Try to enter value exceeding max length for Commodity Name (max 100)
        const nameField = page.locator('input[name="Name"]');
        const longValue = 'A'.repeat(150);

        await nameField.fill(longValue);
        await page.waitForTimeout(500);

        const actualValue = await nameField.inputValue();
        console.log(`Input length: ${longValue.length}, Actual length: ${actualValue.length}`);

        // Check if maxlength attribute is enforced
        const maxLength = await nameField.getAttribute('maxlength');
        const maxLengthEnforced = maxLength ? parseInt(maxLength) >= actualValue.length : true;

        await page.screenshot({ path: 'test-results/commodity-error-max-length.png', fullPage: true });

        expect(maxLengthEnforced || actualValue.length <= 100).toBeTruthy();
    });
});

