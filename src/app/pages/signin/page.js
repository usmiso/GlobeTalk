"use client";
import React, { useState } from "react";
import { signIn, signInWithGoogle } from "../../firebase/auth";
import Link from "next/link";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      alert("Google sign-in successful!");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-bold mb-2">
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
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4"
        >
          Sign In with Google
        </button>
        <div className="mt-4"> {/* Please edit this section remove mrin the classes if you have to */}
          <span>Don&apos;t have an account? </span>
          <Link href="/pages/signup" className="text-blue-500 hover:underline mr-10"> SignUp</Link>
          <br></br>
          <Link href="/pages/forgetpassword" className="text-blue-500 hover:underline mt-5">Forgot Password?</Link>
        </div>
      </form>
    </div>
  );
};

export default SignIn;