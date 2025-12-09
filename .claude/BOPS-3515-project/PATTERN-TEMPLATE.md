# Playwright Test Pattern Template
## Extracted from Boat Location Gold Standard Tests

**Purpose:** This document provides the authoritative pattern for creating new Playwright E2E tests for Customer, Commodity, and Barge modules.

**Source Files:**
- `boat-location.create.behavior.spec.js` (702 LOC) - PRIMARY REFERENCE
- `boat-location.search.behavior.spec.js` (584 LOC)
- `boat-location.edit.behavior.spec.js` (470 LOC)

---

## File Structure Template

```javascript
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('ModuleName - Test Type', () => {
    // Report object for markdown generation
    let testReport = {
        testSuite: 'ModuleName Test Type',
        timestamp: new Date().toISOString(),
        baseURL: 'https://localhost:6001/Module/Action',
        scenarios: []
    };

    // Tracking arrays
    let consoleLogs = [];
    let consoleErrors = [];
    let networkRequests = [];
    let networkResponses = [];

    test.beforeEach(async ({ page }) => {
        // Clear tracking arrays
        consoleLogs = [];
        consoleErrors = [];
        networkRequests = [];
        networkResponses = [];

        // Capture console messages
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

        // Capture page errors
        page.on('pageerror', error => {
            consoleErrors.push({
                type: 'pageerror',
                text: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Capture network requests
        page.on('request', request => {
            if (request.url().includes('Module')) { // Adjust filter
                networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    postData: request.postData(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Capture network responses
        page.on('response', async response => {
            if (response.url().includes('Module')) { // Adjust filter
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

        // Navigate to page
        await page.goto('https://localhost:6001/Module/Index');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
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
                    log.text.includes('[Module]') ||
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
        scenario.consoleLogs.logs.slice(-15).forEach(log => {
            console.log(`[${log.type.toUpperCase()}] ${log.text}`);
        });
        console.log('\nNETWORK ACTIVITY:');
        networkResponses.forEach(resp => {
            console.log(`${resp.method || 'RESPONSE'} ${resp.url} - Status: ${resp.status}`);
        });
        console.log('========================================\n');
    }

    test.afterAll(async () => {
        const reportPath = path.join(__dirname, '..', 'test-results', 'ModuleName_TEST_TYPE_REPORT.md');

        let markdown = `# ModuleName Test Type Report\n\n`;
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

    test('Test Scenario 1', async ({ page }) => {
        const scenarioName = 'Short Name';
        const description = 'Detailed description of what this test verifies.';

        const inputs = {
            // Input data used in test
        };

        // TEST IMPLEMENTATION
        // 1. Perform actions
        // 2. Wait for results
        // 3. Capture observations
        // 4. Screenshot
        // 5. Log results

        const observations = {
            // What happened during the test
        };

        await page.screenshot({ path: 'test-results/module-scenario-name.png', fullPage: true });
        captureScenarioResult(scenarioName, description, inputs, observations);

        // Optional assertions
        // expect(something).toBeTruthy();
    });

    // Additional test scenarios...
});
```

---

## Test Data Convention

**CRITICAL: All test data MUST use the `PWTEST` prefix**

### Why PWTEST?
- Makes test records instantly identifiable in database
- Easy to clean up test data
- Prevents confusion with real production data
- Enables search queries like `WHERE Name LIKE 'PWTEST%'`

### Examples:

```javascript
// Customer test data
const testCustomer = {
    customerName: 'PWTEST Customer ' + Date.now(),
    companyCode: 'PWTST' + Date.now().toString().slice(-4),
    billingName: 'PWTEST Billing',
    contactName: 'PWTEST Contact',
    emailAddress: 'pwtest@example.com'
};

// Commodity test data
const testCommodity = {
    commodityCode: 'PWTST' + Date.now().toString().slice(-4),
    commodityName: 'PWTEST Commodity ' + Date.now(),
    description: 'PWTEST test commodity'
};

// Barge test data
const testBarge = {
    bargeNumber: 'PWTST' + Date.now().toString().slice(-4),
    bargeName: 'PWTEST Barge ' + Date.now(),
    owner: 'PWTEST Owner'
};
```

**Pattern:**
- Names/descriptions: `PWTEST {Type} ${Date.now()}`
- Codes/numbers: `PWTST${Date.now().toString().slice(-4)}`
- Emails: `pwtest@example.com`

---

## Common Locator Patterns

```javascript
// Form fields
page.locator('input[name="FieldName"]')
page.locator('select[name="DropdownName"]')
page.locator('textarea[name="TextAreaName"]')
page.locator('input[id="CheckboxId"]')

