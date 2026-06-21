import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Calculator from '../pages/Calculator';
import * as trackingHooks from '../hooks/useTracking';

// Mock the react-query hook module
jest.mock('../hooks/useTracking', () => ({
  useAddLog: jest.fn(),
}));

describe('Calculator Page Component Integration', () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (trackingHooks.useAddLog as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isError: false,
      error: null,
    });
  });

  test('renders form, accepts numerical inputs, and submits new log', async () => {
    render(<Calculator />);

    // Check heading elements
    expect(screen.getByRole('heading', { name: /calculate footprint/i })).toBeInTheDocument();

    // Select energy category
    const categorySelect = screen.getByLabelText(/emissions sector/i);
    fireEvent.change(categorySelect, { target: { value: 'energy' } });

    // Confirm that subcategories sync to Energy default (electricity)
    const subcategorySelect = screen.getByLabelText(/subcategory \/ activity type/i);
    expect(subcategorySelect).toHaveValue('electricity');

    // Input usage value
    const inputField = screen.getByLabelText(/consumption metric/i);
    fireEvent.change(inputField, { target: { value: '250' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /log & calculate/i });
    fireEvent.click(submitButton);

    // Assert custom mutation hook was invoked with normalized inputs
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(mockMutate.mock.calls[0][0]).toEqual({
      category: 'energy',
      sub_category: 'electricity',
      value: 250,
      date: expect.any(String),
    });
  });

  test('displays warning validation if non-numerical entry is submitted', () => {
    render(<Calculator />);
    const inputField = screen.getByLabelText(/distance traveled/i);
    const submitButton = screen.getByRole('button', { name: /log & calculate/i });

    // Enter invalid text
    fireEvent.change(inputField, { target: { value: 'invalid_number' } });
    fireEvent.click(submitButton);

    // Mutate should NOT be triggered
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
