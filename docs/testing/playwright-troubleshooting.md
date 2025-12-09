# Playwright Troubleshooting Guide

## Common Issues and Solutions

### Application Not Running

**Symptoms:**
- Error: "net::ERR_CONNECTION_REFUSED"
- Error: "Target page, context or browser has been closed"
- Tests fail immediately on navigation

**Solution:**
1. Verify the application is running:
   ```bash
   # Check if port 6001 is listening
   netstat -an | findstr :6001
   ```
2. Start the application:
   ```bash
   cd src/BargeOps.UI
   dotnet run --urls=https://localhost:6001
   ```
3. Verify SSL certificate is trusted (may need to accept self-signed cert)

### Database Connection Issues

**Symptoms:**
- Tests fail with database errors
- "Unable to connect to database" messages
- Timeout errors

**Solution:**
1. Verify SQL Server is running
2. Check connection string in `appsettings.json`
3. Verify database permissions
4. Check network connectivity to database server

### Test Failures - Element Not Found

**Symptoms:**
- Error: "Locator not found"
- Error: "Timeout waiting for selector"
- Tests fail on element interaction

**Solution:**
1. Check if element selector is correct:
   ```javascript
   // Verify selector exists
   const count = await page.locator('#elementId').count();
   console.log(`Element count: ${count}`);
   ```
2. Increase wait timeout:
   ```javascript
   await page.waitForSelector('#elementId', { timeout: 10000 });
   ```
3. Wait for network idle before interacting:
   ```javascript
   await page.waitForLoadState('networkidle');
   await page.waitForTimeout(1500);
   ```

### DataTable Not Loading

**Symptoms:**
- Table appears empty
- Tests fail when trying to access table rows
- "No data available" message

**Solution:**
1. Ensure search button is clicked before accessing table:
   ```javascript
   await page.locator('#btnSearch').click();
   await page.waitForTimeout(3000);
   ```
2. Wait for DataTable initialization:
   ```javascript
   await page.waitForSelector('#tableId', { state: 'visible' });
   await page.waitForTimeout(2000);
   ```
3. Check if DataTable AJAX request completed:
   ```javascript
   await page.waitForResponse(response => 
       response.url().includes('Table') && response.status() === 200
   );
   ```

### Validation Errors Not Detected

**Symptoms:**
- Tests pass when they should fail
- Validation errors not found

**Solution:**
1. Check both validation summary and field-specific errors:
   ```javascript
   const summary = page.locator('.validation-summary-errors');
   const fieldError = page.locator('span[data-valmsg-for="FieldName"]');
   ```
2. Wait for validation to appear:
   ```javascript
   await page.waitForTimeout(2000); // Allow time for validation
   ```
3. Check HTML content for validation classes:
   ```javascript
   const html = await page.content();
   const hasErrors = html.includes('validation-summary-errors');
   ```

### Screenshots Not Generated

**Symptoms:**
- No screenshots in test-results/
- Screenshot path errors

**Solution:**
1. Ensure test-results directory exists:
   ```javascript
   fs.mkdirSync('test-results', { recursive: true });
   ```
2. Use absolute or relative paths correctly
3. Check file permissions

### Jira Posting Errors

**Symptoms:**
- "Jira credentials not configured"
- "Jira API error: 401 Unauthorized"
- "Failed to post to Jira"

**Solution:**

1. **Check .env.atlassian exists:**
   ```bash
   cat .env.atlassian
   ```

2. **Verify credentials format:**
   ```env
   JIRA_URL=https://csgsolutions.atlassian.net
   JIRA_USERNAME=your-email@example.com
   JIRA_API_TOKEN=your-api-token-here
   ```

3. **Test API token:**
   - Go to https://id.atlassian.com/manage-profile/security/api-tokens
   - Verify token hasn't expired
   - Generate new token if needed

4. **Check ticket keys in test-config.json:**
   - Ensure ticket keys are valid (e.g., BOPS-1234)
   - Replace BOPS-TBD# placeholders with actual ticket numbers

5. **Verify network connectivity:**
   ```bash
   curl -u "username:token" https://csgsolutions.atlassian.net/rest/api/3/myself
   ```

### Slow Test Execution

**Symptoms:**
- Tests take a long time to run
- Timeout errors

**Solution:**
1. Reduce wait timeouts where possible
2. Use `waitForLoadState('networkidle')` instead of fixed timeouts
3. Run tests in parallel (if not already):
   ```javascript
   workers: 4  // In playwright.config.js
   ```
4. Optimize test data setup/teardown

### Flaky Tests

**Symptoms:**
- Tests pass sometimes, fail other times
- Intermittent failures

**Solution:**
1. Add explicit waits instead of fixed timeouts
2. Wait for specific conditions:
   ```javascript
   await page.waitForSelector('#elementId', { state: 'visible' });
   ```
3. Increase retry count in config:
   ```javascript
   retries: 2
   ```
4. Check for race conditions in test logic

### Environment-Specific Issues

**Symptoms:**
- Tests work locally but fail in CI
- Different behavior in different environments

**Solution:**
1. Use environment variables for configuration:
   ```javascript
   const baseUrl = process.env.BASE_URL || 'https://localhost:6001';
   ```
2. Check browser/OS differences
3. Verify environment-specific settings match

## Debugging Tips

### Enable Debug Logging

```bash
DEBUG=pw:api npx playwright test
```

### View Test Execution

```bash
# Run tests in UI mode
npx playwright test --ui
```

### Check Network Activity

```javascript
page.on('request', request => console.log('REQUEST:', request.url()));
page.on('response', response => console.log('RESPONSE:', response.url(), response.status()));
```

### Inspect Page State

```javascript
// Take screenshot
await page.screenshot({ path: 'debug.png', fullPage: true });

// Get page content
const html = await page.content();
console.log(html);

// Evaluate JavaScript
const result = await page.evaluate(() => {
    return document.querySelector('#elementId')?.textContent;
});
```

## Getting Help

1. Check HTML report for detailed failure information
2. Review console logs in test output
3. Check markdown reports in `test-results/`
4. Review network activity logs
5. Check application logs for server-side errors

