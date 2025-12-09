# Playwright Test Architecture

## Overview
This document describes the architecture, organization, and patterns used in the BargeOps Admin Playwright test suite.

## Test Organization

### File Structure
```
tests/playwright/
├── boat-location.*.spec.js      # Gold standard (9 files)
├── customer.*.spec.js            # Customer module (7 files)
├── commodity.*.spec.js           # Commodity module (7 files)
├── barge.*.spec.js               # Barge module (7 files)
├── playwright.config.js          # Configuration
└── package.json                  # Dependencies
```

### Test File Naming Convention
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
```

### Test Types

1. **create.behavior.spec.js** - Form behavior during creation
2. **create.e2e.spec.js** - Complete creation workflow
3. **edit.behavior.spec.js** - Edit form behavior
4. **search.behavior.spec.js** - Search functionality
5. **delete.e2e.spec.js** - Deactivation/reactivation workflows
6. **features.validation.spec.js** - UI features and layout validation
7. **error-handling.spec.js** - Error scenarios and edge cases

## Test Patterns

### Standard Test Structure

Every test file follows this pattern:

```javascript
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('ModuleName - Test Type', () => {
    let testReport = { /* report object */ };
    let consoleLogs = [];
    let consoleErrors = [];
    let networkRequests = [];
    let networkResponses = [];

    test.beforeEach(async ({ page }) => {
        // Clear arrays
        // Set up console/error listeners
        // Set up network listeners
        // Navigate to page
    });

    function captureScenarioResult(scenarioName, description, inputs, observations) {
        // Capture test scenario data
    }

    test.afterAll(async () => {
        // Generate markdown report
    });

    test('Scenario 1: Description', async ({ page }) => {
        // Test implementation
    });
});
```

### Console Logging Pattern

All tests capture console messages and page errors:

```javascript
page.on('console', msg => {
    consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
    });
});

page.on('pageerror', error => {
    consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
});
```

### Network Monitoring Pattern

Tests monitor network requests and responses:

```javascript
page.on('request', request => {
    if (request.url().includes('Module')) {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            postData: request.postData(),
            timestamp: new Date().toISOString()
        });
    }
});

page.on('response', async response => {
    if (response.url().includes('Module')) {
        // Capture response data
    }
});
```

### Test Data Convention

**CRITICAL:** All test data uses `PWTEST` prefix:

```javascript
const testCustomer = {
    customerName: 'PWTEST Customer ' + Date.now(),
    companyCode: 'PWTST' + Date.now().toString().slice(-4)
};
```

**Why:**
- Makes test records instantly identifiable
- Easy to clean up test data
- Prevents confusion with real data

## Configuration

### Playwright Config (`playwright.config.js`)

```javascript
{
  baseURL: 'https://localhost:6001',
  timeout: 60000,
  workers: 1,  // Sequential execution
  retries: 2,
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ]
}
```

## Report Generation

### Markdown Reports

Each test file generates a markdown report in `test-results/`:

- `CustomerSearch_FORM_BEHAVIOR_REPORT.md`
- `CommodityEdit_FORM_BEHAVIOR_REPORT.md`
- etc.

Reports include:
- Test scenarios with inputs and observations
- Console logs summary
- Network activity details
- Timestamps and metadata

### HTML Reports

Playwright generates interactive HTML reports:
- Location: `tests/playwright/playwright-report/index.html`
- View with: `npx playwright show-report`
- Includes screenshots, videos, traces

## Module-Specific Details

### Customer Module
- **Base URL:** `/Customer/Index`
- **Table ID:** `#customerTable`
- **Key Fields:** Name, AccountingCode, IsActive
- **Endpoints:** `/Customer/Edit/{id}`, `/Customer/Details/{id}`

### Commodity Module
- **Base URL:** `/Commodity/Index`
- **Table ID:** `#commodityTable`
- **Key Fields:** CommodityCode, CommodityName, Description, IsActive
- **Endpoints:** `/Commodity/Edit/{id}`, `/Commodity/Details/{id}`

### Barge Module
- **Base URL:** `/BargeSearch/Index`
- **Table ID:** `#bargeTable`
- **Key Fields:** BargeNumber, BargeName, Capacity, IsActive
- **Endpoints:** `/Barge/Edit/{id}`, `/Barge/Details/{id}`

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

