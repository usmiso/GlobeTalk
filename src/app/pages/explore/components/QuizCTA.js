"use client";

export default function QuizCTA({ onClick }) {
  return (
    <div className="text-center mb-6">
      <button
        onClick={onClick}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        🎯 Take the Country Quiz!
      </button>
    </div>
  );
}
