// Tiny API helpers for the dashboard page. Keep behavior identical to existing fetches.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function fetchUserProfile(userID) {
  const res = await fetch(`${API_BASE}/api/profile?userID=${userID}`);
  return res;
}

export async function fetchUserStats(userID) {
  const res = await fetch(`${API_BASE}/api/stats?userID=${userID}`);
  if (!res.ok) throw new Error("Stats fetch failed");
  return res.json();
}
