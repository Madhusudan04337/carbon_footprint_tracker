import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'crypto';

const generateSafePassword = (email: string) => {
  return "Pass-" + createHash('sha256').update(email).digest('hex').substring(0, 12) + "!";
};

test.describe('Automated WCAG Accessibility Scanning', () => {
  test.beforeEach(async ({ page, request }) => {
    const email = 'madhu@ecotrace.org';
    const password = generateSafePassword(email);
    const loginResponse = await request.post('http://127.0.0.1:8000/api/auth/login', {
      data: {
        email,
        password
      }
    });
    
    let token = '';
    if (loginResponse.ok()) {
      const data = await loginResponse.json();
      token = data.access_token;
    } else {
      await request.post('http://127.0.0.1:8000/api/auth/register', {
        data: {
          email,
          password,
          first_name: 'Madhu',
          last_name: 'Sudan',
          country: 'IN',
          postal_code: '560001'
        }
      });
      const loginRetry = await request.post('http://127.0.0.1:8000/api/auth/login', {
        data: {
          email,
          password
        }
      });
      if (loginRetry.ok()) {
        const data = await loginRetry.json();
        token = data.access_token;
      }
    }

    await page.addInitScript((t) => {
      window.localStorage.setItem('token', t);
    }, token);
  });

  test('should pass a11y standards on the Calculator page', async ({ page }) => {
    // Navigate directly to the Calculator page
    await page.goto('/calculator');
    await page.waitForSelector('form');

    // Run the accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag21a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    // Assert that there are no violations
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass a11y check on the main Dashboard page', async ({ page }) => {
    await page.goto('/');
    
    // Scan the dashboard
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
