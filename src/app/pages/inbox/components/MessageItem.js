"use client";

import { EnvelopeIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import { formatDelay } from "../lib/utils";

export default function MessageItem({ msg, index, currentUserID, openChat, onDownloadPDF, onReport }) {
  if (!msg) return null;
  const isSender = currentUserID && msg.sender === currentUserID;
  const now = Date.now();
  const isUnlocked = msg.deliveryTime <= now;
  const secs = msg.delaySeconds ?? (
    msg.sentAt && msg.deliveryTime
      ? Math.max(0, Math.round((msg.deliveryTime - msg.sentAt) / 1000))
      : null
  );
  const recipientName = openChat?.userProfiles?.find((u) => u.uid !== currentUserID)?.username;

  return (
    <div
      key={index}
      className={`w-full max-w-md rounded-lg border border-gray-300 shadow-sm p-2 ${
        isSender ? "ml-auto bg-blue-50" : "mr-auto bg-pink-50"
      }`}
    >
      <div
        className={`flex items-center justify-between px-4 py-1 pb-0.5 border-b ${
          isSender ? "border-blue-200" : "border-pink-200"
        }`}
      >
        <div className="flex items-center gap-2 font-semibold">
          <EnvelopeIcon className="w-4 h-4" />
          <p className="flex items-center gap-2 pb-1 text-sm font-medium">
            {isSender ? "To my pen pal" : "From your pen pal"}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <CalendarIcon className="w-4 h-4" />
          <span className="text-xs text-gray-400 opacity-80">
            {msg.deliveryTime ? new Date(msg.deliveryTime).toLocaleDateString() : ""}
          </span>
        </div>
      </div>

      <div className="px-4 py-4 text-sm leading-relaxed">
        {isUnlocked ? (
          <p className="text-gray-800 text-sm">{msg.text}</p>
        ) : (
          <p className="italic text-gray-400 text-sm">This letter will unlock soon...</p>
        )}
      </div>

      <div
        className={`flex items-center justify-between pt-0.5 px-4 py-2 border-t text-xs ${
          isSender ? "border-blue-200" : "border-pink-200"
        }`}
      >
        <span className="flex items-center gap-1 pt-3 opacity-80">
          <div className="flex items-center gap-1">
            <ClockIcon className="w-4 h-4" />
            Delivered after {formatDelay(secs)} delay
          </div>
        </span>
        {isUnlocked && (
          <button
            onClick={() => onDownloadPDF(msg, isSender, recipientName)}
            className="ml-3 transition text-black"
            title="Download letter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v12m0 0l-3-3m3 3l3-3M4.5 19.5h15" />
            </svg>
          </button>
        )}
      </div>

      {!isSender && (
        <button
          onClick={() => onReport(msg)}
          className={`ml-2 transition text-red-600 hover:text-red-800 text-xs border border-red-200 rounded px-2 py-1 ${
            !isUnlocked ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={isUnlocked ? "Report this message" : "You can only report unlocked messages"}
          disabled={!isUnlocked}
        >
          Report
        </button>
      )}
    </div>
  );
}