// Buttons
page.locator('button[type="submit"].btn-primary')  // Submit button
page.locator('button.btn-secondary')                // Cancel button
page.locator('#btnSearch')                          // Search button (by ID)

// Validation messages
page.locator('.validation-summary-errors')          // Summary div
page.locator('.alert-danger')                       // Error alert
page.locator('span[data-valmsg-for="FieldName"]')  // Field-specific error
page.locator('.field-validation-error')             // Any field error

// Success messages
page.locator('.alert-success')

// Tables
page.locator('#tableId tbody tr')                   // All rows
page.locator('#tableId tbody tr td')                // All cells
page.locator('#tableId .btn-primary').first()       // First edit button
```

---

## Timing Patterns

```javascript
// After filling a field
await page.locator('input[name="Field"]').fill(value);
await page.waitForTimeout(500);

// After navigation
await page.goto('url');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1500);

// After form submission
await submitButton.click();
await page.waitForTimeout(3000);  // Shorter for simple forms
await page.waitForTimeout(4000);  // Longer for complex forms
```

---

## Standard Test Scenarios

Every module should have these 7 test files:

### 1. create.behavior.spec.js
Tests form behavior during creation:
- Empty form submission (validation)
- Valid minimal data
- Valid complete data
- SQL injection attempts
- XSS attempts
- Max length validation
- Special characters
- Rapid submission prevention

### 2. create.e2e.spec.js
Tests complete creation workflow:
- Navigate from index → create → submit → details
- Verify all data persists correctly
- Check breadcrumbs and navigation
- Verify record appears in search results

### 3. edit.behavior.spec.js
Tests edit form behavior:
- Load existing record
- Update fields
- Clear required fields (validation)
- Invalid data handling
- Save updates
- Cancel discards changes

### 4. search.behavior.spec.js
Tests search functionality:
- Empty search
- Search by name (exact and partial)
- Search by code
- DataTable pagination
- DataTable sorting
- Results per page
- Active/inactive filters

### 5. delete.e2e.spec.js
Tests deletion/deactivation:
- Deactivate record (IsActive=false)
- Verify in inactive filter
- Reactivate record
- Verify in active filter

### 6. features.validation.spec.js
Tests UI features and layout:
- Page titles correct
- Column headers correct
- Required field indicators present
- Button labels correct
- Breadcrumbs correct
- Form layout matches design

### 7. error-handling.spec.js
Tests error scenarios:
- 404 for nonexistent IDs
- Server validation errors
- Network errors
- Browser back button
- Concurrent edits
- Session timeout

---

## Assertion Patterns

```javascript
// Visibility
await expect(page.locator('.alert-success')).toBeVisible();
await expect(page.locator('.alert-danger')).not.toBeVisible();

// Content
await expect(page.locator('h1')).toHaveText('Expected Title');
const text = await page.locator('.message').textContent();
expect(text).toContain('expected substring');

// Counts
const rows = page.locator('table tbody tr');
await expect(rows).toHaveCount(5);

// URLs
expect(page.url()).toContain('/Index');

// Field validation
const field = page.locator('#FieldName');
await expect(field).toHaveClass(/is-invalid/);

// Checkbox state
const checkbox = page.locator('#CheckboxId');
expect(await checkbox.isChecked()).toBeTruthy();

// Dropdown selected value
const dropdown = page.locator('select[name="Name"]');
const selected = await dropdown.inputValue();
expect(selected).toBe('expectedValue');
```

---

## Security Testing Patterns

### SQL Injection Test Data
```javascript
{
    field1: "'; DROP TABLE Users; --",
    field2: "1' OR '1'='1",
    field3: "Robert'); DELETE FROM Customers WHERE 1=1; --"
}
```

### XSS Test Data
```javascript
{
    field1: "<script>alert('XSS');</script>",
    field2: "<img src=x onerror=alert('XSS')>",
    field3: "<iframe src=\"javascript:alert('XSS')\"></iframe>",
    field4: "test+<script>@example.com"
}
```

### Verification
```javascript
// Check if script appears unescaped in DOM
const pageContent = await page.content();
const hasUnescapedScript = pageContent.includes('<script>alert(');

// Check if script executed
const hasScriptExecuted = await page.evaluate(() => {
    return window.xssTestExecuted === true;
});

