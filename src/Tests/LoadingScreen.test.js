import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingScreen from '@/app/components/LoadingScreen';

describe('LoadingScreen', () => {
  test('renders loading image and text', () => {
    render(<LoadingScreen />);
    expect(screen.getByAltText(/Loading/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });
});
