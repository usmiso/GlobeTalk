"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/auth"; // adjust path

export function useAuthRedirect(redirectTo = "/") {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push(redirectTo);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, redirectTo]);

  return loading;
}
