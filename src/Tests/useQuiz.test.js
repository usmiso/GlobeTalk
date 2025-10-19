/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useQuiz } from '../app/pages/explore/hooks/useQuiz';

const buildQuiz = (count = 6) => ({
  questions: Array.from({ length: count }, (_, i) => ({
    question: `Q${i + 1}`,
    answers: ['A', 'B', 'C', 'D'],
    correctAnswer: i % 2 === 0 ? 'A' : 'B',
  })),
});

describe('useQuiz hook', () => {
  const origRandom = Math.random;
  beforeEach(() => {
    // Make shuffling deterministic
    Math.random = () => 0.3;
  });
  afterEach(() => {
    Math.random = origRandom;
  });

  test('startQuiz selects up to 5 questions and initializes state', () => {
    const quiz = buildQuiz(8);
    const { result } = renderHook(() => useQuiz(quiz));

    act(() => {
      result.current.startQuiz();
    });

    expect(result.current.quizStarted).toBe(true);
    expect(result.current.currentQuestions).toHaveLength(5);
    expect(result.current.activeQuestion).toBe(0);
    expect(result.current.showResult).toBe(false);
    expect(result.current.result).toEqual({ score: 0, correctAnswers: 0, wrongAnswers: 0 });
  });

  test('onAnswerSelected marks checked and selection correctness', () => {
    const quiz = buildQuiz(5);
    const { result } = renderHook(() => useQuiz(quiz));

    act(() => {
      result.current.startQuiz();
    });

    // For active question 0, correctAnswer is 'A'
    act(() => {
      result.current.onAnswerSelected('A', 0);
    });

    expect(result.current.checked).toBe(true);
    expect(result.current.selectedAnswerIndex).toBe(0);
    expect(result.current.selectedAnswer).toBe(true);

    // Select a wrong answer now
    act(() => {
      result.current.onAnswerSelected('D', 3);
    });
    expect(result.current.checked).toBe(true);
    expect(result.current.selectedAnswerIndex).toBe(3);
    expect(result.current.selectedAnswer).toBe(false);
  });

  test('nextQuestion updates score and completes with showResult', () => {
    const quiz = buildQuiz(5);
    const { result } = renderHook(() => useQuiz(quiz));

    act(() => {
      result.current.startQuiz();
    });

    // Answer questions alternately correct/incorrect
    for (let i = 0; i < 5; i += 1) {
      const correct = i % 2 === 0;
      const answer = correct ? (i % 2 === 0 ? 'A' : 'B') : 'C';
      act(() => {
        result.current.onAnswerSelected(answer, 0);
      });
      act(() => {
        result.current.nextQuestion();
      });
    }

    // After finishing all questions, showResult should be true
    expect(result.current.showResult).toBe(true);
    // 3 correct (i = 0,2,4) -> score 15
    expect(result.current.result.score).toBe(15);
    expect(result.current.result.correctAnswers).toBe(3);
    expect(result.current.result.wrongAnswers).toBe(2);
  });

  test('restartQuiz and closeQuiz reset relevant state', () => {
    const quiz = buildQuiz(6);
    const { result } = renderHook(() => useQuiz(quiz));

    act(() => {
      result.current.startQuiz();
    });

    expect(result.current.quizStarted).toBe(true);
    expect(result.current.currentQuestions.length).toBe(5);

    act(() => {
      result.current.restartQuiz();
    });
    expect(result.current.quizStarted).toBe(false);
    expect(result.current.currentQuestions).toEqual([]);

    // Start again to test closeQuiz
    act(() => {
      result.current.startQuiz();
    });
    act(() => {
      result.current.closeQuiz();
    });
    expect(result.current.quizStarted).toBe(false);
    expect(result.current.currentQuestions).toEqual([]);
    expect(result.current.showResult).toBe(false);
  });
});
