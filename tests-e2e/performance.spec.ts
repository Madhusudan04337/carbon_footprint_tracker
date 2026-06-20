import { test, expect } from '@playwright/test';

test.describe('Frontend Web Performance Audits', () => {
  test('should render Dashboard page within acceptable SLA limits', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    
    // Page load duration SLA
    const loadTimeMs = Date.now() - startTime;
    expect(loadTimeMs).toBeLessThan(2000); // 2 seconds threshold

    // Extract performance entries from the browser context
    const performanceMetrics = await page.evaluate(() => {
      const paint = performance.getEntriesByType('paint');
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      const firstPaint = paint.find(entry => entry.name === 'first-paint')?.startTime || 0;
      const contentfulPaint = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
      const responseTime = navigation ? navigation.responseEnd - navigation.requestStart : 0;
      
      return {
        firstPaint,
        contentfulPaint,
        responseTime
      };
    });

    console.log('Web Performance Metrics:', performanceMetrics);
    
    // SLA assertions
    expect(performanceMetrics.responseTime).toBeLessThan(500); // TTFB < 500ms
    expect(performanceMetrics.contentfulPaint).toBeLessThan(1500); // FCP < 1.5s
  });
});
