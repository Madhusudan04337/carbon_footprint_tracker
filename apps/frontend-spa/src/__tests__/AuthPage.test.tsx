import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthPage from '../pages/AuthPage';
import { AuthProvider } from '../context/AuthContext';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ access_token: 'fake_token' }),
  })
) as jest.Mock;

describe('AuthPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login mode by default', () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );
    expect(screen.getAllByText(/Sign In/i)[0]).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
  });

  test('switches to register mode', () => {
    render(
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    );
    const createAccountTab = screen.getByRole('button', { name: /Create Account/i });
    fireEvent.click(createAccountTab);
    expect(screen.getByPlaceholderText(/Eco/i)).toBeInTheDocument(); // First Name
  });
});
