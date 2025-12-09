# BOPS-3515 Execution-Ready Plan
## Playwright Testing + Jira Evidence Automation - Complete Context

**Document Purpose:** This document contains everything needed to execute the plan in a fresh Claude Code session, including full context, background, technical details, and step-by-step instructions.

**Last Updated:** 2025-12-04
**Project:** BargeOps Admin Monorepo - BOPS-3515 (Admin Web App v2)
**Working Directory:** `C:\Users\layden\OneDrive - Cornerstone Solutions Group\Desktop\AI Projects\Pilot Interanl AI\Admin Web App Generation & QA Eng Testing\BargeOps.Admin.Mono`

---

## Quick Start for Fresh Session

**When starting a new session, tell Claude:**

```
I need you to execute the plan in this document:
C:\Users\layden\OneDrive - Cornerstone Solutions Group\Desktop\AI Projects\Pilot Interanl AI\Admin Web App Generation & QA Eng Testing\BargeOps.Admin.Mono\.claude\tasks\BOPS-3515-EXECUTION-READY-PLAN.md

Read the entire document first to understand the context, then begin execution starting at Phase 1.
Use 4 agents in parallel where indicated for maximum speed.
Ask me for approval at each checkpoint before proceeding.
```

---

## Executive Summary

### The Problem

**BOPS-3533 status analysis revealed:**
- Boat Location module has 9 comprehensive Playwright tests (4,229 LOC) - GOLD STANDARD
- Other 6 admin modules have ZERO Playwright tests
- Jira ticket statuses don't match reality (5+ tickets marked "To Do" are actually implemented)
- No automated process to post test evidence to Jira tickets

**Impact:** Cannot confidently release 85% of admin functionality because it's untested.

### The Solution

Create Playwright E2E tests for 3 ready modules (Customer, Commodity, Barge) following the Boat Location gold standard pattern, and automate posting of test results as evidence to Jira tickets.

**NOT doing:** Full CI/CD integration (too complex)
**ARE doing:** Simple script-based automation to post test results to Jira

### Key Decisions Made by User

1. **Scope:** Focus on 4 modules only (Boat already done, add Customer, Commodity, Barge)
   - Skip Facility, River Area, Vendor (no UI yet)
2. **MCPs:** Install Azure DevOps MCP + SQL Server MCP
3. **Timeline:** Aggressive (4 agents in parallel, 4 days)
4. **Jira Integration:** Automatic posting of test results to tickets
5. **Approval:** User approves at every checkpoint

---

## Project Background & Context

### BargeOps Admin Monorepo Structure

```
BargeOps.Admin.Mono/
├── src/
│   ├── BargeOps.API/          # REST API (.NET 8, Dapper, SQL Server)
│   │   ├── src/Admin.Api/     # API controllers
│   │   ├── src/Admin.Domain/  # Models, DTOs
│   │   └── src/Admin.Infrastructure/ # Repositories, SQL
│   ├── BargeOps.UI/           # MVC Web App (.NET 8, Razor, jQuery)
│   └── BargeOps.Shared/       # Shared libraries
├── tests/
│   └── playwright/            # Playwright E2E tests (WHERE WE WORK)
├── scripts/                   # Automation scripts (WHERE WE CREATE JIRA AUTOMATION)
├── docs/                      # Documentation
└── .claude/                   # Templates & plans
```

### BOPS-3515 Epic Structure

**Parent Epic:** BOPS-3515 - Admin Web App v2

**Child Modules:**
- BOPS-3533 - Boat Admin - V2 (26 subtasks)
- BOPS-3534 - Commodity Admin - V2
- BOPS-3535 - River Admin - V2
- BOPS-3516 - Customer Admin - V2
- BOPS-3517 - Barge Admin - V2
- BOPS-3522 - Facility Admin - V2
- BOPS-3532 - Vendor Admin - V2

**Pattern:** Each module broken into 3 sub-tasks: API, UI, QA Artifact (UI Testing)

---

## Module Implementation Status

### Complete Analysis Matrix

| Module | API Status | UI Status | Playwright Tests | Ready for Testing? | Action |
|--------|-----------|-----------|------------------|-------------------|--------|
| **Boat Location** | ✅ Complete | ✅ Complete (8 views) | ✅ **9 tests (4,229 LOC)** | YES | Reference only (already done) |
| **Customer** | ✅ Complete | ✅ Complete (8 views) | ❌ None | YES | **CREATE 7 TESTS** |
| **Commodity** | ✅ Complete | ✅ Complete (5 views) | ❌ None | YES | **CREATE 7 TESTS** |
| **Barge** | ✅ Complete | ✅ Complete (2 views) | ❌ None | YES | **CREATE 7 TESTS** |
| **Facility** | ✅ Complete | ❌ Missing | ❌ None | NO | Skip (no UI) |
| **River Area** | ✅ Complete | ❌ Missing | ❌ None | NO | Skip (no UI) |
| **Vendor** | ✅ Complete | ❌ Missing | ❌ None | NO | Skip (no UI) |

### Boat Location (Gold Standard - DO NOT MODIFY)

**Why it's the gold standard:**
- 9 comprehensive test files
- 4,229 lines of test code
- Covers all workflows: create, edit, search, delete
- Includes validation, error handling, data integrity
- Excellent console logging and error capture
- Screenshots on failures
- Network monitoring
- Follows best practices

**Existing Test Files:**
1. `boat-location.create.behavior.spec.js` (702 LOC)
2. `boat-location.create.e2e.spec.js` (502 LOC)
3. `boat-location.edit.behavior.spec.js` (470 LOC)
4. `boat-location.search.behavior.spec.js` (584 LOC)
5. `boat-location.delete.e2e.spec.js` (323 LOC)
6. `boat-location.features.validation.spec.js` (452 LOC)
7. `boat-location.error-handling.spec.js` (382 LOC)
8. `boat-location.data-integrity.spec.js` (364 LOC)
9. `boat-location-completed-tasks.spec.js` (450 LOC)

