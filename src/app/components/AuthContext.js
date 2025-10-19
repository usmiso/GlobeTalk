"use client";

// Lightweight auth context: exposes { user, loading } sourced from Firebase Auth.
import { createContext, useContext, useEffect, useState } from "react";
import { auth, onAuthStateChanged } from "../firebase/auth";

const AuthContext = createContext({ user: null, loading: true });

/**
 * AuthProvider subscribes to Firebase auth state and provides
 * the current user and loading state to descendants.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook
export function useAuth() {
  return useContext(AuthContext);
}
