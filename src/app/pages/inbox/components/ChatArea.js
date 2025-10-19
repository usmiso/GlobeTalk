"use client";
import ChatHeader from "./ChatHeader";
import MessagesList from "./MessagesList";
import ReplyBar from "./ReplyBar";

export default function ChatArea({
  openChat,
  currentUserID,
  sidebarOpen,
  setSidebarOpen,
  handleDownloadChatPDF,
  handleDownloadPDF,
  handleReportMessage,
  setFriendProfile,
  setShowComposer,
}) {
  if (!openChat) return null;
  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        openChat={openChat}
        currentUserID={currentUserID}
        sidebarOpen={sidebarOpen}
        onOpenSidebar={() => setSidebarOpen(true)}
        onDownloadChatPDF={() =>
          handleDownloadChatPDF(
            openChat.messages,
            currentUserID,
            openChat.userProfiles
          )
        }
      />

      <div className="flex-1 overflow-y-auto">
        <MessagesList
          messages={openChat.messages}
          currentUserID={currentUserID}
          openChat={openChat}
          onDownloadPDF={handleDownloadPDF}
          onReport={handleReportMessage}
        />
      </div>

      <ReplyBar
        openChat={openChat}
        currentUserID={currentUserID}
        setFriendProfile={setFriendProfile}
        setShowComposer={setShowComposer}
      />
    </div>
  );
}
