"use client";
import { useState } from "react";

export function useQuiz(quiz) {
  const [quizStarted, setQuizStarted] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState({
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
  });
  const [currentQuestions, setCurrentQuestions] = useState([]);

  const startQuiz = () => {
    const shuffled = [...quiz.questions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 5);
    setCurrentQuestions(selected);
    setQuizStarted(true);
    setShowResult(false);
    setActiveQuestion(0);
    setResult({ score: 0, correctAnswers: 0, wrongAnswers: 0 });
  };

  const onAnswerSelected = (answer, idx) => {
    setChecked(true);
    setSelectedAnswerIndex(idx);
    setSelectedAnswer(answer === currentQuestions[activeQuestion].correctAnswer);
  };

  const nextQuestion = () => {
    setSelectedAnswerIndex(null);
    setResult((prev) =>
      selectedAnswer
        ? { ...prev, score: prev.score + 5, correctAnswers: prev.correctAnswers + 1 }
        : { ...prev, wrongAnswers: prev.wrongAnswers + 1 }
    );
    if (activeQuestion !== currentQuestions.length - 1) {
      setActiveQuestion((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
    setChecked(false);
  };

  const restartQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestions([]);
  };

  const closeQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestions([]);
    setShowResult(false);
  };

  return {
    // state
    quizStarted,
    activeQuestion,
    selectedAnswer,
    checked,
    selectedAnswerIndex,
    showResult,
    result,
    currentQuestions,
    // actions
    startQuiz,
    onAnswerSelected,
    nextQuestion,
    restartQuiz,
    closeQuiz,
  };
}
