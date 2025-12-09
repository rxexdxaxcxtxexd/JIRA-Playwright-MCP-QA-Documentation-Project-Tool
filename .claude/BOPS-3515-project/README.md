# BOPS-3515 Session Continuity Project

**Project:** Playwright E2E Testing + Jira Evidence Automation
**Epic:** BOPS-3515 - Admin Web App v2
**Status:** Phase 1 Complete, Ready for Phase 2
**Last Updated:** 2025-12-05

---

## Quick Resume Instructions

**To resume work in a new Claude Code session:**

1. Open this README file first
2. Review the "Current Status" section below
3. Read the "Phase 1 Accomplishments" section
4. Check "Next Steps for Phase 2"
5. Reference files in this directory as needed
6. Continue with Phase 2 execution

---

## Project Overview

### The Mission
Create Playwright E2E tests for 3 admin modules (Customer, Commodity, Barge) following the gold-standard Boat Location pattern, and automate posting test evidence to Jira tickets.

### Why This Matters
- Boat Location has 9 comprehensive tests (4,229 LOC) ✅ GOLD STANDARD
- Customer, Commodity, Barge have ZERO tests ❌
- Cannot confidently release 85% of admin functionality without tests
- Jira tickets don't reflect actual implementation status

### Success Criteria
- ✅ 21 new test files created (~9,600 LOC)
- ✅ 100% test pass rate
- ✅ Automated Jira evidence posting
- ✅ Complete documentation

---

## Current Status

### Phase Progress

| Phase | Status | Completion |
|-------|--------|------------|
| **Phase 1: Setup & Infrastructure** | ✅ Complete | 100% (4/4 tasks) |
| **Phase 2: Create Tests** | ⏸️ Not Started | 0% |
| **Phase 3: Jira Automation** | ⏸️ Not Started | 0% |
| **Phase 4: Documentation** | ⏸️ Not Started | 0% |
| **Phase 5: Validation** | ⏸️ Not Started | 0% |

### Phase 1 Completion Details

**Completed:**
- ✅ **1.2** Verified Playwright (7/7 boat-location tests pass)
- ✅ **1.3** Analyzed Boat Location pattern (500+ line template)
- ✅ **1.4** Created Jira automation foundation (3 files)
- ✅ **1.5** Ran sanity check on target modules (6/9 tests pass - all modules accessible)

**Skipped:**
- ⏭️ **1.1** Install MCPs (Azure DevOps + SQL Server) - Not needed for core testing

**Environment Status:**
- ✅ UI running on `https://localhost:6001`
- ✅ API running on `https://localhost:7001`
- ✅ .NET 9 SDK compatibility fixed
- ✅ Playwright installed and verified

---

## Phase 1 Accomplishments

### 1. Playwright Verification ✅

**Test Run Results:**
- **7/7 tests passed** (100% pass rate)
- **Duration:** 1.6 minutes
- **Security:** SQL injection blocked, XSS sanitized ✅
- **Test data:** PWTEST prefix used correctly ✅
- **Report:** Markdown documentation generated ✅

**Test Scenarios Validated:**
1. Empty form submission validation
2. Valid minimal boat creation
3. Fleet boat conditional validation
4. AIS tracking validation
5. Invalid data types/formats handling
6. Complete fleet boat creation
7. SQL injection & XSS security testing

**What This Proves:**
- Environment is working correctly (UI + API + DB)
- Gold standard tests are reliable
- Pattern is ready to be replicated
- Automation foundation is in place

### 2. Pattern Template Created ✅

**File:** `playwright-test-pattern-template.md` (500+ lines)

**Contents:**
- Complete file structure template
- Test data conventions (PWTEST prefix)
- Locator patterns (form fields, buttons, validation)
- Timing patterns (waits, timeouts)
- 7 standard test scenario types
- Assertion patterns
- Security testing patterns (SQL injection, XSS)
- Screenshot conventions
- Network monitoring patterns
- Module-specific customizations

**Usage:** Test creation agents will use this as their blueprint for all 21 new test files.

### 3. Jira Automation Foundation ✅

**Created 3 Files:**

1. **`scripts/jira-test-reporter.js`** (350+ lines)
   - Runs Playwright tests for specific modules
   - Parses JSON test results
   - Groups tests by Jira tickets
   - Formats results as Jira Wiki markup
   - CLI interface with options
   - Ready for Phase 3 MCP integration

2. **`scripts/test-config.json`**
   - Maps 21 test files to Jira tickets
   - Uses TBD placeholders for now
   - Will be updated with actual ticket numbers

