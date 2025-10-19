import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '@/app/page';
import { useRouter } from 'next/navigation';

// Mock next/navigation for router usage inside Index component
jest.mock('next/navigation');

describe('App Root Page (src/app/page.js)', () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ push: pushMock, pathname: '/' });
  });

  test('renders Index content via HomePage', () => {
    render(<HomePage />);

    // Heading from Index page
    expect(
      screen.getByRole('heading', { level: 1, name: /Say\s*Hello\s*to your/i })
    ).toBeInTheDocument();

    // Subheading
    expect(
      screen.getByText(/One message away from your new favourite human/i)
    ).toBeInTheDocument();
  });

  test('Start Chatting button triggers navigation', () => {
    render(<HomePage />);
    const startButton = screen.getByRole('button', { name: /Start Chatting!/i });
    fireEvent.click(startButton);
    expect(pushMock).toHaveBeenCalledWith('/pages/signin');
  });

  test('background image renders', () => {
    render(<HomePage />);
    const bgImage = screen.getByAltText(/background image/i);
    expect(bgImage).toBeInTheDocument();
  });
});
