"use client";

export default function SubmitButton({ mode }) {
  return (
    <button
      type="submit"
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full cursor-pointer"
    >
      {mode === "signin" ? "Sign In" : "Sign Up"}
    </button>
  );
}
