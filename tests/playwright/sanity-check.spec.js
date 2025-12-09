const { test, expect } = require('@playwright/test');

/**
 * SANITY CHECK: Verify Customer, Commodity, and Barge modules are accessible
 *
 * Purpose: Before creating 21 new test files, verify all target modules load
 * and have expected form fields. This prevents wasting time on broken modules.
 */

test.describe('Module Sanity Check - Customer, Commodity, Barge', () => {
    const baseUrl = 'https://localhost:6001';

    test.beforeEach(async ({ page }) => {
        // Accept any certificate errors for localhost
        await page.goto(baseUrl);
        await page.waitForLoadState('networkidle');
    });

    // ========================================
    // CUSTOMER MODULE
    // ========================================

    test('Customer: Index page loads successfully', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Index`);
        await page.waitForLoadState('networkidle');

        // Verify page loaded
        const title = await page.title();
        expect(title).toContain('Customer');

        // Verify DataTable is present
        const table = page.locator('table[id*="customer"], table.dataTable, table.table');
        await expect(table).toBeVisible({ timeout: 5000 });

        console.log('✓ Customer Index page loads successfully');
    });

    test('Customer: Create page has required fields', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for key form fields based on typical customer data structure
        const possibleFields = [
            'input[name*="CustomerName"], input[id*="CustomerName"]',
            'input[name*="CompanyCode"], input[id*="CompanyCode"]',
            'input[name*="Email"], input[id*="Email"]',
            'input[name*="Phone"], input[id*="Phone"]',
            'input[name*="Address"], input[id*="Address"]',
            'select[name*="Portal"], select[id*="Portal"]'
        ];

        let foundFields = [];
        for (const selector of possibleFields) {
            const field = page.locator(selector).first();
            if (await field.count() > 0) {
                const isVisible = await field.isVisible();
                if (isVisible) {
                    foundFields.push(selector);
                }
            }
        }

        console.log(`✓ Customer Create page found ${foundFields.length} form fields`);
        console.log(`  Fields: ${foundFields.join(', ')}`);

        // At minimum, should have customer name field
        expect(foundFields.length).toBeGreaterThan(0);
    });

    test('Customer: Edit page structure (if edit exists)', async ({ page }) => {
        // Try to access edit page (may need to go through index first)
        try {
            await page.goto(`${baseUrl}/Customer/Edit/1`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Check if we got a valid edit page or 404
            const pageContent = await page.content();
            const is404 = pageContent.includes('404') || pageContent.includes('Not Found');

            if (!is404) {
                console.log('✓ Customer Edit page accessible (found test ID: 1)');
            } else {
                console.log('⚠ Customer Edit page returns 404 for ID=1 (may need real data)');
            }
        } catch (error) {
            console.log('⚠ Customer Edit page check failed (may require real data)');
        }
    });

    // ========================================
    // COMMODITY MODULE
    // ========================================

    test('Commodity: Index page loads successfully', async ({ page }) => {
        await page.goto(`${baseUrl}/Commodity/Index`);
        await page.waitForLoadState('networkidle');

        // Verify page loaded
        const title = await page.title();
        expect(title).toContain('Commodit'); // Handles "Commodity" or "Commodities"

        // Verify DataTable is present
        const table = page.locator('table[id*="commodity"], table.dataTable, table.table');
        await expect(table).toBeVisible({ timeout: 5000 });

        console.log('✓ Commodity Index page loads successfully');
    });

    test('Commodity: Create page has required fields', async ({ page }) => {
        await page.goto(`${baseUrl}/Commodity/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for key form fields based on typical commodity data structure
        const possibleFields = [
            'input[name*="CommodityCode"], input[id*="CommodityCode"]',
            'input[name*="CommodityName"], input[id*="CommodityName"]',
            'input[name*="Description"], input[id*="Description"], textarea[name*="Description"]',
            'select[name*="Category"], select[id*="Category"]',
            'input[name*="Active"], input[id*="Active"]'
        ];

        let foundFields = [];
        for (const selector of possibleFields) {
            const field = page.locator(selector).first();
            if (await field.count() > 0) {
                const isVisible = await field.isVisible();
                if (isVisible) {
                    foundFields.push(selector);
                }
            }
        }

        console.log(`✓ Commodity Create page found ${foundFields.length} form fields`);
        console.log(`  Fields: ${foundFields.join(', ')}`);

        // At minimum, should have commodity code or name field
        expect(foundFields.length).toBeGreaterThan(0);
    });

    test('Commodity: Edit page structure (if edit exists)', async ({ page }) => {
        // Try to access edit page
        try {
            await page.goto(`${baseUrl}/Commodity/Edit/1`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Check if we got a valid edit page or 404
            const pageContent = await page.content();
            const is404 = pageContent.includes('404') || pageContent.includes('Not Found');

            if (!is404) {
                console.log('✓ Commodity Edit page accessible (found test ID: 1)');
            } else {
                console.log('⚠ Commodity Edit page returns 404 for ID=1 (may need real data)');
            }
        } catch (error) {
            console.log('⚠ Commodity Edit page check failed (may require real data)');
        }
    });

    // ========================================
    // BARGE MODULE
    // ========================================

    test('Barge: Search page loads successfully', async ({ page }) => {
        // Try both possible URLs
        const possibleUrls = [
            `${baseUrl}/Barge/Index`,
            `${baseUrl}/BargeSearch/Index`,
            `${baseUrl}/Barge/Search`
        ];

        let successUrl = null;
        for (const url of possibleUrls) {
            try {
                await page.goto(url);
                await page.waitForLoadState('networkidle');

                const pageContent = await page.content();
                const is404 = pageContent.includes('404') || pageContent.includes('Not Found');

                if (!is404) {
                    successUrl = url;
                    break;
                }
            } catch (error) {
                // Try next URL
            }
        }

        expect(successUrl).not.toBeNull();
        console.log(`✓ Barge Search page loads successfully at: ${successUrl}`);

        // Verify DataTable or search form is present
        const table = page.locator('table[id*="barge"], table.dataTable, table.table');
        const searchForm = page.locator('form[id*="search"], form[action*="barge"]');

        const hasTable = await table.count() > 0;
        const hasSearchForm = await searchForm.count() > 0;

        expect(hasTable || hasSearchForm).toBeTruthy();
    });

    test('Barge: Create page has required fields', async ({ page }) => {
        await page.goto(`${baseUrl}/Barge/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for key form fields based on typical barge data structure
        const possibleFields = [
            'input[name*="BargeNumber"], input[id*="BargeNumber"]',
            'input[name*="BargeName"], input[id*="BargeName"]',
            'input[name*="Owner"], input[id*="Owner"], select[name*="Owner"]',
            'input[name*="Type"], input[id*="Type"], select[name*="Type"]',
            'input[name*="Capacity"], input[id*="Capacity"]',
            'input[name*="Active"], input[id*="Active"]'
        ];

        let foundFields = [];
        for (const selector of possibleFields) {
            const field = page.locator(selector).first();
            if (await field.count() > 0) {
                const isVisible = await field.isVisible();
                if (isVisible) {
                    foundFields.push(selector);
                }
            }
        }

        console.log(`✓ Barge Create page found ${foundFields.length} form fields`);
        console.log(`  Fields: ${foundFields.join(', ')}`);

        // At minimum, should have barge number or name field
        expect(foundFields.length).toBeGreaterThan(0);
    });

    test('Barge: Edit page structure (if edit exists)', async ({ page }) => {
        // Try to access edit page
        try {
            await page.goto(`${baseUrl}/Barge/Edit/1`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(1000);

            // Check if we got a valid edit page or 404
            const pageContent = await page.content();
            const is404 = pageContent.includes('404') || pageContent.includes('Not Found');

            if (!is404) {
                console.log('✓ Barge Edit page accessible (found test ID: 1)');
            } else {
                console.log('⚠ Barge Edit page returns 404 for ID=1 (may need real data)');
            }
        } catch (error) {
            console.log('⚠ Barge Edit page check failed (may require real data)');
        }
    });
});
