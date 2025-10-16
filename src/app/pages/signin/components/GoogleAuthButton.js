"use client";

export default function GoogleAuthButton({ mode, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full max-w-md flex items-center justify-center border border-gray-300 rounded-lg px-5 py-3 mb-6 hover:bg-gray-100 transition bg-gray-200 cursor-pointer"
    >
      <svg
        className="w-6 h-6 mr-4"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 488 512"
        fill="none"
      >
        <path
          d="M488 261.8c0-17.4-1.5-34.2-4.4-50.4H249v95.5h134.6c-5.8 31.4-23.1 57.9-49.4 75.8l79.7 62.2c46.7-43.1 73.6-106.3 73.6-183.1z"
          fill="#4285F4"
        />
        <path
          d="M249 492c66.6 0 122.5-22 163.3-59.6l-79.7-62.2c-22.2 14.9-50.7 23.8-83.6 23.8-64.2 0-118.6-43.3-138.2-101.7H28.1v63.9C68.5 447.9 153 492 249 492z"
          fill="#34A853"
        />
        <path
          d="M110.8 293.3c-4.7-14-7.4-28.9-7.4-44.3s2.7-30.3 7.4-44.3V140.8H28.1C10 179.3 0 222.6 0 268.9s10 89.6 28.1 128.1l82.7-63.7z"
          fill="#FBBC05"
        />
        <path
          d="M249 97.9c35.9 0 68.2 12.4 93.7 36.7l70.3-70.3C371.7 24.6 316 0 249 0 153 0 68.5 44.1 28.1 140.8l82.7 63.9c19.6-58.4 74-101.7 138.2-101.7z"
          fill="#EA4335"
        />
      </svg>
      <span className="text-[#1E293B] text-base font-medium">
        {mode === "signin" ? "Sign in with Google" : "Sign up with Google"}
      </span>
    </button>
  );
}
