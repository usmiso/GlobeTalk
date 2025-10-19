"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../firebase/auth";
import { fetchUserProfile, fetchUserStats } from "../lib/api";
import { EMPTY_STATS, normalizeProfile } from "../lib/utils";

export function useDashboardData() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [activity, setActivity] = useState([]);

  // Stats fetch after auth is ready
  useEffect(() => {
    const loadStats = async (uid) => {
      try {
        const data = await fetchUserStats(uid);
        setStats({ ...EMPTY_STATS, ...data });
        setActivity(Array.isArray(data.activity) ? data.activity : []);
      } catch (err) {
        // Mirror original behavior: only log
        // eslint-disable-next-line no-console
        console.error("Error loading stats:", err);
      }
    };

    if (auth.currentUser) {
      loadStats(auth.currentUser.uid);
    }
  }, []);

  // Auth + profile load and redirects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const res = await fetchUserProfile(user.uid);
          if (res.status === 404) {
            setLoading(false);
            router.push("/pages/profile");
            return;
          }
          if (!res.ok) throw new Error("Profile fetch failed");
          const raw = await res.json();
          setProfile(normalizeProfile(raw));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Error loading profile:", err);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  return { loading, profile, stats, activity };
}
