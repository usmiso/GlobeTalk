// API base - prefer NEXT_PUBLIC_API_URL, fallback to localhost:5000 for dev
const API_BASE = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL)
  ? process.env.NEXT_PUBLIC_API_URL
  : 'http://localhost:5000';

export async function fetchUserProfile(uid) {
  if (!uid) return null;
  const res = await fetch(`${API_BASE}/api/profile?userID=${uid}`);
  if (!res.ok) return null;
  return res.json();
}

export async function saveUserProfile(payload) {
  const res = await fetch(`${API_BASE}/api/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function fetchAllLanguages() {
  // Public REST endpoint used previously
  const res = await fetch('https://restcountries.com/v3.1/all?fields=languages');
  if (!res.ok) throw new Error('Failed to fetch languages');
  return res.json();
}

export async function fetchTimezones() {
  const res = await fetch('/assets/timezones.json');
  if (!res.ok) throw new Error('Failed to fetch timezones');
  return res.json();
}
