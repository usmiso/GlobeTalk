"use client";
import { getFriendFromChat } from "../lib/utils";

export default function ChatHeader({ openChat, currentUserID, sidebarOpen, onOpenSidebar, onDownloadChatPDF }) {
  if (!openChat) return null;
  return (
    <div className="shrink-0 border-b border-gray-50 bg-white px-6 py-4 shadow-sm flex items-center justify-between">
      {!sidebarOpen && (
        <button
          onClick={onOpenSidebar}
          className="fixed p-2 top-4 left-4 z-50 rounded-md shadow-md hover:bg-gray-200 text-gray-600 md:hidden"
          title="Open sidebar"
        >
          ☰
        </button>
      )}

      <div className="flex flex-col items-center w-full gap-3">
        <img
          src={getFriendFromChat(openChat, currentUserID)?.avatarUrl || "/default-avatar.png"}
          alt="profile"
          className="w-11 h-11 rounded-full border-gray-200 object-cover border"
        />
        <h3 className="text-lg font-semibold text-center w-full">
          {getFriendFromChat(openChat, currentUserID)?.username}
        </h3>
        {openChat.messages && openChat.messages.length > 0 && (
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onDownloadChatPDF}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded bg-gray-200 hover:bg-gray-300 text-base text-gray-700 w-full transition-all duration-200 min-w-[120px]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 mr-2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v12m0 0l-3-3m3 3l3-3M4.5 19.5h15"
                />
              </svg>
              <span>Download Chat History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
