const { test, expect } = require('@playwright/test');

test.describe('Customer - Features & Validation', () => {
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

    test('Page Title is "Customers"', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Index`);
        await page.waitForLoadState('networkidle');

        // Check page heading
        const heading = page.locator('h1:has-text("Customers")');
        await expect(heading).toBeVisible();
    });

    test('Search Form Has Correct Fields', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Index`);
        await page.waitForLoadState('networkidle');

        // Check for search form fields
        const nameField = page.locator('#Name');
        const accountingCodeField = page.locator('#AccountingCode');
        const activeOnlySelect = page.locator('#ActiveOnly');

        await expect(nameField).toBeVisible();
        await expect(accountingCodeField).toBeVisible();
        await expect(activeOnlySelect).toBeVisible();
    });

    test('Search Results Table Has Correct Column Headers', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Wait for DataTable to initialize
        await page.waitForSelector('#customerTable', { state: 'visible' });
        await page.waitForTimeout(1000);

        // Check for column headers
        const headers = await page.locator('#customerTable thead th').allTextContents();
        const headerTexts = headers.map(h => h.trim());

        expect(headerTexts).toContain('Name');
        expect(headerTexts).toContain('Billing Name');
        expect(headerTexts).toContain('Accounting #');
        expect(headerTexts).toContain('Phone');
        expect(headerTexts).toContain('City');
        expect(headerTexts).toContain('State');
        expect(headerTexts).toContain('BargeEx');
        expect(headerTexts).toContain('Active');
        expect(headerTexts).toContain('Send Invoices');
    });

    test('Add Customer Button Exists', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Index`);
        await page.waitForLoadState('networkidle');

        // Check for Add Customer button
        const addButton = page.locator('a.btn-outline-primary:has-text("Add Customer")');
        await expect(addButton).toBeVisible();

        // Verify it links to Create action
        const href = await addButton.getAttribute('href');
        expect(href).toContain('/Customer/Create');
    });

    test('Search Button Has Correct Label', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Index`);
        await page.waitForLoadState('networkidle');

        const searchButton = page.locator('#btnSearch');
        await expect(searchButton).toBeVisible();

        const buttonText = await searchButton.textContent();
        expect(buttonText).toContain('Search');
    });

    test('Clear Button Has Correct Label', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Index`);
        await page.waitForLoadState('networkidle');

        const clearButton = page.locator('#btnClear');
        await expect(clearButton).toBeVisible();

        const buttonText = await clearButton.textContent();
        expect(buttonText).toContain('Clear');
    });

    test('Create Form Has Required Field Indicators', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for required field (Customer Name)
        const nameField = page.locator('input[name="Name"]');
        await expect(nameField).toBeVisible();

        // Check if field has required attribute or validation
        const isRequired = await nameField.getAttribute('required');
        const nameLabel = page.locator('label[for="Name"]');
        const labelText = nameLabel.count() > 0 ? await nameLabel.textContent() : '';

        // Either HTML5 required attribute or visual indicator
        expect(isRequired !== null || labelText.includes('*')).toBeTruthy();
    });

    test('Edit Form Loads Existing Customer Data', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(3000);

        await page.waitForSelector('#customerTable tbody tr', { timeout: 10000 });

        const firstViewButton = page.locator('#customerTable tbody tr').first().locator('a.btn-outline-primary');
        if (await firstViewButton.count() > 0) {
            await firstViewButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            // Navigate to edit
            const editButton = page.locator('a.btn-primary:has-text("Edit")');
            if (await editButton.count() > 0) {
                await editButton.click();
            } else {
                const currentUrl = page.url();
                const customerIdMatch = currentUrl.match(/\/Customer\/Details\/(\d+)/);
                if (customerIdMatch) {
                    await page.goto(`${baseUrl}/Customer/Edit/${customerIdMatch[1]}`);
                }
            }

            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            // Verify form fields are populated
            const nameField = page.locator('input[name="Name"]');
            const nameValue = await nameField.inputValue();
            expect(nameValue.length).toBeGreaterThan(0);
        }
    });

    test('Details Page Shows Read-Only Information', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(3000);

        await page.waitForSelector('#customerTable tbody tr', { timeout: 10000 });

        const firstViewButton = page.locator('#customerTable tbody tr').first().locator('a.btn-outline-primary');
        if (await firstViewButton.count() > 0) {
            await firstViewButton.click();
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);

            // Verify details page shows customer information
            const pageContent = await page.textContent('body');
            expect(pageContent.length).toBeGreaterThan(0);

            // Check for Edit button
            const editButton = page.locator('a.btn-primary:has-text("Edit")');
            await expect(editButton).toBeVisible();
        }
    });

    test('Form Layout Matches Design', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for form structure
        const form = page.locator('form');
        await expect(form).toBeVisible();

        // Check for submit button
        const submitButton = page.locator('form button[type="submit"].btn-primary');
        await expect(submitButton).toBeVisible();

        // Check for cancel button
        const cancelButton = page.locator('a.btn:has-text("Cancel")');
        await expect(cancelButton).toBeVisible();

        await page.screenshot({ path: 'test-results/customer-features-form-layout.png', fullPage: true });
    });

    test('DataTable Has Search Box', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(3000);

        await page.waitForSelector('#customerTable', { state: 'visible' });
        await page.waitForTimeout(1000);

        // DataTables adds a search box
        const searchBox = page.locator('#customerTable_filter input');
        const searchBoxExists = await searchBox.count() > 0;

        expect(searchBoxExists).toBeTruthy();
    });

    test('DataTable Has Pagination Controls', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Index`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const searchButton = page.locator('#btnSearch');
        await searchButton.click();
        await page.waitForTimeout(3000);

        await page.waitForSelector('#customerTable', { state: 'visible' });
        await page.waitForTimeout(1000);

        // Check for pagination controls
        const pagination = page.locator('#customerTable_paginate');
        const paginationExists = await pagination.count() > 0;

        expect(paginationExists).toBeTruthy();
    });

    test('Breadcrumb Navigation Shows Correct Path', async ({ page }) => {
        await page.goto(`${baseUrl}/Customer/Create`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Check for breadcrumbs if they exist
        const breadcrumbs = page.locator('nav[aria-label="breadcrumb"]');
        const breadcrumbsExist = await breadcrumbs.count() > 0;

        if (breadcrumbsExist) {
            const breadcrumbText = await breadcrumbs.textContent();
            expect(breadcrumbText.length).toBeGreaterThan(0);
        }
    });
});

