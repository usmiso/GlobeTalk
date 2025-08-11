"use client";
import React, { useState } from "react";
import Image from "next/image";
import { signUp, signUpWithGoogle } from "../../firebase/auth"; // Import the signUp function

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Call the signUp function
  await signUp(email, password);
  alert("Sign-up successful! Please verify your email.");
  setEmail("");
  setPassword("");
  setConfirmPassword("");
    } catch (error) {
      // Handle Firebase authentication errors
      setError(error.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      await signUpWithGoogle();
      alert("Google sign-up successful!");
    } catch (error) {
      setError(error.message);
    }
  };


  return (
  <div className="flex h-screen">
      {/* left side: colored panel */}
    <div
      className="w-1/2"
      style={{ backgroundColor: "#8ECAE6" }} // Replace with your desired color
    >
      {/* You can add content or leave empty */}
      {/* Globe - Top Right */}
        <div className="absolute top-8 left-8 flex items-center space-x-2">
          <Image 
            src="/images/globe.png"
            alt=""
            width={100}
            height={100}
            priority
          />
           <span className="text-[#002D72] font-bold text-[22px] tracking-wider">
    GlobeTalk
  </span>
        </div>

      {/* Girl - Perfectly Centered */}
        <div className="h-full flex items-center justify-center">
          <Image
            src="/images/girlsignup.png"
            alt=""
            width={400}
            height={500}
            className="object-contain mx-auto"
            priority
          />
        </div>

      
      
    </div>

    {/* right side: form */}
    <div className="w-1/2 bg-[#F1F5F9] flex flex-col justify-center items-center px-12">
  {/* Sign Up heading */}
  <h1 className="text-[#1E293B] font-bold text-3xl mb-10" style={{ fontFamily: "'Inter', sans-serif" }}>
    Sign Up
  </h1>

  {/* Sign in with Google button */}
  <button
    onClick={handleGoogleSignup}
    className="w-full max-w-md flex items-center border border-gray-300 rounded-lg px-5 py-3 mb-6 hover:bg-gray-100 transition"
    aria-label="Sign in with Google"
  >
    {/* Google 'G' logo */}
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

  {/* Already have account? Log in */}
  <p className="text-sm text-gray-600">
    Already have an account?{" "}
    <a href="/login" className="text-blue-500 hover:underline">
      Log in
    </a>
  </p>
</div>

    
    
  </div>
);


};



export default SignUp;