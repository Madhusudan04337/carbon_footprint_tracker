import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Automated WCAG Accessibility Scanning', () => {
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
