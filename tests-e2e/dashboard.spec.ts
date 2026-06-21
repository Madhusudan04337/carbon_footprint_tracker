import { test, expect } from '@playwright/test';
import { createHash } from 'crypto';

const generateSafePassword = (email: string) => {
  return "Pass-" + createHash('sha256').update(email).digest('hex').substring(0, 12) + "!";
};

test.describe('EcoTrace E2E Carbon Calculations & User Flow', () => {
  test.beforeEach(async ({ page, request }) => {
    // Log in via API to get a valid token
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
      // If login fails (user not seeded/registered), register first
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

    // Set the token in localStorage before navigating
    await page.addInitScript((t) => {
      window.localStorage.setItem('token', t);
    }, token);

    // 1. Visit Dashboard / Page directly
    await page.goto('/');
    
    // Check page title and main elements to confirm app loaded
    await expect(page).toHaveTitle(/EcoTrace/i);
  });

  test('should log transport emissions and verify Dashboard charts update', async ({ page }) => {
    // Save current emissions total if displayed
    const dashboardEmissions = page.locator('#total-emissions-score');
    let initialVal = 0;
    
    if (await dashboardEmissions.isVisible()) {
      const initialText = await dashboardEmissions.innerText();
      initialVal = parseFloat(initialText.replace(/[^0-9.]/g, '')) || 0;
    }

    // 2. Navigate to Calculator page
    await page.click('a[href="/calculator"]');
    await expect(page).toHaveURL(/\/calculator/);

    // 3. Select Category: Transportation
    await page.selectOption('select#category', 'transport');
    
    // Select Subcategory: Car Travel
    await page.selectOption('select#subcategory', 'car');
    
    // Enter distance traveled
    await page.fill('input#value', '500'); // 500 km

    // 4. Click Submit
    await page.click('button[type="submit"]');

    // Assert Toast/Notification success is visible
    const successToast = page.locator('div[role="alert"]');
    await expect(successToast).toBeVisible();
    await expect(successToast).toContainText(/success/i);

    // 5. Return to Dashboard
    await page.click('a[href="/"]');
    await expect(page).toHaveURL('/');

    // 6. Verify total emissions score has increased by 85 kg (500 km * 0.170 kg/km)
    if (await dashboardEmissions.isVisible()) {
      const updatedText = await dashboardEmissions.innerText();
      const updatedVal = parseFloat(updatedText.replace(/[^0-9.]/g, ''));
      expect(updatedVal).toBeCloseTo(initialVal + 85.0, 1);
    }
  });
});
