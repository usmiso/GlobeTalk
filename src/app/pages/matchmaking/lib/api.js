const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function fetchAvailableTimezones() {
  const res = await fetch(`${API_BASE}/api/available_timezones`);
  return res.ok ? res.json() : [];
}

export async function fetchAvailableLanguages() {
  const res = await fetch(`${API_BASE}/api/available_languages`);
  return res.ok ? res.json() : [];
}

export async function requestMatch({ timezone, language, excludeUserID }) {
  const params = new URLSearchParams();
  if (timezone) params.append("timezone", timezone);
  if (language) params.append("language", language);
  if (excludeUserID) params.append("excludeUserID", excludeUserID);

  const res = await fetch(`${API_BASE}/api/matchmaking?${params.toString()}`);
  if (!res.ok) throw new Error((await res.json()).error || "No match found");
  return res.json();
}

export async function createMatch({ userA, userB }) {
  const res = await fetch(`${API_BASE}/api/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userA, userB }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create match");
  return res.json();
}
