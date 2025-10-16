// Thin API wrapper for inbox page functionality.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function fetchProfile(userID) {
  const res = await fetch(`${API_BASE}/api/profile?userID=${encodeURIComponent(userID)}`);
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}

export async function fetchChat(chatId) {
  const res = await fetch(`${API_BASE}/api/chat?chatId=${encodeURIComponent(chatId)}`);
  if (!res.ok) throw new Error('Failed to fetch chat');
  return res.json();
}

export async function sendChatMessage(chatId, message) {
  const res = await fetch(`${API_BASE}/api/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message })
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function reportChatMessage({ chatId, message, reporter, reporterUsername, reportedUserId, reportedUsername, reason }) {
  const res = await fetch(`${API_BASE}/api/chat/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message, reporter, reporterUsername, reportedUserId, reportedUsername, reason })
  });
  if (!res.ok) throw new Error('Failed to report message');
  return res.json();
}
