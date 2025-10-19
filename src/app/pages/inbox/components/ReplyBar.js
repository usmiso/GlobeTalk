"use client";

export default function ReplyBar({ openChat, currentUserID, setFriendProfile, setShowComposer }) {
  const isMobile = window.innerWidth <= 768;

  if (isMobile) return null;

  return (
    <div className="shrink-0 border-t border-gray-50  px-6 py-4">
      <button
        onClick={() => {
          if (openChat && openChat.userProfiles) {
            const friend = openChat.userProfiles.find((u) => u.uid !== currentUserID);
            setFriendProfile(friend);
          }
          setShowComposer(true);
        }}
        className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 cursor-pointer"
      >
        {openChat.messages && openChat.messages.length > 0 ? "Reply to Letter" : "Start Chatting"}
      </button>
    </div>
  );
}
