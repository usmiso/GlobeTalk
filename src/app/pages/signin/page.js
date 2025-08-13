"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signInWithGoogle } from "../../firebase/auth";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const user = await signIn(email, password);
      if (!user.emailVerified) {
        setError("Please verify your email before signing in.");
        return;
      }
      alert("Sign-in successful!");
      setEmail("");
      setPassword("");
      router.push("/");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      alert("Google sign-in successful!");
      router.push("/");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left side: colored panel */}
      <div className="w-1/2 relative" style={{ backgroundColor: "#8ECAE6" }}>
        {/* Globe - Top Left */}
        <div className="absolute top-8 left-8 flex items-center space-x-2">
          <Image
            src="/images/globe.png"
            alt="Globe"
            width={100}
            height={100}
            priority
          />
          <span className="text-[#002D72] font-bold text-[22px] tracking-wider">
            GlobeTalk
          </span>
        </div>

        {/* Girl image centered */}
        <div className="h-full flex items-center justify-center">
          <Image
            src="/images/signin.png"
            alt="Girl Sign In"
            width={500}
            height={650}
            className="object-contain mx-auto"
            priority
          />
        </div>
      </div>

      {/* Right side: form */}
      <div className="w-1/2 bg-[#F1F5F9] flex flex-col justify-center items-center px-12">
        <h1
          className="text-[#1E293B] font-bold text-3xl mb-10"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Sign In
        </h1>

        {/* Google Sign-in button */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full max-w-md flex items-center border border-gray-300 rounded-lg px-5 py-3 mb-6 hover:bg-gray-100 transition"
          aria-label="Sign in with Google"
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
            Sign in with Google
          </span>
        </button>

        {/* Error message */}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Sign-in form */}
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 font-bold mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-gray-700 font-bold mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
          >
            Sign In
          </button>
        </form>

        {/* Links */}
        <p className="text-sm text-gray-600 mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/pages/signup" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
        <p className="text-sm text-gray-600 mt-2">
          <Link
            href="/pages/forgetpassword"
            className="text-blue-500 hover:underline"
          >
            Forgot Password?
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;
