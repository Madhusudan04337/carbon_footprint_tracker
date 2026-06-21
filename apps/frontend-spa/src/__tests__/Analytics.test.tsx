import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Analytics from '../pages/Analytics';

// Mock react-query hook
jest.mock('../hooks/useTracking', () => ({
  useLogs: jest.fn(() => ({
    data: [
      { id: 1, date: '2023-10-01', category: 'transport', sub_category: 'car', value: 10, emissions_co2e: 2.5 },
      { id: 2, date: '2023-10-02', category: 'energy', sub_category: 'electricity', value: 50, emissions_co2e: 15.0 },
    ],
    isLoading: false,
    isError: false,
  })),
}));

// Mock react-chartjs-2 to prevent canvas rendering issues in tests
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart" />,
  Doughnut: () => <div data-testid="mock-doughnut-chart" />
}));

describe('Analytics Page Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders Analytics header and charts', () => {
    render(<Analytics />);

    expect(screen.getByText(/Carbon Analytics/i)).toBeInTheDocument();
    
    // Check if charts are rendered via mocks
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('mock-doughnut-chart')).toBeInTheDocument();
  });

  test('shows accessibility fallback table when toggled', async () => {
    render(<Analytics />);
    
    const toggleButton = screen.getByRole('button', { name: /Show Screen-Reader Tabular Data Table/i });
    expect(toggleButton).toBeInTheDocument();
    
    // Data table shouldn't be visible initially
    expect(screen.queryByText(/Summary Table of Carbon Activity Outputs/i)).not.toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    
    // Data table should be visible now
    await waitFor(() => {
      expect(screen.getByText(/Summary Table of Carbon Activity Outputs/i)).toBeInTheDocument();
      // Check for mock data rendering in the table
      expect(screen.getByText('transport')).toBeInTheDocument();
      expect(screen.getByText('energy')).toBeInTheDocument();
    });
  });
});
