import { test, expect } from '@playwright/test';

test.describe('Express Tracker API Integration', () => {
  const API_URL = 'http://localhost:3001/api';

  test('should log custom activity and return calculated carbon value', async ({ request }) => {
    // Perform a POST request to log short-haul flight activity
    const response = await request.post(`${API_URL}/tracker/log`, {
      data: {
        activityType: 'flight_short',
        amount: 2000, // 2000 kilometers
      },
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Check that response was successful
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('success', true);
    // Short haul flight factor: 0.245 * 2000 = 490 kg CO2e
    expect(json.emissions).toBeCloseTo(490.0, 1);
  });
});
