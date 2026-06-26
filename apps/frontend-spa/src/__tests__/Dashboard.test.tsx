import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../pages/Dashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock react-query hook
jest.mock('../hooks/useTracking', () => ({
  useAnalytics: jest.fn(() => ({
    data: {
      total_emissions_co2e: 120.5,
      category_breakdown: { transport: 40.5, diet: 30.0, energy: 50.0, waste: 0 },
      benchmarks: { user_total: 120.5, national_monthly_average: 1333.33, percent_difference: -91.0 },
      logs_count: 5
    },
    isLoading: false,
    error: null,
  })),
  useLogs: jest.fn(() => ({
    data: [
      { id: 1, date: '2023-10-01', category: 'transport', sub_category: 'car', value: 10, emissions_co2e: 2.5 },
      { id: 2, date: '2023-10-02', category: 'energy', sub_category: 'electricity', value: 50, emissions_co2e: 15.0 },
    ],
    isLoading: false,
    isError: false,
  })),
}));

describe('Dashboard Page Component', () => {
  test('renders Dashboard header', () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Assuming there's a heading for the Dashboard. If the actual text is different, adjust it.
    // Dashboard might have 'Dashboard' text somewhere.
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
  });
});
