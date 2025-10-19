"use client";

import { getFriendFromChat, getLastUnlockedPreview } from "../lib/utils";

export default function Sidebar({ chats, currentUserID, isMobile, sidebarOpen, setSidebarOpen, onSelectChat, openChat }) {
  return (
    <aside className={`absolute md:relative top-0 left-0 h-full md:h-auto md:min-h-screen 
      border-r border-gray-300 bg-white shadow-sm transition-all duration-300 
      ${sidebarOpen ? "w-72 p-4 z-40" : "w-0 md:w-16 md:p-2 overflow-hidden"}`}>
      <div className="flex justify-between items-center mb-4">
        {sidebarOpen && <h2 className="text-lg font-semibold">Your Pen Pals</h2>}
        <div className="flex gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-200 text-gray-600"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? "✖" : "☰"}
          </button>
        </div>
      </div>

      {sidebarOpen && (
        chats.length === 0 ? (
          <p className="text-gray-500 text-sm">No pen pals yet.</p>
        ) : (
          <ul className="space-y-3">
            {chats.map((chat) => {
              const friend = getFriendFromChat(chat, currentUserID);
              return (
                <li
                  key={chat.chatId}
                  onClick={() => {
                    onSelectChat(chat);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${openChat && openChat.chatId === chat.chatId ? "bg-blue-50" : "hover:bg-gray-100"
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
            })}
          </ul>
        )
      )}
    </aside>
  );
}