**Pattern to replicate:** Create 7 similar test files for each module (Customer, Commodity, Barge)

### Customer Module (Ready - Need Tests)

**API Controller:** `src/BargeOps.UI/Controllers/CustomerController.cs`

**UI Views (8 files):**
- `Views/Customer/Index.cshtml` - Search/list page with DataTables
- `Views/Customer/Edit.cshtml` - Edit form
- `Views/Customer/Details.cshtml` - Read-only details
- `Views/Customer/BargeExSettings.cshtml` - BargeEx configuration
- `Views/Customer/Portal.cshtml` - Portal group management
- `Views/Customer/_CustomerSearch.cshtml` - Partial: Search form
- `Views/Customer/_CustomerSearchResults.cshtml` - Partial: Results table
- `Views/Customer/_PortalGroupsEditor.cshtml` - Partial: Portal groups

**UI Endpoints:**
- Index: `https://localhost:6001/Customer/Index`
- Edit: `https://localhost:6001/Customer/Edit/{id}`
- Details: `https://localhost:6001/Customer/Details/{id}`

**Key Fields:**
- CustomerName (required, max 100)
- CompanyCode (max 20)
- BillingName (max 100)
- ContactName (max 100)
- EmailAddress (email format)
- PhoneNumber (max 20)
- IsActive (boolean)

**Test Data Pattern:**
```javascript
const testCustomer = {
    customerName: 'PWTEST Customer ' + Date.now(),
    companyCode: 'PWTST' + Date.now().toString().slice(-4),
    billingName: 'PWTEST Billing',
    contactName: 'PWTEST Contact',
    emailAddress: 'pwtest@example.com',
    phoneNumber: '555-0100'
};
```

### Commodity Module (Ready - Need Tests)

**API Controller:** `src/BargeOps.UI/Controllers/CommodityController.cs`

**UI Views (5 files):**
- `Views/Commodity/Index.cshtml` - Search/list page
- `Views/Commodity/Edit.cshtml` - Edit form
- `Views/Commodity/Details.cshtml` - Read-only details
- `Views/Commodity/_CommoditySearch.cshtml` - Partial: Search form
- `Views/Commodity/_CommoditySearchResults.cshtml` - Partial: Results table

**UI Endpoints:**
- Index: `https://localhost:6001/Commodity/Index`
- Edit: `https://localhost:6001/Commodity/Edit/{id}`
- Details: `https://localhost:6001/Commodity/Details/{id}`

**Key Fields:**
- CommodityCode (required, max 20)
- CommodityName (required, max 100)
- Description (max 500)
- UnitOfMeasure (max 20)
- IsActive (boolean)

**Test Data Pattern:**
```javascript
const testCommodity = {
    commodityCode: 'PWTST' + Date.now().toString().slice(-4),
    commodityName: 'PWTEST Commodity ' + Date.now(),
    description: 'PWTEST test commodity',
    unitOfMeasure: 'TON',
    isActive: true
};
```

### Barge Module (Ready - Need Tests)

**API Controller:** `src/BargeOps.UI/Controllers/BargeController.cs`

**UI Views (2 files accessed via BargeSearch):**
- `Views/BargeSearch/Index.cshtml` - Search page
- `Views/Barge/Edit.cshtml` - Edit form
- `Views/Barge/Details.cshtml` - Read-only details

**UI Endpoints:**
- Search: `https://localhost:6001/BargeSearch/Index`
- Edit: `https://localhost:6001/Barge/Edit/{id}`
- Details: `https://localhost:6001/Barge/Details/{id}`

**Key Fields:**
- BargeNumber (required, unique, max 20)
- BargeName (required, max 100)
- Capacity (decimal, tons)
- YearBuilt (integer, year)
- Owner (max 100)
- IsActive (boolean)

**Test Data Pattern:**
```javascript
const testBarge = {
    bargeNumber: 'PWTST' + Date.now().toString().slice(-4),
    bargeName: 'PWTEST Barge ' + Date.now(),
    capacity: 1500.0,
    yearBuilt: new Date().getFullYear(),
    owner: 'PWTEST Owner',
    isActive: true
};
```

---

## Technical Context

### Playwright Configuration

**Location:** `tests/playwright/playwright.config.js`

**Key Settings:**
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

### Test File Standard Structure

**Every test file must include:**

```javascript
const { test, expect } = require('@playwright/test');

// Logging setup
const consoleMessages = [];
const errors = [];

test.describe('Module Name - Test Type', () => {
    test.beforeEach(async ({ page }) => {
        // Capture console messages
        page.on('console', msg => {
            consoleMessages.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString()
            });
        });

        // Capture page errors
        page.on('pageerror', error => {
            errors.push({
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });

        // Navigate to base page
        await page.goto('/Module/Index');
    });

    test.afterEach(async ({ page }, testInfo) => {
        // Log errors if test failed
        if (testInfo.status === 'failed') {
            console.log('Console messages:', consoleMessages);
            console.log('Page errors:', errors);
        }
    });

    test('Test description', async ({ page }) => {
        // Test implementation
    });
});
```

### Test Data Conventions

**CRITICAL:** All test data must use `PWTEST` prefix to identify test records

```javascript
// Good - Easy to identify and clean up
customerName: 'PWTEST Customer ' + Date.now()

// Bad - Mixes with real data
customerName: 'Test Customer'
```

**Why:** Makes it easy to:
- Identify test records in database
- Clean up test data
- Avoid confusion with real data
- Search for test records

---

## Boat Location Pattern Analysis

### Console Logging Pattern

**From `boat-location.create.behavior.spec.js`:**

