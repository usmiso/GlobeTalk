// Small helpers for Inbox UI logic.

export function formatDelay(secs) {
  if (secs == null) return "";
  if (secs % 86400 === 0) {
    const d = secs / 86400;
    return d === 1 ? "1 day" : `${d} days`;
  }
  if (secs % 3600 === 0) {
    return `${secs / 3600}h`;
  }
  if (secs % 60 === 0) {
    return `${secs / 60} min`;
  }
  return `${secs}s`;
}

export function getFriendFromChat(chat, currentUserID) {
  return chat?.userProfiles?.find(u => u.uid !== currentUserID) || null;
}

export function getLastUnlockedPreview(chat, currentUserID, nowTs = Date.now()) {
  if (!chat?.messages?.length) return "No messages yet";
  const lastUnlocked = [...chat.messages].reverse().find(m => m.deliveryTime <= nowTs);
  if (lastUnlocked) {
    const isSender = lastUnlocked.sender === currentUserID;
    return `${isSender ? "You: " : ""}${lastUnlocked.text}`;
  }
  return "Locked message (coming soon…)";
}
