"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase/auth"; // adjust path
import { onAuthStateChanged } from "../firebase/auth";

// Auth context type removed for JS compatibility

const AuthContext = createContext({
  user: null,
  loading: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
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

// ✅ Custom hook for easy access
export function useAuth() {
  return useContext(AuthContext);
}
