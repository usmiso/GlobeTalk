import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuizModal from '@/app/pages/explore/components/QuizModal';

const baseProps = {
  open: true,
  activeQuestion: 0,
  checked: false,
  selectedAnswerIndex: null,
  selectedAnswer: null,
  showResult: false,
  result: { score: 0, correctAnswers: 0, wrongAnswers: 0 },
  currentQuestions: [
    {
      question: 'Capital of Testland?',
      answers: ['Alpha', 'Beta', 'Gamma', 'Delta'],
      correctAnswer: 'Beta',
    },
    {
      question: 'Second Q?',
      answers: ['One', 'Two'],
      correctAnswer: 'Two',
    },
  ],
  onAnswerSelected: jest.fn(),
  nextQuestion: jest.fn(),
  restartQuiz: jest.fn(),
  closeQuiz: jest.fn(),
};

describe('QuizModal', () => {
  it('returns null when closed', () => {
    const { container } = render(<QuizModal {...baseProps} open={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders question and allows selecting when not checked', () => {
    render(<QuizModal {...baseProps} />);

    // shows Q1 out of 2
    expect(screen.getByText(/Question: 1/i)).toBeInTheDocument();
    expect(screen.getByText('/2')).toBeInTheDocument();

    // answers present
    const alpha = screen.getByRole('button', { name: 'Alpha' });
    fireEvent.click(alpha);
    expect(baseProps.onAnswerSelected).toHaveBeenCalledWith('Alpha', 0);

    // next disabled while unchecked
    const disabledNext = screen.getByRole('button', { name: /Next/i });
    expect(disabledNext).toBeDisabled();
  });

  it('enables Next when checked and calls nextQuestion; shows Finish on last question', () => {
    const { rerender } = render(<QuizModal {...baseProps} checked={true} selectedAnswerIndex={0} />);

    const nextBtn = screen.getByRole('button', { name: /Next Question/i });
    fireEvent.click(nextBtn);
    expect(baseProps.nextQuestion).toHaveBeenCalled();

    // last question
    rerender(
      <QuizModal
        {...baseProps}
        checked={true}
        activeQuestion={1}
        selectedAnswerIndex={0}
      />
    );

    expect(screen.getByRole('button', { name: /Finish Quiz/i })).toBeInTheDocument();
  });

  it('shows result view and wires restart/close', () => {
    render(
      <QuizModal
        {...baseProps}
        showResult={true}
        result={{ score: 5, correctAnswers: 1, wrongAnswers: 0 }}
      />
    );

    expect(screen.getByText(/Quiz Completed!/i)).toBeInTheDocument();
    expect(screen.getByText('Overall Score')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    expect(baseProps.restartQuiz).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    expect(baseProps.closeQuiz).toHaveBeenCalled();
  });
});
