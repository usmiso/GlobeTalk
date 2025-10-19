"use client";
import { X } from "lucide-react";

export default function QuizModal({
  open,
  activeQuestion,
  checked,
  selectedAnswerIndex,
  selectedAnswer,
  showResult,
  result,
  currentQuestions,
  onAnswerSelected,
  nextQuestion,
  restartQuiz,
  closeQuiz,
}) {
  if (!open) return null;
  return (
    <div className="fixed left-0 right-0 top-0 h-[120vh] bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-800">Country Quiz</h2>
          <button onClick={closeQuiz} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {!showResult ? (
          <div className="quiz-container">
            <div className="flex justify-between items-center mb-6">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                Question: {activeQuestion + 1}
                <span>/{currentQuestions.length}</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {currentQuestions[activeQuestion]?.question}
              </h3>
              <div className="space-y-3">
                {currentQuestions[activeQuestion]?.answers.map((answer, idx) => (
                  <button
                    key={idx}
                    onClick={() => !checked && onAnswerSelected(answer, idx)}
                    disabled={checked}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium ${
                      selectedAnswerIndex === idx
                        ? checked
                          ? answer === currentQuestions[activeQuestion].correctAnswer
                            ? 'bg-green-500 text-white border-green-500'
                            : 'bg-red-500 text-white border-red-500'
                          : 'bg-blue-600 text-white border-blue-600'
                        : checked && answer === currentQuestions[activeQuestion].correctAnswer
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                    } ${!checked ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}`}
                  >
                    {answer}
                  </button>
                ))}
              </div>
            </div>

            {checked ? (
              <button
                onClick={nextQuestion}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-[1.02]"
              >
                {activeQuestion === currentQuestions.length - 1 ? '🏁 Finish Quiz' : '➡️ Next Question'}
              </button>
            ) : (
              <button
                disabled
                className="w-full bg-gray-300 text-gray-500 font-bold py-4 px-6 rounded-xl text-lg cursor-not-allowed"
              >
                {activeQuestion === currentQuestions.length - 1 ? 'Finish' : 'Next'}
              </button>
            )}
          </div>
        ) : (
          <div className="quiz-container text-center">
            <h2 className="text-3xl font-bold text-blue-800 mb-6">🎉 Quiz Completed!</h2>

            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h3 className="text-4xl font-bold text-blue-700 mb-2">
                {((result.score / (currentQuestions.length * 5)) * 100).toFixed(1)}%
              </h3>
              <p className="text-gray-600">Overall Score</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-green-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-600">{result.correctAnswers}</p>
                <p className="text-gray-600">Correct</p>
              </div>
              <div className="bg-white border border-red-200 rounded-xl p-4">
                <p className="text-2xl font-bold text-red-600">{result.wrongAnswers}</p>
                <p className="text-gray-600">Wrong</p>
              </div>
            </div>

            <div className="space-y-3 text-left bg-blue-50 rounded-xl p-4 mb-6">
              <p className="flex justify-between">
                <span className="text-gray-600">Total Questions:</span>
                <span className="font-semibold">{currentQuestions.length}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-600">Total Score:</span>
                <span className="font-semibold">{result.score}/{currentQuestions.length * 5}</span>
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={restartQuiz}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-[1.02]"
              >
                🔄 Try Again
              </button>
              <button
                onClick={closeQuiz}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-[1.02]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
