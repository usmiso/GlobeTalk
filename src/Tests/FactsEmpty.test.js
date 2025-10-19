import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FactsEmpty from '@/app/pages/explore/components/FactsEmpty';

describe('FactsEmpty', () => {
  it('renders message and triggers onStartQuiz on click', () => {
    const onStartQuiz = jest.fn();

    render(<FactsEmpty onStartQuiz={onStartQuiz} />);

    expect(
      screen.getByText(/No cultural facts found. Start matching with people to discover cultural facts!/i)
    ).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /Start Quiz Challenge Instead!/i });
    fireEvent.click(btn);

    expect(onStartQuiz).toHaveBeenCalledTimes(1);
  });
});
