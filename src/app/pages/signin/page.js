"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    signUp,
    signUpWithGoogle,
    signIn,
    signInWithGoogle,
} from "../../firebase/auth";

const AuthPage = () => {
    const router = useRouter();
    const [mode, setMode] = useState("signin"); // 'signin' or 'signup'
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [notification, setNotification] = useState("");

    // Generate strong password
    const generateStrongPassword = () => {
        const charset =
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?";
        let newPassword = "";
        for (let i = 0; i < 12; i++) {
            newPassword += charset.charAt(
                Math.floor(Math.random() * charset.length)
            );
        }
        setPassword(newPassword);
        setConfirmPassword(newPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        if (mode === "signup") {
            if (password !== confirmPassword) {
                setError("Passwords do not match");
                return;
            }

            // Password strength validation
            const passwordRegex =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
            if (!passwordRegex.test(password)) {
                setError(
                    "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
                );
                return;
            }

            try {
                 const userIP = await getUserIP();
                await signUp(email, password,userIP);
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                setMode("signin");
                // Show custom notification
                setNotification("A confirmation email has been sent. Please check your inbox.");
                // Hide after 5 seconds
                setTimeout(() => setNotification(""), 5000);
            } catch (error) {
                if (error.code === "auth/email-already-in-use") {
                    setError("This email is already in use. Try signing in instead.");
                } else if (error.code === "auth/invalid-email") {
                    setError("Invalid email address.");
                } else {
                    setError(error.message);
                }
            }
        } else {
            try {
                 const userIP = await getUserIP();
                const userCredential = await signIn(email, password,userIP);
                const user = userCredential.user;

                if (!user.emailVerified) {
                    setError(
                        "Please verify your email before signing in. Check your inbox."
                    );
                    // Optionally, you can resend the verification email
                    await sendEmailVerification(user);
                    return; // Stop further execution
                }

                // If email is verified, proceed
                setEmail("");
                setPassword("");
                router.push("/pages/profile");
            } catch (error) {
                if (
                    error.code === "auth/user-not-found" ||
                    error.code === "auth/wrong-password"
                ) {
                    setError("Incorrect email or password.");
                } else if (error.code === "auth/invalid-email") {
                    setError("Invalid email address.");
                } else if (error.code === "auth/invalid-credential") {
                    setError("Invalid credentials. Please try again.");
                } else {
                    setError(error.message);
                }
            }

        }
    };

    const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      console.log("Fetched IP address:", data.ip); // 👈 check in browser console
      return data.ip;
      
    } catch (error) {
      console.error('Could not get IP address:', error);
      return 'unknown'; // Fallback value
    }
  };


    const handleGoogleAuth = async () => {
        try {
        
            const userIP = await getUserIP();//called this function to get the string value of the api
            console.log("Using IP address:", userIP); 
            const { isNewUser, user } = await signInWithGoogle(userIP);

        
            if (isNewUser) {
                router.push("/pages/profile");
            } else {
                router.push("/pages/dashboard");
            }
        } catch (error) {
            console.error(error);

            if (error.code === "auth/popup-closed-by-user") {
                setError("Google sign-in was closed before completion.");
            } else if (error.code === "auth/popup-blocked") {
                setError("Google sign-in popup was blocked.");
            } else if (error.code === "auth/invalid-credential") {
                setError("Invalid credentials. Please try again.");
            } else {
                setError("Google sign-up failed. Please try again.");
            }
        }
        


    };

    




    return (

        <div className="flex h-screen flex-col md:flex-row">
            {/* Notification */}
            {notification && (
                <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
                    {notification}
                </div>
            )}
            {/* Left side: colored panel, hidden on mobile */}
            <div
                className="hidden md:block md:w-1/2 relative"
                style={{ backgroundColor: "#476C8A" }}
            >
                <div className="absolute top-8 left-8 flex flex-col items-center space-y-2">
                    <Image
                        src="/images/globe.png"
                        alt="Globe"
                        width={100}
                        height={100}
                        priority
                    />
                    <span className="text-[#002D72] font-bold text-[22px] tracking-wider mt-2">
                        GlobeTalk
                    </span>
                </div>
                <div className="h-full flex items-center justify-center">
                    <Image
                        src="/images/girlsignup.png"
                        alt="Girl Sign Up"
                        width={400}
                        height={500}
                        className="object-contain mx-auto"
                        priority
                    />
                </div>
            </div>

            {/* Mobile logo + text on top */}
            <div className="md:hidden flex flex-col items-center mt-8 mb-2">
                <Image
                    src="/images/globe.png"
                    alt="Globe"
                    width={80}
                    height={80}
                    priority
                />
                <span className="text-[#002D72] font-bold text-xl tracking-wider mt-2">
                    GlobeTalk
                </span>
            </div>

            {/* Right side: form, full width on mobile */}
            <div className="w-full md:w-1/2 bg-[#F1F5F9] flex flex-col justify-center items-center px-4 md:px-12">
                {/* Toggle Sign In/Sign Up */}
                <div className="flex mb-8 space-x-4">
                    <button
                        className={`px-6 py-2 rounded font-bold cursor-pointer ${mode === "signin"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-blue-500"
                            }`}
                        onClick={() => setMode("signin")}
                    >
                        Sign In
                    </button>
                    <button
                        className={`px-6 py-2 rounded font-bold cursor-pointer ${mode === "signup"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-blue-500"
                            }`}
                        onClick={() => setMode("signup")}
                    >
                        Sign Up
                    </button>
                </div>

                <h1
                    className="text-[#1E293B] font-bold text-3xl mb-10"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                >
                    {mode === "signin" ? "Sign In" : "Sign Up"}
                </h1>

                {/* Google Auth */}
                <button
                    onClick={handleGoogleAuth}
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
                        {mode === "signin"
                            ? "Sign in with Google"
                            : "Sign up with Google"}
                    </span>
                </button>

                {/* Error Message */}
                {error && <p className="text-red-500 mb-4">{error}</p>}

                {/* Auth form */}
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
                    <div className="mb-4 relative">
                        <label
                            htmlFor="password"
                            className="block text-gray-700 font-bold mb-2"
                        >
                            Password
                        </label>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-9 text-lg cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "👁️" : "🙈"}
                        >
                            {showPassword ? "👁️" : "🙈"}
                        </button>
                    </div>

                    {mode === "signup" && (
                        <>
                            <div className="mb-6 relative">
                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-gray-700 font-bold mb-2"
                                >
                                    Confirm Password
                                </label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-9 text-lg cursor-pointer"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "👁️" : "🙈"}
                                >
                                    {showConfirmPassword ? "👁️" : "🙈"}
                                </button>
                            </div>

                        </>
                    )}

                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full cursor-pointer"
                    >
                        {mode === "signin" ? "Sign In" : "Sign Up"}
                    </button>
                </form>

                {/* Switch link */}
                <p className="text-sm text-gray-600 mt-6">
                    {mode === "signin"
                        ? "Don't have an account? "
                        : "Already have an account? "}
                    <button
                        className="text-blue-500 hover:underline cursor-pointer"
                        onClick={() =>
                            setMode(mode === "signin" ? "signup" : "signin")
                        }
                    >
                        {mode === "signin" ? "Sign up" : "Sign in"}
                    </button>
                </p>

                {mode === "signin" && (
                    <p className="text-sm text-gray-600 mt-2">
                        <Link
                            href="/pages/forgetpassword"
                            className="text-blue-500 hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </p>
                )}

                <Link
                    href="/"
                    className="mt-4 bg-black hover:bg-black text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline cursor-pointer"
                >
                    Go to Homepage
                </Link>
            </div>
        </div>
    );
};

export default AuthPage;