const observations = {
    xssVulnerability: {
        unescapedScriptInDOM: hasUnescapedScript,
        scriptExecuted: hasScriptExecuted
    },
    potentialVulnerability: hasUnescapedScript || hasScriptExecuted
};
```

---

## Screenshot Naming Convention

```javascript
// Pattern: {module}-scenario{number}-{descriptive-name}.png
await page.screenshot({
    path: 'test-results/customer-scenario1-empty-submission.png',
    fullPage: true
});

await page.screenshot({
    path: 'test-results/customer-scenario2-valid-minimal.png',
    fullPage: true
});

await page.screenshot({
    path: 'test-results/commodity-create-sql-injection.png',
    fullPage: true
});
```

---

## Network Monitoring Patterns

```javascript
// Capture specific request
let createRequest = null;

page.on('request', request => {
    if (request.url().includes('/Customer/Edit') && request.method() === 'POST') {
        createRequest = request;
    }
});

// Perform action that triggers request
await submitButton.click();
await page.waitForLoadState('networkidle');

// Verify request was made
expect(createRequest).not.toBeNull();
expect(createRequest.method()).toBe('POST');

// Check POST data
const postData = createRequest.postData();
expect(postData).toContain('PWTEST');
```

---

## Module-Specific Customizations

### Customer Module
- **URL Pattern:** `/Customer/Index`, `/Customer/Edit/{id}`, `/Customer/Details/{id}`
- **Key Fields:** CustomerName (required), CompanyCode, EmailAddress
- **Special Features:** BargeEx settings, Portal group management

### Commodity Module
- **URL Pattern:** `/Commodity/Index`, `/Commodity/Edit/{id}`, `/Commodity/Details/{id}`
- **Key Fields:** CommodityCode (required), CommodityName (required)
- **Special Features:** Unit of measure dropdown

### Barge Module
- **URL Pattern:** `/BargeSearch/Index`, `/Barge/Edit/{id}`, `/Barge/Details/{id}`
- **Key Fields:** BargeNumber (required, unique), BargeName (required), Capacity (decimal)
- **Special Features:** Year built validation, capacity as decimal

---

## Error Messages to Check

```javascript
// Common validation messages
const expectedErrors = [
    'This field is required',
    'The {field} field is required',
    'Please enter a valid email address',
    'The field must be a string with a maximum length of {n}',
    'The value must be between {min} and {max}'
];

// Capture actual errors
const validationSummary = page.locator('.validation-summary-errors');
const errors = await validationSummary.locator('li').allTextContents();
const cleanErrors = errors.filter(e => e.trim());

// Check for specific error
const hasRequiredFieldError = cleanErrors.some(err =>
    err.includes('required') || err.includes('Required')
);
```

---

## Best Practices

1. **Always use PWTEST prefix** for test data
2. **Always capture screenshots** on key scenarios
3. **Always wait for network idle** after navigation
4. **Always log console errors** for debugging
5. **Always check both validation summary and field-specific errors**
6. **Always test SQL injection and XSS**
7. **Always verify form prevents rapid submission**
8. **Always test boundary values** (max length, negative numbers, etc.)
9. **Always use descriptive test names** that explain what is being verified
10. **Always generate markdown reports** for documentation

---

## File Naming Convention

```
{module}.{action}.{type}.spec.js

Examples:
- customer.create.behavior.spec.js
- customer.create.e2e.spec.js
- customer.edit.behavior.spec.js
- customer.search.behavior.spec.js
- customer.delete.e2e.spec.js
- customer.features.validation.spec.js
- customer.error-handling.spec.js

- commodity.create.behavior.spec.js
- commodity.create.e2e.spec.js
... (same pattern)

- barge.create.behavior.spec.js
- barge.create.e2e.spec.js
... (same pattern)
```

---

## Expected LOC per File

Based on boat-location analysis:
- create.behavior.spec.js: ~600-700 LOC
- create.e2e.spec.js: ~500 LOC
- edit.behavior.spec.js: ~450-470 LOC
- search.behavior.spec.js: ~550-584 LOC
- delete.e2e.spec.js: ~300-323 LOC
- features.validation.spec.js: ~450 LOC
- error-handling.spec.js: ~350-382 LOC

**Total per module:** ~3,200-3,400 LOC
**Total for 3 modules:** ~9,600-10,200 LOC

---

## End of Pattern Template

This document should be used as the authoritative reference when creating new tests for Customer, Commodity, and Barge modules.
