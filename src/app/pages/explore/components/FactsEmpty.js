"use client";

export default function FactsEmpty({ onStartQuiz }) {
  return (
    <div className="col-span-full text-center py-12">
      <p className="text-muted-foreground text-lg mb-6">
        No cultural facts found. Start matching with people to discover cultural facts!
      </p>
      <button
        onClick={onStartQuiz}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        🚀 Start Quiz Challenge Instead!
      </button>
    </div>
  );
}
