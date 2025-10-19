"use client";
import MessageItem from "./MessageItem";

export default function MessagesList({ messages, currentUserID, openChat, onDownloadPDF, onReport }) {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-gray-500">
        No messages yet. Send a letter to start a conversation!
      </div>
    );
  }

  return (
    <div className="space-y-2 px-4">
      {messages.map((msg, i) => (
        <MessageItem
          key={i}
          msg={msg}
          index={i}
          currentUserID={currentUserID}
          openChat={openChat}
          onDownloadPDF={onDownloadPDF}
          onReport={onReport}
        />
      ))}
    </div>
  );
}
