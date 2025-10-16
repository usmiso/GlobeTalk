"use client";

export default function ModeToggle({ mode, setMode }) {
  return (
    <div className="flex mb-8 space-x-4">
      <button
        className={`px-6 py-2 rounded font-bold cursor-pointer ${
          mode === "signin" ? "bg-blue-500 text-white" : "bg-gray-200 text-blue-500"
        }`}
        onClick={() => setMode("signin")}
      >
        Sign In
      </button>
      <button
        className={`px-6 py-2 rounded font-bold cursor-pointer ${
          mode === "signup" ? "bg-blue-500 text-white" : "bg-gray-200 text-blue-500"
        }`}
        onClick={() => setMode("signup")}
      >
        Sign Up
      </button>
    </div>
  );
}
