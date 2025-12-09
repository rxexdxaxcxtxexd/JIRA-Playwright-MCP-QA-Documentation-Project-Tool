# Playwright Test Execution Guide

## Overview
This guide explains how to run Playwright tests for the BargeOps Admin application and post results to Jira.

## Prerequisites
- Node.js installed (v14+, currently v22.17.1)
- Playwright installed (v1.40.0 - `npm install` in tests/playwright/)
- Application running at https://localhost:6001
- Database with test data access
- Jira credentials configured in `.env.atlassian` (for automated posting)

**Environment Status (as of 2025-12-08):**
- ✅ All 21 test files syntax valid (post-Phase 2 remediation)
- ✅ Application confirmed running and accessible
- ✅ Playwright v1.40.0 installed
- ✅ Jira automation enhanced (timeouts, file checks, smart screenshot matching)

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
- Jira ticket numbers configured in `scripts/test-config.json`
  - **Note:** Currently all tickets are BOPS-TBD# placeholders
  - **Action Required:** Replace placeholders with actual ticket numbers before posting
- Jira credentials configured in `.env.atlassian`:
  ```
  JIRA_URL=https://csgsolutions.atlassian.net
  JIRA_USERNAME=your-email@example.com
  JIRA_API_TOKEN=your-api-token
  ```

**Jira Automation Enhancements (2025-12-08):**
- ✅ 30-second request timeouts (prevents hanging)
- ✅ File existence validation (prevents crashes)
- ✅ Intelligent screenshot matching (attaches correct screenshots)

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
**Fix:**
1. Verify `.env.atlassian` exists and has correct credentials
2. Check Jira API token is valid
3. Verify network connectivity to Jira
4. Check ticket keys in `scripts/test-config.json` are valid (not BOPS-TBD placeholders)

**Error:** "Request timeout after 30 seconds"
**Fix:**
1. Check network connectivity to Jira
2. Verify Jira server is responding
3. Try again (may be temporary network issue)

**Error:** "File not found: ..."
**Fix:**
1. Verify tests were run successfully
2. Check that `test-results/results.json` exists
3. Re-run tests if needed

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

