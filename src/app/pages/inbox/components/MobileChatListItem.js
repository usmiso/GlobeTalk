"use client";
import { getFriendFromChat, getLastUnlockedPreview } from "../lib/utils";

export default function MobileChatListItem({ chat, currentUserID, isActive, onClick }) {
  const friend = getFriendFromChat(chat, currentUserID);
  return (
    <li
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
        isActive ? "bg-blue-50" : "hover:bg-gray-100"
      }`}
    >
      <img
        src={friend?.avatarUrl || "/default-avatar.png"}
        alt={friend?.username}
        className="w-10 h-10 rounded-full object-cover border border-gray-200"
      />
      <div className="flex flex-col">
        <span className="font-medium">{friend?.username}</span>
        <p className="text-xs text-gray-400 truncate w-40">
          {getLastUnlockedPreview(chat, currentUserID)}
        </p>
      </div>
    </li>
  );
}
