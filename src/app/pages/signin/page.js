"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signUp, signUpWithGoogle, signIn, signInWithGoogle } from "../../firebase/auth";

const AuthPage = () => {
    const router = useRouter();
    const [mode, setMode] = useState("signin"); // 'signin' or 'signup'
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        // Password strength validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
        if (!passwordRegex.test(password)) {
            setError("Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.");
            return;
        }
        if (mode === "signup") {
            if (password !== confirmPassword) {
                setError("Passwords do not match");
                return;
            }
            try {
                await signUp(email, password);
                alert("Sign-up successful! Please verify your email.");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setMode("signin");
            } catch (error) {
                setError(error.message);
            }
        } else {
            try {
                await signIn(email, password);
                alert("Sign-in successful!");
                setEmail("");
                setPassword("");
                router.push("/pages/home"); // Redirect to home page after sign-in
            } catch (error) {
                setError(error.message);
            }
        }
    };

    const handleGoogleAuth = async () => {
        setError("");
        try {
            if (mode === "signup") {
                await signUpWithGoogle();
                alert("Google sign-up successful!");
            } else {
                await signInWithGoogle();
                alert("Google sign-in successful!");
            }
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div className="flex h-screen">
            {/* Left side: colored panel */}
            <div className="w-1/2 relative" style={{ backgroundColor: "#476C8A" }}>
                {/* Globe - Top Left */}
                <div className="absolute top-8 left-8 flex items-center space-x-2">
                    <Image src="/images/globe.png" alt="Globe" width={100} height={100} priority />
                    <span className="text-[#002D72] font-bold text-[22px] tracking-wider">GlobeTalk</span>
                </div>
                {/* Girl image centered */}
                <div className="h-full flex items-center justify-center">
                    <Image src="/images/girlsignup.png" alt="Girl Sign Up" width={400} height={500} className="object-contain mx-auto" priority />
                </div>
            </div>
            {/* Right side: form */}
            <div className="w-1/2 bg-[#F1F5F9] flex flex-col justify-center items-center px-12">
                <div className="flex mb-8 space-x-4">
                    <button
                        className={`px-6 py-2 rounded font-bold ${mode === "signin" ? "bg-blue-500 text-white" : "bg-gray-200 text-blue-500"}`}
                        onClick={() => setMode("signin")}
                    >
                        Sign In
                    </button>
                    <button
                        className={`px-6 py-2 rounded font-bold ${mode === "signup" ? "bg-blue-500 text-white" : "bg-gray-200 text-blue-500"}`}
                        onClick={() => setMode("signup")}
                    >
                        Sign Up
                    </button>
                </div>
                <h1 className="text-[#1E293B] font-bold text-3xl mb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {mode === "signin" ? "Sign In" : "Sign Up"}
                </h1>
                {/* Google Auth button */}
                <button
                    onClick={handleGoogleAuth}
                    className="w-full max-w-md flex items-center justify-center border border-gray-300 rounded-lg px-5 py-3 mb-6 hover:bg-gray-100 transition bg-gray-200"
                    aria-label={mode === "signin" ? "Sign in with Google" : "Sign up with Google"}
                >
                    <svg className="w-6 h-6 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" fill="none">
                        <path d="M488 261.8c0-17.4-1.5-34.2-4.4-50.4H249v95.5h134.6c-5.8 31.4-23.1 57.9-49.4 75.8l79.7 62.2c46.7-43.1 73.6-106.3 73.6-183.1z" fill="#4285F4" />
                        <path d="M249 492c66.6 0 122.5-22 163.3-59.6l-79.7-62.2c-22.2 14.9-50.7 23.8-83.6 23.8-64.2 0-118.6-43.3-138.2-101.7H28.1v63.9C68.5 447.9 153 492 249 492z" fill="#34A853" />
                        <path d="M110.8 293.3c-4.7-14-7.4-28.9-7.4-44.3s2.7-30.3 7.4-44.3V140.8H28.1C10 179.3 0 222.6 0 268.9s10 89.6 28.1 128.1l82.7-63.7z" fill="#FBBC05" />
                        <path d="M249 97.9c35.9 0 68.2 12.4 93.7 36.7l70.3-70.3C371.7 24.6 316 0 249 0 153 0 68.5 44.1 28.1 140.8l82.7 63.9c19.6-58.4 74-101.7 138.2-101.7z" fill="#EA4335" />
                    </svg>
                    <span className="text-[#1E293B] text-base font-medium">
                        {mode === "signin" ? "Sign in with Google" : "Sign up with Google"}
                    </span>
                </button>
                {/* Error message */}
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {/* Auth form */}
                <form onSubmit={handleSubmit} className="w-full max-w-md">
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 font-bold mb-2">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-gray-700 font-bold mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>
                    {mode === "signup" && (
                        <div className="mb-6">
                            <label htmlFor="confirmPassword" className="block text-gray-700 font-bold mb-2">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                    >
                        {mode === "signin" ? "Sign In" : "Sign Up"}
                    </button>
                </form>
                {/* Switch link */}
                <p className="text-sm text-gray-600 mt-6">
                    {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                    <button
                        className="text-blue-500 hover:underline"
                        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                    >
                        {mode === "signin" ? "Sign up" : "Sign in"}
                    </button>
                </p>
                {mode === "signin" && (
                    <p className="text-sm text-gray-600 mt-2">
                        <Link href="/pages/forgetpassword" className="text-blue-500 hover:underline">Forgot password?</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default AuthPage;
