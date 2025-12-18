description: 'Playwright test generation instructions'
applyTo: '**'

# Test Writing Guidelines

## Test Account Information

**Default Test Account:**
- Email: test@demo.com
- Password: 123456
- Login URL: /#/passport/login

**Login Instructions:**
Before testing any feature that requires authentication, use the test account to log in. All tests requiring login should include a login step in beforeEach or as the first step of the test.

## Code Quality Standards

**Locators:** Prioritize user-facing, role-based locators (getByRole, getByLabel, getByText, etc.) for resilience and accessibility. Use test.step() to group interactions and improve test readability and reporting.

**Assertions:** Use auto-retrying web-first assertions. These assertions start with the await keyword (e.g., await expect(locator).toHaveText()). Avoid expect(locator).toBeVisible() unless specifically testing for visibility changes.

**Timeouts:** Rely on Playwright's built-in auto-waiting mechanisms. Avoid hard-coded waits or increased default timeouts.

**Clarity:** Use descriptive test and step titles that clearly state the intent. Add comments only to explain complex logic or non-obvious interactions.

## Test Structure

**Imports:** Start with import { test, expect } from '@playwright/test';.

**Organization:** Group related tests for a feature under a test.describe() block.

**Hooks:** Use beforeEach for setup actions common to all tests in a describe block (e.g., navigating to a page, logging in).

**Titles:** Follow a clear naming convention, such as Feature - Specific action or scenario.

## File Organization

**Location:** Store all test files in the tests/ directory.

**Naming:** Use the convention <feature-or-page>.spec.ts (e.g., login.spec.ts, dashboard.spec.ts, search.spec.ts).

**Scope:** Aim for one test file per major application feature or page.

## Assertion Best Practices

**UI Structure:** Use toMatchAriaSnapshot to verify the accessibility tree structure of a component. This provides a comprehensive and accessible snapshot.

**Element Counts:** Use toHaveCount to assert the number of elements found by a locator.

**Text Content:** Use toHaveText for exact text matches and toContainText for partial matches.

**Navigation:** Use toHaveURL to verify the page URL after an action.

## Example Test Structure

### Example 1: Login Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test('Login with valid credentials', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto('/#/passport/login');
    });

    await test.step('Enter credentials and submit', async () => {
      await page.getByLabel('Email').fill('test@demo.com');
      await page.getByLabel('Password').fill('123456');
      await page.getByRole('button', { name: 'Login' }).click();
    });

    await test.step('Verify successful login', async () => {
      // Verify user is redirected to dashboard or home page
      await expect(page).toHaveURL(/\/(dashboard|home)/);
      // Verify user profile or welcome message is visible
      await expect(page.getByText('Welcome')).toBeVisible();
    });
  });
});
```

### Example 2: Feature Test with Login

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/#/passport/login');
    await page.getByLabel('Email').fill('test@demo.com');
    await page.getByLabel('Password').fill('123456');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for successful login and navigation
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('View user profile information', async ({ page }) => {
    await test.step('Navigate to profile page', async () => {
      await page.getByRole('link', { name: 'Profile' }).click();
    });

    await test.step('Verify profile data is displayed', async () => {
      await expect(page.getByRole('heading', { name: 'User Profile' })).toBeVisible();
      await expect(page.getByText('test@demo.com')).toBeVisible();
    });
  });

  test('Search functionality after login', async ({ page }) => {
    await test.step('Perform search', async () => {
      await page.getByRole('search').click();
      const searchInput = page.getByRole('textbox', { name: 'Search' });
      await searchInput.fill('test query');
      await searchInput.press('Enter');
    });

    await test.step('Verify search results', async () => {
      await expect(page.getByRole('heading', { name: /search results/i })).toBeVisible();
      await expect(page.getByRole('list', { name: 'results' })).toHaveCount(1);
    });
  });
});
```

## Test Execution Strategy

1. **Initial Run:** Execute tests with npx playwright test --project=chromium

2. **Debug Failures:** Analyze test failures and identify root causes

3. **Iterate:** Refine locators, assertions, or test logic as needed

4. **Validate:** Ensure tests pass consistently and cover the intended functionality

5. **Report:** Provide feedback on test results and any issues discovered

## Quality Checklist

Before finalizing tests, ensure:

- [ ] All locators are accessible and specific and avoid strict mode violations
- [ ] Tests requiring authentication include proper login steps
- [ ] Login credentials use the test account (test@demo.com / 123456)
- [ ] Tests are grouped logically and follow a clear structure
- [ ] Assertions are meaningful and reflect user expectations
- [ ] Tests follow consistent naming conventions
- [ ] Code is properly formatted and commented
- [ ] Tests verify post-login functionality correctly

---