```javascript
const consoleMessages = [];
const errors = [];

test.beforeEach(async ({ page }) => {
    // Clear arrays
    consoleMessages.length = 0;
    errors.length = 0;

    // Capture console output
    page.on('console', msg => {
        consoleMessages.push({
            type: msg.type(),
            text: msg.text(),
            timestamp: new Date().toISOString()
        });
    });

    // Capture page errors
    page.on('pageerror', error => {
        errors.push({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
    });

    await page.goto('/BoatLocationSearch/Index');
});

test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
        console.log('\n=== Console Messages ===');
        consoleMessages.forEach(msg => {
            console.log(`[${msg.timestamp}] ${msg.type.toUpperCase()}: ${msg.text}`);
        });

        if (errors.length > 0) {
            console.log('\n=== Page Errors ===');
            errors.forEach(err => {
                console.log(`[${err.timestamp}] ${err.message}`);
                console.log(err.stack);
            });
        }
    }
});
```

**Pattern to replicate in all new test files**

### Test Naming Convention

```javascript
// Pattern: Clear, descriptive, action-based
test('Empty form submission shows validation errors', async ({ page }) => {});
test('Valid minimal data creates record successfully', async ({ page }) => {});
test('SQL injection attempt is blocked', async ({ page }) => {});
test('Max length validation prevents overflow', async ({ page }) => {});
```

### Assertion Patterns

```javascript
// Visibility checks
await expect(page.locator('#errorMessage')).toBeVisible();
await expect(page.locator('#successMessage')).not.toBeVisible();

// Content checks
await expect(page.locator('h1')).toHaveText('Customer Search');
const text = await page.locator('#customerName').textContent();
expect(text).toContain('PWTEST');

// Count checks
const rows = page.locator('table tbody tr');
await expect(rows).toHaveCount(1);

// Form validation
const nameField = page.locator('#CustomerName');
await expect(nameField).toHaveClass(/is-invalid/);
```

### Network Monitoring Pattern

```javascript
test('Create request uses POST method', async ({ page }) => {
    let createRequest = null;

    // Capture network requests
    page.on('request', request => {
        if (request.url().includes('/Customer/Edit') && request.method() === 'POST') {
            createRequest = request;
        }
    });

    // Perform action
    await page.fill('#CustomerName', 'PWTEST Customer');
    await page.click('button[type="submit"]');

    // Verify request was made
    await page.waitForLoadState('networkidle');
    expect(createRequest).not.toBeNull();
    expect(createRequest.method()).toBe('POST');
});
```

---

## MCP Configuration

### Current State

**Already Configured:**
- **Jira (Atlassian) MCP** ✅
  - Docker-based
  - Configuration: `.mcp.json`
  - Credentials: `.env.atlassian`
  - Working and tested

### To Install in Phase 1

**Azure DevOps MCP:**
```json
{
  "mcpServers": {
    "atlassian": { /* existing */ },
    "azuredevops": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-azuredevops"],
      "env": {
        "AZDO_ORG": "csgstl",
        "AZDO_PROJECT": "BargeOps",
        "AZDO_PAT": "YOUR_PERSONAL_ACCESS_TOKEN"
      }
    }
  }
}
```

**SQL Server MCP:**
```json
{
  "mcpServers": {
    "sqlserver": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-mssql"],
      "env": {
        "MSSQL_CONNECTION_STRING": "Server=...;Database=UnitTow;..."
      }
    }
  }
}
```

**Ask user for:**
- Azure DevOps Personal Access Token (PAT)
- SQL Server connection string

---

## E2E Tests vs Unit Tests - Explained

