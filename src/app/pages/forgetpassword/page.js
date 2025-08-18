"use client";
import React, { useState } from "react";
import { forgotPassword } from "../../firebase/auth";
import Link from "next/link";
import Image from "next/image";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await forgotPassword(email);
      setMessage("Password reset email sent! Check your inbox.");
      setEmail("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="flex h-min flex-col md:flex-row overflow-x-hidden">
      {/* MOBILE / TABLET */}
      <section className="w-full max-w-fit p-6 lg:hidden">
        {/* Brand */}
        <div className="flex items-center gap-2 mb-4">
          <Image
            src="/images/LogoVPP-1.png"
            alt="GlobeTalk"
            width={28}
            height={28}
            className="rounded-full"
          />
          <p className="text-base font-semibold text-slate-800">GlobeTalk</p>
        </div>

        {/* Illustration */}
        <div className="overflow-hidden mb-6">
          <Image
            src="/images/forgotPasswordImage.png"
            alt="Forgot password"
            width={500}
            height={450}
            className="mt-10 ml-5 w-400 object-cover"
            priority
          />
        </div>

        {/* Content */}
        <h1 className="text-2xl font-extrabold text-center mb-3 font-[Roboto_serif]">
          Forgot password?
        </h1>
        <h2 className="text-center mb-6 p-4 text-xl font-[Roboto_serif]">
          Don&apos;t worry, it happens. Please enter your email.
        </h2>

        {error && <p className="text-red-500 text-center mb-2">{error}</p>}
        {message && <p className="text-green-500 text-center mb-2">{message}</p>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full h-12 rounded-2xl border border-neutral-300 bg-white/80
                   px-4 text-gray-900 placeholder-gray-400
                   focus:outline-none focus:border-slate-900
                   focus:ring-2 focus:ring-slate-900/25 transition"
          />
          <button
            type="submit"
            className="w-full h-12 mt-5 rounded-[30px] bg-slate-900 text-white font-semibold
                   hover:bg-slate-800 transition"
          >
            Send Reset Email
          </button>
        </form>

        <p className="mt-8 mb-7 text-center text-slate-700">
          Remember your password?{" "}
          <Link href="/pages/signin" className="text-sky-500 hover:underline">Sign In</Link>
        </p>
      </section>

      {/* DESKTOP */}
      <section className="hidden lg:flex w-full h-screen overflow-hidden">
        {/* Left Side */}
        <div
          className="relative w-1/2  rounded-[50px] m-2 overflow-hidden"
          style={{ backgroundColor: "#476C8A" }}
        >
          <div className="absolute top-6 left-6 flex items-center gap-3">
            <Image
              src="/images/LogoVPP-1.png"
              alt="GlobeTalk"
              width={40}
              height={40}
              className="rounded-full"
            />
            <p className="text-lg font-bold text-black">GlobeTalk</p>
          </div>

          <Image
            src="/images/forgotPasswordImage.png"
            alt="Forgot password"
            width={800}
            height={800}
            priority
            className="mt-30"
          />
        </div>

        {/* Right Side */}
        <div className="w-1/2 h-full flex flex-col items-center justify-start text-center px-8">
          <h1 className="mb-4 pt-20 w-full max-w-md text-4xl text-gray-800 font-extrabold font-[Roboto_serif]">
            Forgot Password?
          </h1>

          {error && <p className="text-red-500 mb-2">{error}</p>}
          {message && <p className="text-green-500 mb-2">{message}</p>}

          <p className="mb-10 mt-6 text-xl text-gray-700 font-[Roboto_serif]">
            Don&apos;t worry, it happens. Please enter your email.
          </p>

          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full h-12 rounded-2xl border border-neutral-300 bg-white/70
                     px-4 text-gray-900 placeholder-gray-400
                     focus:outline-none focus:border-gray-800
                     focus:ring-2 focus:ring-gray-800/30 transition"
            />
            <button
              type="submit"
              className="w-full h-14 mt-8 rounded-[30px] bg-gray-800 text-white text-lg font-semibold
                     hover:bg-gray-700 transition font-[Roboto_serif]"
            >
              Send Reset Email
            </button>
          </form>

          <p className="mt-40 text-lg font-[Roboto_serif]">
            Remember your password?{" "}
            <Link href="/pages/signin" className="text-blue-500 hover:underline">Sign In</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;
