"use client";
import React from "react";
import { useAuthPage } from "./hooks/useAuthPage";
import BackgroundImage from "./components/BackgroundImage";
import NotificationBanner from "./components/NotificationBanner";
import LeftPanel from "./components/LeftPanel";
import MobileHeader from "./components/MobileHeader";
import ModeToggle from "./components/ModeToggle";
import GoogleAuthButton from "./components/GoogleAuthButton";
import ErrorText from "./components/ErrorText";
import EmailField from "./components/EmailField";
import PasswordField from "./components/PasswordField";
import ConfirmPasswordField from "./components/ConfirmPasswordField";
import GeneratePasswordButton from "./components/GeneratePasswordButton";
import SubmitButton from "./components/SubmitButton";
import SwitchLink from "./components/SwitchLink";
import ForgotPasswordLink from "./components/ForgotPasswordLink";
import HomeLink from "./components/HomeLink";

const AuthPage = () => {
    const {
        mode, setMode,
        email, setEmail,
        password, setPassword,
        confirmPassword, setConfirmPassword,
        error,
        showPassword, setShowPassword,
        showConfirmPassword, setShowConfirmPassword,
        notification,
        generateStrongPassword,
        handleSubmit,
        handleGoogleAuth,
    } = useAuthPage();

    return (

        <div className="flex h-screen flex-col md:flex-row">
            {/* Notification */}
            <NotificationBanner notification={notification} />

            <BackgroundImage />
            {/* Left side: colored panel, hidden on mobile */}
            <LeftPanel />

            {/* Mobile logo + text on top */}
            <MobileHeader />

            {/* Right side: form, full width on mobile */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center px-4 md:px-12 relative overflow-x-hidden">
                <ModeToggle mode={mode} setMode={setMode} />

                <h1
                    className="text-[#1E293B] font-bold text-3xl mb-10"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                >
                    {mode === "signin" ? "Sign In" : "Sign Up"}
                </h1>

                {/* Google Auth */}
                <GoogleAuthButton mode={mode} onClick={handleGoogleAuth} />

                {/* Error Message */}
                <ErrorText error={error} />

                {/* Auth form */}
                <form onSubmit={handleSubmit} className="w-full max-w-md">
                    <EmailField email={email} setEmail={setEmail} />
                    <PasswordField
                        password={password}
                        setPassword={setPassword}
                        showPassword={showPassword}
                        setShowPassword={setShowPassword}
                    />

                    {mode === "signup" && (
                        <>
                            <ConfirmPasswordField
                                confirmPassword={confirmPassword}
                                setConfirmPassword={setConfirmPassword}
                                showConfirmPassword={showConfirmPassword}
                                setShowConfirmPassword={setShowConfirmPassword}
                            />
                            <GeneratePasswordButton onClick={generateStrongPassword} />
                        </>
                    )}

                    <SubmitButton mode={mode} />
                </form>

                {/* Switch link */}
                <SwitchLink mode={mode} setMode={setMode} />

                {mode === "signin" && <ForgotPasswordLink />}

                <HomeLink />
            </div>
        </div>
    );
};

export default AuthPage;