### Unit Tests
**What:** Test individual code components in isolation
- Test a single function, method, or class
- Example: Testing that a "CalculateTotal()" function correctly adds numbers
- Speed: Very fast (milliseconds)
- Scope: Narrow - one piece of logic
- Dependencies: Mocked/faked (doesn't touch real database, APIs)

### E2E (End-to-End) Tests
**What:** Test complete user workflows through the UI
- Test entire features as a user would use them
- Example: "User logs in → searches for a boat → edits it → saves → verifies changes"
- Speed: Slower (seconds to minutes)
- Scope: Broad - entire application stack (UI → API → Database)
- Dependencies: Real (uses actual browser, database, etc.)

**Playwright tests are E2E tests** - they prove features work from user's perspective

---

## Implementation Plan

### Timeline: 4 Days (Aggressive)

| Day | Phase | Agents | Key Activities |
|-----|-------|--------|----------------|
| **Day 1 AM** | Phase 1 | Infrastructure | Setup MCPs, verify Playwright, analyze pattern, create script foundation |
| **Day 1 PM** | Phase 2 | 3 Test Agents | Begin creating Customer, Commodity, Barge tests (parallel) |
| **Day 2** | Phase 2 | 3 Test Agents | Complete all 21 test files |
| **Day 3 AM** | Phase 3 | Infrastructure | Complete Jira automation, test integration |
| **Day 3 PM** | Phase 4 | Documentation | Create all documentation |
| **Day 4** | Phase 5 | Validation | Full test run, Jira validation, final report |

### Deliverables

**Test Files (21 new):**
- Customer: 7 test files (~3,200 LOC)
- Commodity: 7 test files (~3,200 LOC)
- Barge: 7 test files (~3,200 LOC)
- **Total: ~9,600 LOC**

**Automation:**
- `scripts/jira-test-reporter.js` - Main script
- `scripts/test-config.json` - Ticket mapping
- `scripts/package.json` - Dependencies

**Documentation:**
- `docs/testing/playwright-execution-guide.md`
- `docs/testing/playwright-architecture.md`
- `docs/testing/playwright-troubleshooting.md`
- `docs/testing/BOPS-3515-implementation-report.md`

---

## Phase 1: Setup & Infrastructure (Day 1 AM - 2.5 hours)

### 1.1 Install MCPs (30 min)
**Agent:** Infrastructure Agent

**Tasks:**
1. Ask user for Azure DevOps PAT token
2. Ask user for SQL Server connection string
3. Update `.mcp.json` with Azure DevOps MCP config
4. Update `.mcp.json` with SQL Server MCP config
5. Restart Claude Code or reload MCPs
6. Test Jira MCP: Query BOPS-3515 tickets
7. Test Azure DevOps MCP: Query BargeOps repo
8. Test SQL Server MCP: Query database

**Success Criteria:**
- [ ] All 3 MCPs active in Claude Code
- [ ] Can fetch BOPS-3515 subtasks from Jira
- [ ] Can query git repository
- [ ] Can query database

**✋ CHECKPOINT:** User verifies MCPs working before continuing

---

### 1.2 Verify Playwright Setup (15 min)
**Agent:** Infrastructure Agent

**Tasks:**
1. Navigate to `tests/playwright`
2. Run one existing boat-location test:
   ```bash
   npx playwright test boat-location.create.behavior.spec.js --reporter=html,json
   ```
3. Verify HTML report generated at `playwright-report/index.html`
4. Verify JSON results at `test-results/results.json`
5. Check for screenshots in `test-results/` (if any failures)
6. Document execution time

**Expected:**
- Test passes (if environment is set up)
- HTML report opens in browser
- JSON file contains test results

**If tests fail:** Document errors, fix environment issues first

---

### 1.3 Analyze Boat Location Pattern (30 min)
**Agent:** Infrastructure Agent

**Tasks:**
1. Read and analyze these reference files:
   - `tests/playwright/boat-location.create.behavior.spec.js` (PRIMARY REFERENCE)
   - `tests/playwright/boat-location.search.behavior.spec.js`
   - `tests/playwright/boat-location.edit.behavior.spec.js`

2. Extract and document:
   - Console logging setup (beforeEach/afterEach pattern)
   - Error capture mechanism
   - Network request monitoring
   - Screenshot conventions
   - Test data patterns (PWTEST prefix)
   - Assertion patterns
   - Test structure template

3. Create pattern template document for test agents

**Deliverable:** Pattern analysis document with code examples for test creation agents

---

### 1.4 Create Jira Automation Script Foundation (1 hour)
**Agent:** Infrastructure Agent

**Create File:** `scripts/jira-test-reporter.js`

**Core Structure:**
```javascript
#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = require('./test-config.json');

/**
 * Run Playwright tests for a specific module
 * @param {string} modulePattern - e.g., 'customer', 'commodity', 'barge', 'all'
 */
async function runPlaywrightTests(modulePattern) {
    const pattern = modulePattern === 'all'
        ? '*.spec.js'
        : `${modulePattern}.*.spec.js`;

    const command = `npx playwright test ${pattern} --reporter=json,html`;

    console.log(`Running: ${command}`);
    execSync(command, {
        cwd: path.join(__dirname, '../tests/playwright'),
        stdio: 'inherit'
    });
}

/**
 * Parse JSON test results
 */
function parseTestResults(jsonPath) {
    const resultsPath = path.join(__dirname, '../tests/playwright', jsonPath);
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    return {
        total: data.suites.reduce((sum, suite) => sum + suite.specs.length, 0),
        passed: data.suites.reduce((sum, suite) =>
            sum + suite.specs.filter(spec => spec.ok).length, 0),
        failed: data.suites.reduce((sum, suite) =>
            sum + suite.specs.filter(spec => !spec.ok).length, 0),
        duration: data.duration,
        tests: extractAllTests(data.suites)
    };
}

/**
 * Extract test details from suites
 */
function extractAllTests(suites) {
    const tests = [];
    suites.forEach(suite => {
        suite.specs.forEach(spec => {
            tests.push({
                title: spec.title,
                file: spec.file,
                ok: spec.ok,
                duration: spec.tests[0]?.results[0]?.duration || 0
            });
        });
    });
    return tests;
}

/**
 * Group tests by Jira ticket using config mapping
 */
function groupTestsByTicket(results, module) {
    const ticketMap = {};

    results.tests.forEach(test => {
        const fileName = path.basename(test.file);
        const ticketKey = config.testFileToTicket[fileName];

        if (ticketKey) {
            if (!ticketMap[ticketKey]) {
                ticketMap[ticketKey] = [];
            }
            ticketMap[ticketKey].push(test);
        }
    });

    return ticketMap;
}

/**
 * Format test results as Jira Wiki markup
 */
function formatJiraComment(tests, results) {
    const timestamp = new Date().toISOString();
    const passed = tests.filter(t => t.ok).length;
    const failed = tests.filter(t => !t.ok).length;

    return `
h3. 🤖 Automated Test Evidence
*Test Run:* ${timestamp}
*Total Tests:* ${tests.length}
*Passed:* {color:green}✓ ${passed}{color}
*Failed:* {color:red}✗ ${failed}{color}
*Duration:* ${(results.duration / 1000).toFixed(2)}s

h4. Test Details
${tests.map(t => {
    const status = t.ok ? '{color:green}✓{color}' : '{color:red}✗{color}';
    return `* ${status} ${t.title} (${(t.duration / 1000).toFixed(2)}s)`;
}).join('\n')}

{panel:title=📊 View Detailed Report}
See attached HTML report for:
* Full test execution logs
* Screenshots of test steps
* Network request/response details
* Console logs and errors
{panel}

_Generated by Playwright Test Automation_
`;
}

/**
 * Post test evidence to Jira (uses MCP)
 */
async function postTestEvidence(issueKey, tests, results) {
    console.log(`Posting evidence to ${issueKey}...`);

    // Use Jira MCP to add comment
    const comment = formatJiraComment(tests, results);
    await jiraMCP.addComment(issueKey, comment);

    // Attach HTML report
    const reportPath = path.join(__dirname, '../tests/playwright/playwright-report/index.html');
    if (fs.existsSync(reportPath)) {
        await jiraMCP.attachFile(issueKey, reportPath, 'test-report.html');
        console.log(`  ✓ Attached HTML report`);
    }

    // Attach screenshots for failures
    const failures = tests.filter(t => !t.ok);
    for (const failure of failures) {
        const screenshotPath = findScreenshotForTest(failure);
        if (screenshotPath && fs.existsSync(screenshotPath)) {
            await jiraMCP.attachFile(issueKey, screenshotPath);
            console.log(`  ✓ Attached screenshot: ${path.basename(screenshotPath)}`);
        }
    }
}

/**
 * Find screenshot file for a failed test
 */
function findScreenshotForTest(test) {
    const testResultsDir = path.join(__dirname, '../tests/playwright/test-results');
    // Implementation depends on Playwright's screenshot naming convention
    // Typically: {test-name}-{browser}-{timestamp}.png
    return null; // TODO: Implement screenshot finding logic
}

/**
 * Main execution function
 */
async function reportTestsToJira(module, options = {}) {
    console.log(`\n=== Jira Test Reporter ===`);
    console.log(`Module: ${module}`);
    console.log(`Dry run: ${options.dryRun || false}\n`);

    try {
        // 1. Run tests
        if (!options.skipTests) {
            await runPlaywrightTests(module);
        }

        // 2. Parse results
        const results = parseTestResults('test-results/results.json');
        console.log(`\nTest Results: ${results.passed}/${results.total} passed\n`);

        // 3. Group by ticket
        const ticketMap = groupTestsByTicket(results, module);
        console.log(`Found ${Object.keys(ticketMap).length} tickets with test evidence\n`);

        // 4. Post to Jira (unless dry run)
        if (!options.dryRun) {
            for (const [ticketKey, tests] of Object.entries(ticketMap)) {
                await postTestEvidence(ticketKey, tests, results);
            }
            console.log(`\n✓ All evidence posted to Jira`);
        } else {
            console.log(`\nDry run - would post to these tickets:`);
            Object.keys(ticketMap).forEach(key => {
                console.log(`  - ${key} (${ticketMap[key].length} tests)`);
            });
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const module = args[0] || 'all';
    const dryRun = args.includes('--dry-run');
    const skipTests = args.includes('--skip-tests');

    reportTestsToJira(module, { dryRun, skipTests });
}

module.exports = { reportTestsToJira };
```

**Create File:** `scripts/test-config.json`

```json
{
  "testFileToTicket": {
    "customer.create.behavior.spec.js": "BOPS-TBD1",
    "customer.create.e2e.spec.js": "BOPS-TBD1",
    "customer.edit.behavior.spec.js": "BOPS-TBD2",
    "customer.search.behavior.spec.js": "BOPS-TBD3",
    "customer.delete.e2e.spec.js": "BOPS-TBD4",
    "customer.features.validation.spec.js": "BOPS-TBD5",
    "customer.error-handling.spec.js": "BOPS-TBD6",

    "commodity.create.behavior.spec.js": "BOPS-TBD7",
    "commodity.create.e2e.spec.js": "BOPS-TBD7",
    "commodity.edit.behavior.spec.js": "BOPS-TBD8",
    "commodity.search.behavior.spec.js": "BOPS-TBD9",
    "commodity.delete.e2e.spec.js": "BOPS-TBD10",
    "commodity.features.validation.spec.js": "BOPS-TBD11",
    "commodity.error-handling.spec.js": "BOPS-TBD12",

    "barge.create.behavior.spec.js": "BOPS-TBD13",
    "barge.create.e2e.spec.js": "BOPS-TBD13",
    "barge.edit.behavior.spec.js": "BOPS-TBD14",
    "barge.search.behavior.spec.js": "BOPS-TBD15",
    "barge.delete.e2e.spec.js": "BOPS-TBD16",
    "barge.features.validation.spec.js": "BOPS-TBD17",
    "barge.error-handling.spec.js": "BOPS-TBD18"
  },
  "notes": "Replace BOPS-TBD# with actual Jira ticket numbers when available"
}
```

**Create File:** `scripts/package.json`

```json
{
  "name": "jira-test-reporter",
  "version": "1.0.0",
  "description": "Automated Playwright test results reporter for Jira",
  "main": "jira-test-reporter.js",
  "scripts": {
    "report": "node jira-test-reporter.js",
    "report:customer": "node jira-test-reporter.js customer",
    "report:commodity": "node jira-test-reporter.js commodity",
    "report:barge": "node jira-test-reporter.js barge",
    "report:all": "node jira-test-reporter.js all"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

**✋ CHECKPOINT 1:** User reviews script design before Phase 2

---

## Phase 2: Create Playwright Tests (Days 1-2)

### Test File Specifications

**Each module gets 7 test files:**

1. **{module}.create.behavior.spec.js** (~600 LOC)
2. **{module}.create.e2e.spec.js** (~500 LOC)
3. **{module}.edit.behavior.spec.js** (~450 LOC)
4. **{module}.search.behavior.spec.js** (~550 LOC)
5. **{module}.delete.e2e.spec.js** (~300 LOC)
6. **{module}.features.validation.spec.js** (~450 LOC)
7. **{module}.error-handling.spec.js** (~350 LOC)

### 2.1 Customer Module Tests

**Agent:** Customer Test Agent (works in parallel with Commodity and Barge agents)

**Reference Files (read these first):**
- `tests/playwright/boat-location.create.behavior.spec.js` - Primary pattern
- `tests/playwright/boat-location.search.behavior.spec.js` - Search pattern
- `tests/playwright/boat-location.edit.behavior.spec.js` - Edit pattern

**UI Endpoints:**
- Index: `https://localhost:6001/Customer/Index`
- Edit: `https://localhost:6001/Customer/Edit/{id}`
- Details: `https/localhost:6001/Customer/Details/{id}`

**Create 7 Test Files:**

#### File 1: `customer.create.behavior.spec.js`

**Test Scenarios:**
- Empty form submission shows validation errors
- Valid minimal data creates customer successfully
- Valid complete data creates customer with all fields
- SQL injection attempt is blocked
- XSS attempt is sanitized
- Max length validation prevents overflow (CustomerName max 100)
- Special characters are handled correctly
- Rapid submission is prevented (button disabled after click)
- Required fields show proper indicators
- Optional fields can be left empty
- Cancel button returns to index
- Created customer appears in search results

#### File 2: `customer.create.e2e.spec.js`

**Test Scenarios:**
- Complete creation workflow from index to details
- Navigate from index → create → submit → details page
- Details page shows all entered data correctly
- Edit link from details page works
- Return to list link works
- Breadcrumb navigation is correct
- Created customer has correct IsActive status

#### File 3: `customer.edit.behavior.spec.js`

**Test Scenarios:**
- Edit page loads existing customer data
- All fields populated correctly from database
- Update customer name successfully
- Update multiple fields simultaneously
- Clear optional field values
- Invalid data shows validation errors
- Save button updates database
- Cancel button discards changes
- Updated data appears in details view
- Active/Inactive toggle works

#### File 4: `customer.search.behavior.spec.js`

**Test Scenarios:**
- Search by customer name (exact match)
- Search by customer name (partial match with wildcard)
- Search by company code
- Empty search shows validation error or all results
- No results message displays correctly
- Results show correct columns
- DataTable pagination works
- DataTable sorting works (click column headers)
- Results per page selector works
- Edit link in results navigates to edit page
- Details link in results navigates to details page
- Active/Inactive filter works

#### File 5: `customer.delete.e2e.spec.js`

**Test Scenarios:**
- Deactivate customer (set IsActive=false)
- Deactivated customer shows in inactive filter
- Reactivate customer (set IsActive=true)
- Reactivated customer shows in active filter
- Delete confirmation dialog shows (if implemented)
- Cannot delete customer with dependencies (if applicable)

#### File 6: `customer.features.validation.spec.js`

**Test Scenarios:**
- Page title is "Customer Search"
- Column headers are correct
- Required field indicators present (red asterisk)
- Button labels are correct ("Save", "Cancel", etc.)
- Field labels match requirements
- Breadcrumb navigation shows correct path
- Form layout matches design
- DataTable has search box
- DataTable has pagination controls

#### File 7: `customer.error-handling.spec.js`

**Test Scenarios:**
- 404 error for nonexistent customer ID
- Server validation errors display correctly
- Network error handling (simulate)
- Browser back button behavior
- Concurrent edit conflict handling (if implemented)
- Session timeout handling (if implemented)
- SQL injection attempts blocked
- XSS attempts sanitized

**Test Data:**
```javascript
const testCustomer = {
    customerName: 'PWTEST Customer ' + Date.now(),
    companyCode: 'PWTST' + Date.now().toString().slice(-4),
    billingName: 'PWTEST Billing',
    contactName: 'PWTEST Contact',
    emailAddress: 'pwtest@example.com',
    phoneNumber: '555-0100',
    address1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345'
};
```

**✋ CHECKPOINT 2:** User reviews Customer tests

---

### 2.2 Commodity Module Tests

**Agent:** Commodity Test Agent (works in parallel)

**Reference:** Same boat-location patterns

**UI Endpoints:**
- Index: `https://localhost:6001/Commodity/Index`
- Edit: `https://localhost:6001/Commodity/Edit/{id}`
- Details: `https://localhost:6001/Commodity/Details/{id}`

**Create 7 Test Files:**
(Similar structure to Customer, adapted for Commodity fields)

1. `commodity.create.behavior.spec.js`
2. `commodity.create.e2e.spec.js`
3. `commodity.edit.behavior.spec.js`
4. `commodity.search.behavior.spec.js`
5. `commodity.delete.e2e.spec.js`
6. `commodity.features.validation.spec.js`
7. `commodity.error-handling.spec.js`

**Test Data:**
```javascript
const testCommodity = {
    commodityCode: 'PWTST' + Date.now().toString().slice(-4),
    commodityName: 'PWTEST Commodity ' + Date.now(),
    description: 'PWTEST test commodity for automated testing',
    unitOfMeasure: 'TON',
    isActive: true
};
```

**Key Differences from Customer:**
- Commodity has code field (4-20 chars)
- Unit of measure dropdown
- Simpler structure than Customer

**✋ CHECKPOINT 3:** User reviews Commodity tests

---

### 2.3 Barge Module Tests

**Agent:** Barge Test Agent (works in parallel)

**Reference:** Same boat-location patterns

**UI Endpoints:**
- Search: `https://localhost:6001/BargeSearch/Index`
- Edit: `https://localhost:6001/Barge/Edit/{id}`
- Details: `https://localhost:6001/Barge/Details/{id}`

**Create 7 Test Files:**
(Similar structure, adapted for Barge fields)

1. `barge.create.behavior.spec.js`
2. `barge.create.e2e.spec.js`
3. `barge.edit.behavior.spec.js`
4. `barge.search.behavior.spec.js`
5. `barge.delete.e2e.spec.js`
6. `barge.features.validation.spec.js`
7. `barge.error-handling.spec.js`

**Test Data:**
```javascript
const testBarge = {
    bargeNumber: 'PWTST' + Date.now().toString().slice(-4),
    bargeName: 'PWTEST Barge ' + Date.now(),
    capacity: 1500.0,
    yearBuilt: new Date().getFullYear(),
    owner: 'PWTEST Owner',
    bargeType: 'Hopper',
    status: 'Active',
    isActive: true
};
```

**Key Differences:**
- Barge number must be unique
- Capacity is decimal field
- Year built validation (must be valid year)

**✋ CHECKPOINT 4:** User reviews all modules' tests

---

## Phase 3: Jira Automation (Day 3 AM)

### 3.1 Complete Jira Reporter Script

**Agent:** Infrastructure Agent

**Tasks:**
1. Implement missing functions in `jira-test-reporter.js`:
   - `findScreenshotForTest()` - Find screenshot files for failed tests
   - Jira MCP integration wrapper functions
   - Error handling and logging

2. Add CLI help and documentation
3. Test script with dry run
4. Update `test-config.json` with actual Jira ticket numbers (ask user)

**Jira MCP Integration:**
```javascript
// Wrapper for Jira MCP calls
const jiraMCP = {
    async addComment(issueKey, comment) {
        // Use mcp__atlassian__jira_add_comment
        return await mcp.call('atlassian', 'jira_add_comment', {
            issue_key: issueKey,
            comment: comment
        });
    },

    async attachFile(issueKey, filePath, fileName) {
        // Use mcp__atlassian__jira_add_attachment
        const fileData = fs.readFileSync(filePath);
        const base64Data = fileData.toString('base64');

        return await mcp.call('atlassian', 'jira_add_attachment', {
            issue_key: issueKey,
            file_name: fileName || path.basename(filePath),
            file_data: base64Data
        });
    }
};
```

---

### 3.2 Test Jira Integration

**Agent:** Infrastructure Agent

**Test Sequence:**

1. **Dry Run Test:**
   ```bash
   cd scripts
   node jira-test-reporter.js customer --dry-run
   ```
   - Should show what would be posted
   - No actual Jira posts

2. **Single Test Post:**
   ```bash
   node jira-test-reporter.js customer
   ```
   - Posts to first Customer ticket
   - User verifies in Jira UI

3. **Verify in Jira:**
   - Comment posted with correct formatting
   - Headers, colors, bullets render correctly
   - HTML report attached and downloadable
   - Screenshots attached (if any failures)
   - No errors in script output

4. **Fix any issues** before proceeding

**✋ CHECKPOINT 5:** User reviews first Jira post before continuing

---

## Phase 4: Documentation (Day 3 PM)

### 4.1 Playwright Execution Guide

**Agent:** Documentation Agent

**Create:** `docs/testing/playwright-execution-guide.md`

**Content Structure:**

```markdown
# Playwright Test Execution Guide

## Overview
This guide explains how to run Playwright tests for the BargeOps Admin application and post results to Jira.

## Prerequisites
- Node.js installed
- Playwright installed (`npm install` in tests/playwright/)
- Application running at https://localhost:6001
- Database with test data access

## Running Tests Locally

### Run All Tests
```bash
cd tests/playwright
npx playwright test
```

### Run Specific Module
```bash
# Customer tests only
npx playwright test customer.*.spec.js

# Commodity tests only
npx playwright test commodity.*.spec.js

# Barge tests only
npx playwright test barge.*.spec.js

# Boat Location tests only
npx playwright test boat-location.*.spec.js
```

### Run Specific Test Type
```bash
# All create behavior tests
npx playwright test *.create.behavior.spec.js

# All search tests
npx playwright test *.search.behavior.spec.js

# All error handling tests
npx playwright test *.error-handling.spec.js
```

### Run Single Test File
```bash
npx playwright test customer.create.behavior.spec.js
```

### View HTML Report
```bash
# Generate report (happens automatically after test run)
npx playwright show-report

# Report opens in browser at http://localhost:9323
```

## Posting Results to Jira

### Prerequisites
- Tests must be run first (generates results.json)
- Jira ticket numbers configured in scripts/test-config.json
- Jira MCP configured in Claude Code

### Post Single Module
```bash
cd scripts
node jira-test-reporter.js customer
node jira-test-reporter.js commodity
node jira-test-reporter.js barge
```

### Post All Modules
```bash
node jira-test-reporter.js all
```

### Dry Run (No Actual Posting)
```bash
# See what would be posted without posting
node jira-test-reporter.js customer --dry-run
```

### Skip Test Execution (Use Existing Results)
```bash
# Post results without re-running tests
node jira-test-reporter.js customer --skip-tests
```

## Understanding Test Results

### Pass/Fail Indicators
- ✓ Green checkmark = Test passed
- ✗ Red X = Test failed

### HTML Report Contents
- Test execution summary
- Individual test results with timing
- Screenshots for failed tests
- Console logs
- Network requests
- Video recordings (if enabled)

### JSON Results Location
- `tests/playwright/test-results/results.json`
- Machine-readable format
- Used by Jira reporter script

## Troubleshooting

### Application Not Running
**Error:** "Target page, context or browser has been closed"
**Fix:** Start the application at https://localhost:6001

### Database Connection Issues
**Error:** "Unable to connect to database"
**Fix:** Verify SQL Server is running and connection string is correct

### Test Failures
**Cause:** Application changes broke tests
**Fix:** Review failure screenshots in HTML report, update tests if needed

### Jira Posting Errors
**Error:** "Failed to post to Jira"
**Fix:** Verify Jira MCP is configured, check network connectivity

## Best Practices

1. **Run tests before committing code**
2. **Review HTML report for failures**
3. **Post evidence to Jira before moving tickets to QA**
4. **Clean up test data periodically** (records starting with "PWTEST")
5. **Don't commit test-results/ or playwright-report/ folders**

## Test Data Cleanup

### Find Test Records
```sql
SELECT * FROM Customers WHERE CustomerName LIKE 'PWTEST%'
SELECT * FROM Commodities WHERE CommodityName LIKE 'PWTEST%'
SELECT * FROM Barges WHERE BargeNumber LIKE 'PWTST%'
```

### Delete Test Records
```sql
DELETE FROM Customers WHERE CustomerName LIKE 'PWTEST%'
DELETE FROM Commodities WHERE CommodityName LIKE 'PWTEST%'
DELETE FROM Barges WHERE BargeNumber LIKE 'PWTST%'
```

## Continuous Integration (Future)

Currently tests run manually. Future enhancements:
- Run tests on every PR
- Auto-post results to Jira
- Block merge if tests fail
```

---

### 4.2 Playwright Architecture Documentation

**Create:** `docs/testing/playwright-architecture.md`

**Content:** Test organization, patterns, naming conventions, architecture diagrams

---

### 4.3 Troubleshooting Guide

**Create:** `docs/testing/playwright-troubleshooting.md`

**Content:** Common issues and solutions

---

### 4.4 Update Main Documentation

**Update:** `docs/testing/README.md` and `CLAUDE.md`

**✋ CHECKPOINT 6:** User reviews all documentation

---

## Phase 5: Validation & Handoff (Day 4)

### 5.1 Full Test Suite Execution

**Agent:** Validation Agent

**Execute:**
```bash
cd tests/playwright
npx playwright test --reporter=html,json
```

**Expected:**
- Total files: 36+ (9 boat + 21 new + 6 other)
- Total cases: 180+
- Pass rate: 100%
- Duration: 15-30 minutes

**Verify:**
- All tests pass
- HTML report generated
- JSON results available
- No flaky tests

---

### 5.2 Jira Integration Validation

**Execute:**
```bash
cd scripts
node jira-test-reporter.js all
```

**Verify in Jira:**
- Evidence posted to all tickets
- Comments formatted correctly
- HTML reports attached
- Screenshots attached for failures
- No duplicates

---

### 5.3 Create Final Report

**Create:** `docs/testing/BOPS-3515-implementation-report.md`

**Content:** Project summary, deliverables, metrics, next steps

**✋ CHECKPOINT 7:** Final sign-off

---

## Critical Files Reference

### Gold Standard (READ, DO NOT MODIFY)
- `tests/playwright/boat-location.create.behavior.spec.js`
- `tests/playwright/boat-location.search.behavior.spec.js`
- `tests/playwright/boat-location.edit.behavior.spec.js`
- `tests/playwright.config.js`

### Controllers (READ for understanding)
- `src/BargeOps.UI/Controllers/CustomerController.cs`
- `src/BargeOps.UI/Controllers/CommodityController.cs`
- `src/BargeOps.UI/Controllers/BargeController.cs`

### To CREATE - Automation
- `scripts/jira-test-reporter.js`
- `scripts/test-config.json`
- `scripts/package.json`

### To CREATE - Customer Tests (7 files)
- `tests/playwright/customer.create.behavior.spec.js`
- `tests/playwright/customer.create.e2e.spec.js`
- `tests/playwright/customer.edit.behavior.spec.js`
- `tests/playwright/customer.search.behavior.spec.js`
- `tests/playwright/customer.delete.e2e.spec.js`
- `tests/playwright/customer.features.validation.spec.js`
- `tests/playwright/customer.error-handling.spec.js`

### To CREATE - Commodity Tests (7 files)
- `tests/playwright/commodity.create.behavior.spec.js`
- `tests/playwright/commodity.create.e2e.spec.js`
- `tests/playwright/commodity.edit.behavior.spec.js`
- `tests/playwright/commodity.search.behavior.spec.js`
- `tests/playwright/commodity.delete.e2e.spec.js`
- `tests/playwright/commodity.features.validation.spec.js`
- `tests/playwright/commodity.error-handling.spec.js`

### To CREATE - Barge Tests (7 files)
- `tests/playwright/barge.create.behavior.spec.js`
- `tests/playwright/barge.create.e2e.spec.js`
- `tests/playwright/barge.edit.behavior.spec.js`
- `tests/playwright/barge.search.behavior.spec.js`
- `tests/playwright/barge.delete.e2e.spec.js`
- `tests/playwright/barge.features.validation.spec.js`
- `tests/playwright/barge.error-handling.spec.js`

### To CREATE - Documentation
- `docs/testing/playwright-execution-guide.md`
- `docs/testing/playwright-architecture.md`
- `docs/testing/playwright-troubleshooting.md`
- `docs/testing/BOPS-3515-implementation-report.md`

### To UPDATE
- `docs/testing/README.md`
- `CLAUDE.md`

---

## Success Criteria

### Phase 1 Complete
- ✅ All MCPs installed and tested
- ✅ Playwright verified working
- ✅ Boat Location pattern documented
- ✅ Jira script foundation created

### Phase 2 Complete
- ✅ 21 test files created (7 × 3 modules)
- ✅ All tests follow boat-location pattern
- ✅ 100% pass rate
- ✅ PWTEST prefix used

### Phase 3 Complete
- ✅ Jira automation complete
- ✅ Posts comments to Jira
- ✅ Attachments work
- ✅ Configuration documented

### Phase 4 Complete
- ✅ All documentation created
- ✅ Guides tested
- ✅ Main docs updated

### Phase 5 Complete
- ✅ All tests pass (100%)
- ✅ Jira evidence posted
- ✅ Final report delivered
- ✅ Knowledge transfer complete

---

## Agent Assignments

| Phase | Agent | Responsibilities |
|-------|-------|------------------|
| Phase 1 | Infrastructure | Setup MCPs, verify Playwright, analyze pattern, create script foundation |
| Phase 2 | Customer Test | Create 7 Customer test files |
| Phase 2 | Commodity Test | Create 7 Commodity test files |
| Phase 2 | Barge Test | Create 7 Barge test files |
| Phase 3 | Infrastructure | Complete Jira automation, test integration |
| Phase 4 | Documentation | Create all documentation |
| Phase 5 | Validation | Full test run, Jira validation, final report |

**Parallel Execution:**
- Phase 2: Customer, Commodity, Barge agents work simultaneously
- Maximum 3-4 agents at once

---

## Approval Checkpoints

1. **After Phase 1.4:** Review script design
2. **After Phase 2.1:** Review Customer tests
3. **After Phase 2.2:** Review Commodity tests
4. **After Phase 2.3:** Review Barge tests (all modules)
5. **After Phase 3.2:** Review first Jira post
6. **After Phase 4.4:** Review all documentation
7. **After Phase 5.3:** Final project sign-off

**User approves at EVERY checkpoint before proceeding**

---

## Timeline Summary

| Day | Activities | Duration |
|-----|-----------|----------|
| **Day 1** | Setup + Begin test creation | 8 hours |
| **Day 2** | Complete all 21 test files | 8 hours |
| **Day 3** | Jira automation + Documentation | 8 hours |
| **Day 4** | Validation + Final report | 4 hours |
| **Total** | | **28 hours** (aggressive) |

---

## End of Execution-Ready Plan

**This document contains all context needed to execute the plan in a fresh Claude Code session.**

**To start execution, open this file and tell Claude to begin at Phase 1.**