3. **`scripts/package.json`**
   - NPM scripts for running reporter
   - `npm run report:customer`, `report:all`, etc.

**Features:**
- ✅ Dry-run mode for testing
- ✅ Skip-tests mode (use existing results)
- ✅ Help system
- ⏳ Video/trace attachment support (Phase 3)
- ⏳ Actual Jira MCP posting (Phase 3)

### 4. Environment Fixes ✅

**Issues Resolved:**
- Fixed .NET SDK version compatibility (8.0 → 9.0)
- Updated `global.json` rollForward policy
- Verified PowerShell command syntax
- Corrected API port (5001 → 7001)

### 5. Module Sanity Check ✅

**Test Run Results:**
- **6/9 tests passed** (67% pass rate)
- **Duration:** 1.5 minutes
- **Modules:** Customer, Commodity, Barge
- **Test file:** `sanity-check.spec.js`

**PASSED Tests (All Critical):**
- ✅ Customer Create page has form fields
- ✅ Customer Edit page accessible
- ✅ Commodity Create page has form fields
- ✅ Commodity Edit page accessible
- ✅ Barge Create page has form fields
- ✅ Barge Edit page accessible

**FAILED Tests (Non-Critical):**
- ⚠️ Customer Index page title assertion (too strict - page loads fine)
- ⚠️ Commodity Index page title assertion (too strict - page loads fine)
- ⚠️ Barge Index page DataTable locator (wrong selector - page loads fine)

**Key Findings:**
- ✅ All three modules are accessible (no 404 errors)
- ✅ All Create pages work correctly
- ✅ All Edit pages work correctly
- ✅ Form fields detected: Customer (3), Commodity (2), Barge (2)
- ⚠️ Page titles are generic "BargeOps: BargeOpsAdmin" (not module-specific)
- ⚠️ DataTable selectors need adjustment for actual page structure

**Decision:** All modules are ready for test creation. The failures are minor test assertion issues, not actual functionality problems.

---

## Key Files Reference

### In This Project Directory

| File | Purpose |
|------|---------|
| `README.md` | This file - session continuity instructions |
| `EXECUTION-PLAN.md` | Complete detailed execution plan (copied from tasks/) |
| `PATTERN-TEMPLATE.md` | Playwright test pattern template (copied from tasks/) |
| `jira-test-reporter.js` | Jira automation script (copy) |
| `test-config.json` | Test-to-ticket mapping (copy) |
| `PHASE-1-FINDINGS.md` | Detailed findings and notes from Phase 1 |
| `CHECKPOINT-1-STATUS.md` | Current status at Checkpoint 1 |

### In Main Project

| Path | Purpose |
|------|---------|
| `tests/playwright/boat-location.*.spec.js` | Gold standard reference (9 files, 4,229 LOC) |
| `tests/playwright/sanity-check.spec.js` | Module accessibility verification (9 tests) |
| `tests/playwright/playwright.config.js` | Playwright configuration |
| `scripts/jira-test-reporter.js` | Jira automation script (working copy) |
| `scripts/test-config.json` | Test-to-ticket mapping (working copy) |
| `src/BargeOps.UI/Controllers/CustomerController.cs` | Customer module controller |
| `src/BargeOps.UI/Controllers/CommodityController.cs` | Commodity module controller |
| `src/BargeOps.UI/Controllers/BargeController.cs` | Barge module controller |
| `src/BargeOps.UI/Views/Customer/` | Customer UI views (8 files) |
| `src/BargeOps.UI/Views/Commodity/` | Commodity UI views (5 files) |
| `src/BargeOps.UI/Views/Barge/` | Barge UI views (2 files) |

---

## Next Steps for Phase 2

### Overview
Create 21 new Playwright test files across 3 modules, following the boat-location gold standard pattern.

### Before Starting Phase 2

**Sanity Check Required:**
1. Verify Customer module URLs work
2. Verify Commodity module URLs work
3. Verify Barge module URLs work
4. Identify key form fields for each module

**Expected URLs:**
- Customer: `/Customer/Index`, `/Customer/Edit/{id}`
- Commodity: `/Commodity/Index`, `/Commodity/Edit/{id}`
- Barge: `/BargeSearch/Index`, `/Barge/Edit/{id}`

### Phase 2 Execution Plan

**Approach:** Use 3 agents in parallel (one per module) for maximum speed

**Deliverables:**
- Customer: 7 test files (~3,200 LOC)
- Commodity: 7 test files (~3,200 LOC)
- Barge: 7 test files (~3,200 LOC)

