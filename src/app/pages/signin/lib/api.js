const API_BASE = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL)
  ? process.env.NEXT_PUBLIC_API_URL
  : 'http://localhost:5000';

export async function getUserIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

export async function checkBlocked(uid) {
  try {
    const res = await fetch(`${API_BASE}/api/blocked/${uid}`);
    if (!res.ok) return { blocked: false };
    const data = await res.json();
    return { blocked: !!data.blocked };
  } catch (e) {
    return { blocked: false };
  }
}
