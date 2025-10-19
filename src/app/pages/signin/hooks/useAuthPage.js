"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signUp,
  signUpWithGoogle,
  signIn,
  signInWithGoogle,
  sendEmailVerification,
} from '../../../firebase/auth';
import { checkBlocked, getUserIP } from '../lib/api';

export function useAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('signup') === 'true') setMode('signup');
    }
  }, []);

  const generateStrongPassword = () => {
    const lowers = 'abcdefghijklmnopqrstuvwxyz';
    const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const specials = '!@#$%^&*()_+[]{}|;:,.<>?';
    const all = lowers + uppers + digits + specials;
    const pick = (pool) => pool.charAt(Math.floor(Math.random() * pool.length));
    const length = 12;
    const parts = [pick(lowers), pick(uppers), pick(digits), pick(specials)];
    for (let i = parts.length; i < length; i++) parts.push(pick(all));
    for (let i = parts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [parts[i], parts[j]] = [parts[j], parts[i]];
    }
    const newPassword = parts.join('');
    setPassword(newPassword);
    setConfirmPassword(newPassword);
  };

  const BLOCKED_MESSAGE = 'Your account has been blocked and you can no longer access GlobeTalk. If you believe this is a mistake, contact support.';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (mode === 'signin' && !emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
      if (!passwordRegex.test(password)) {
        setError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
        return;
      }

      try {
        const userIP = await getUserIP();
        await signUp(email, password, userIP);
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setNotification('A confirmation email has been sent. Please check your inbox.');
        setTimeout(() => setNotification(''), 5000);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') setError('This email is already in use. Try signing in instead.');
        else if (error.code === 'auth/invalid-email') setError('Invalid email address.');
        else setError(error.message);
      }
      return;
    }

    try {
      const userIP = await getUserIP();
      const userCredential = await signIn(email, password, userIP);
      const user = userCredential.user;
      if (!user.emailVerified) {
        setError('Please verify your email before signing in. Check your inbox.');
        try { await sendEmailVerification(user); } catch {}
        return;
      }
      const { blocked } = await checkBlocked(user.uid);
      if (blocked) {
        setError(BLOCKED_MESSAGE);
        try {
          const { auth } = await import('../../../firebase/auth');
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
        } catch {}
        return;
      }
      setEmail('');
      setPassword('');
      if (user?.email === 'gamersboysa@gmail.com') router.push('/pages/reports');
      else if (userCredential?.isNewUser) router.push('/pages/profile');
      else router.push('/pages/dashboard');
    } catch (error) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') setError('Incorrect email or password.');
      else if (error.code === 'auth/invalid-email') setError('Invalid email address.');
      else if (error.code === 'auth/invalid-credential') setError('Invalid credentials. Please try again.');
      else setError(error.message);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const userIP = await getUserIP();
      const { isNewUser, user } = await signInWithGoogle(userIP);
      const { blocked } = await checkBlocked(user.uid);
      if (blocked) {
        setError(BLOCKED_MESSAGE);
        try {
          const { auth } = await import('../../../firebase/auth');
          const { signOut } = await import('firebase/auth');
          await signOut(auth);
        } catch {}
        return;
      }
      if (user?.email === 'gamersboysa@gmail.com') router.push('/pages/reports');
      else if (isNewUser) router.push('/pages/profile');
      else router.push('/pages/dashboard');
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') setError('Google sign-in was closed before completion.');
      else if (error.code === 'auth/popup-blocked') setError('Google sign-in popup was blocked.');
      else if (error.code === 'auth/invalid-credential') setError('Invalid credentials. Please try again.');
      else setError('Google sign-up failed. Please try again.');
    }
  };

  return {
    // state
    mode, setMode,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    error, setError,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    notification, setNotification,

    // actions
    generateStrongPassword,
    handleSubmit,
    handleGoogleAuth,
  };
}
