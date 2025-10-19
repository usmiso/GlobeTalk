"use client";

export default function SwitchLink({ mode, setMode }) {
  return (
    <p className="text-sm text-white mt-6">
      {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
      <button
        className="text-black hover:underline cursor-pointer"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin" ? "Sign up" : "Sign in"}
      </button>
    </p>
  );
}
