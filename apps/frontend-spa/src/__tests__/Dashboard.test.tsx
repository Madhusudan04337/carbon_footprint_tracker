import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../pages/Dashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock react-query hook
jest.mock('../hooks/useTracking', () => ({
  useTrackingData: jest.fn(() => ({
    data: { emissions: [], total: 0 },
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
