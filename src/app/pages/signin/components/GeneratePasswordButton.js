"use client";

export default function GeneratePasswordButton({ onClick }) {
  return (
    <div className="mb-4">
      <button
        type="button"
        className="w-full border border-gray-300 rounded-lg px-5 py-2 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
        onClick={onClick}
      >
        Generate Strong Password
      </button>
    </div>
  );
}
