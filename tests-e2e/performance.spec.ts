import { test, expect } from '@playwright/test';
import { createHash } from 'crypto';

const generateSafePassword = (email: string) => {
  return "Pass-" + createHash('sha256').update(email).digest('hex').substring(0, 12) + "!";
};

test.describe('Frontend Web Performance Audits', () => {
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