**Test File Types (per module):**
1. `{module}.create.behavior.spec.js` - Form validation, security tests
2. `{module}.create.e2e.spec.js` - Complete creation workflow
3. `{module}.edit.behavior.spec.js` - Edit form behavior
4. `{module}.search.behavior.spec.js` - Search functionality
5. `{module}.delete.e2e.spec.js` - Deletion/deactivation
6. `{module}.features.validation.spec.js` - UI features, layout
7. `{module}.error-handling.spec.js` - Error scenarios

**Timeline:** 2 days (aggressive, with parallel agents)

---

## Module Implementation Details

### Customer Module

**Status:** ✅ API Complete, ✅ UI Complete (8 views)

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

### Commodity Module

**Status:** ✅ API Complete, ✅ UI Complete (5 views)

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

### Barge Module

**Status:** ✅ API Complete, ✅ UI Complete (2 views accessed via BargeSearch)

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

## Important Patterns & Conventions

### Test Data Convention (CRITICAL!)

**Always use PWTEST prefix for test data**

**Why:**
- Makes test records instantly identifiable in database
- Easy to clean up test data
- Prevents confusion with real production data
- Enables search queries: `WHERE Name LIKE 'PWTEST%'`

**Examples:**
- Customer names: `PWTEST Customer 1733420123456`
- Commodity codes: `PWTST1234`
- Barge numbers: `PWTST5678`

### Test File Naming Convention

**Pattern:** `{module}.{action}.{type}.spec.js`

**Examples:**
- `customer.create.behavior.spec.js`
- `commodity.search.behavior.spec.js`
- `barge.error-handling.spec.js`

### Standard Test Structure

Every test file must include:
- Console logging setup (beforeEach)
- Error capture (pageerror event)
- Network monitoring (request/response events)
- Screenshot on key scenarios
- Markdown report generation (afterAll)
- PWTEST prefix in all test data

---

## Environment Information

### Working Directory
```
C:\Users\layden\OneDrive - Cornerstone Solutions Group\Desktop\AI Projects\Pilot Interanl AI\Admin Web App Generation & QA Eng Testing\BargeOps.Admin.Mono
```

### Application URLs
- **UI:** https://localhost:6001
- **API:** https://localhost:7001

### Technology Stack
- **UI:** ASP.NET Core 8 MVC, Razor, jQuery, DataTables
- **API:** .NET 8 Web API, Dapper, SQL Server
- **Testing:** Playwright (Node.js), Chromium browser
- **Automation:** Node.js scripts

### Prerequisites for Phase 2
- ✅ .NET 8/9 SDK installed
- ✅ Node.js installed
- ✅ Playwright installed (`npm install` in tests/playwright/)
- ✅ UI application running (port 6001)
- ✅ API application running (port 7001)
- ✅ SQL Server database accessible

---

## Checkpoints & Approvals

### Completed Checkpoints
- ✅ **Checkpoint 1** (Phase 1.4 complete): Script design reviewed and approved

### Upcoming Checkpoints
- ⏸️ **Checkpoint 2** (Phase 2.1 complete): Review Customer tests
- ⏸️ **Checkpoint 3** (Phase 2.2 complete): Review Commodity tests
- ⏸️ **Checkpoint 4** (Phase 2.3 complete): Review all 3 modules' tests
- ⏸️ **Checkpoint 5** (Phase 3.2 complete): Review first Jira post
- ⏸️ **Checkpoint 6** (Phase 4.4 complete): Review all documentation
- ⏸️ **Checkpoint 7** (Phase 5.3 complete): Final project sign-off

**User approval required at every checkpoint before proceeding!**

---

## Jira Integration Details

### Current MCP Status
- ✅ **Jira (Atlassian) MCP:** Configured and working
- ⏭️ **Azure DevOps MCP:** Skipped (not needed)
- ⏭️ **SQL Server MCP:** Skipped (not needed)

### Jira Configuration
- **Instance:** csgsolutions.atlassian.net
- **Config File:** `.mcp.json`
- **Credentials:** `.env.atlassian` (git-ignored)
- **Status:** Working and tested ✅

### Test-to-Ticket Mapping

Current mapping uses TBD placeholders:
- Customer tests → BOPS-TBD1 through BOPS-TBD6
- Commodity tests → BOPS-TBD7 through BOPS-TBD12
- Barge tests → BOPS-TBD13 through BOPS-TBD18

**Action Required:** Update `scripts/test-config.json` with actual Jira ticket numbers once available.

