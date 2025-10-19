"use client";

export default function NotificationBanner({ notification }) {
  if (!notification) return null;
  return (
    <div className="fixed top-5 right-5 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
      {notification}
    </div>
  );
}