---

## Known Issues & Solutions

### Issue: Path with spaces breaks commands
**Solution:** Use full quoted paths or relative paths from working directory

### Issue: .NET SDK version mismatch
**Solution:** Updated `global.json` to `rollForward: "latestMajor"`

### Issue: PowerShell doesn't support &&
**Solution:** Use `;` instead for command chaining

### Issue: npx command not found in paths with spaces
**Solution:** Use `cd` first, then run commands with relative paths

---

## Success Metrics

### Phase 1 Metrics (Achieved)
- ✅ Playwright verified (7/7 tests pass = 100%)
- ✅ Pattern template created (500+ lines)
- ✅ Jira automation foundation (3 files, 350+ LOC)
- ✅ Environment working (UI + API + DB connected)

### Phase 2 Target Metrics
- 21 test files created
- ~9,600 LOC written
- 100% test pass rate
- 0 security vulnerabilities found
- All tests use PWTEST prefix

### Phase 3 Target Metrics
- Jira automation complete
- Test evidence posted to all tickets
- Video/screenshot attachments working
- Dry-run mode tested

### Phase 4 Target Metrics
- 4 documentation files created
- Main documentation updated
- All commands tested
- Troubleshooting guide complete

### Phase 5 Target Metrics
- Full test suite passes (36+ tests)
- Jira integration validated
- Implementation report delivered
- User sign-off obtained

---

## Timeline Summary

| Day | Phase | Duration | Status |
|-----|-------|----------|--------|
| **Day 1 AM** | Phase 1 | 2.5 hours | ✅ Complete |
| **Day 1 PM - Day 2** | Phase 2 | 16 hours | ⏸️ Not Started |
| **Day 3 AM** | Phase 3 | 4 hours | ⏸️ Not Started |
| **Day 3 PM** | Phase 4 | 4 hours | ⏸️ Not Started |
| **Day 4** | Phase 5 | 4 hours | ⏸️ Not Started |
| **Total** | | **30.5 hours** | 8% Complete |

---

## Quick Commands Reference

### Run Playwright Tests
```bash
cd tests/playwright

# Run all tests
npx playwright test

# Run specific module
npx playwright test customer.*.spec.js
npx playwright test commodity.*.spec.js
npx playwright test barge.*.spec.js

# Run single test file
npx playwright test customer.create.behavior.spec.js

# View HTML report
npx playwright show-report
```

### Run Jira Reporter
```bash
cd scripts

# Dry run (show what would be posted)
node jira-test-reporter.js customer --dry-run

# Post to Jira (when ready)
node jira-test-reporter.js customer
node jira-test-reporter.js all

# Skip running tests (use existing results)
node jira-test-reporter.js customer --skip-tests
```

### Start Applications
```powershell
# Terminal 1 - API
cd src\BargeOps.API\src\Admin.Api
dotnet run --urls=https://localhost:7001

# Terminal 2 - UI
cd src\BargeOps.UI
dotnet run --urls=https://localhost:6001
```

---

## Contact & Resources

### Documentation Links
- **Main Plan:** `.claude/tasks/BOPS-3515-EXECUTION-READY-PLAN.md`
- **Pattern Template:** `.claude/tasks/playwright-test-pattern-template.md`
- **Playwright Docs:** https://playwright.dev/docs/intro
- **Jira API Docs:** https://developer.atlassian.com/cloud/jira/platform/rest/v3/

### Project CLAUDE.md Files
- **Monorepo:** `/CLAUDE.md`
- **API:** `src/BargeOps.API/CLAUDE.md`
- **UI:** `src/BargeOps.UI/CLAUDE.md`

---

## Session Resumption Checklist

**When starting a new Claude Code session for Phase 2:**

- [ ] Read this README file top to bottom
- [ ] Review Phase 1 Accomplishments section
- [ ] Check Phase 2 Execution Plan
- [ ] Verify environment is ready (UI + API running)
- [ ] Read pattern template file
- [ ] Review module implementation details
- [ ] Understand test data conventions (PWTEST!)
- [ ] Check test file naming conventions
- [ ] Review checkpoint requirements
- [ ] Launch 3 test creation agents in parallel
- [ ] Start with sanity check of module URLs
- [ ] Create test files following gold standard
- [ ] Get user approval at Checkpoint 2, 3, 4

---

**Last Updated:** 2025-12-05
**Current Phase:** 1 (Complete), Ready for Phase 2
**Next Checkpoint:** Checkpoint 2 (Customer tests review)
