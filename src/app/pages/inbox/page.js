"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import LoadingScreen from "../../components/LoadingScreen";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from "@/app/components/Navbar";
import { generateLetterPDF, generateChatTranscriptPDF } from "./lib/pdf";
import { fetchProfile as apiFetchProfile, fetchChat as apiFetchChat, sendChatMessage, reportChatMessage } from "./lib/api";
import { useChatPolling } from "./hooks/useChatPolling";
import { useViewport } from "./hooks/useViewport";
import { getFriendFromChat, getLastUnlockedPreview } from "./lib/utils";
import MessageItem from "./components/MessageItem";
import Sidebar from "./components/Sidebar";
import ComposerModal from "./components/ComposerModal";
import ReportModal from "./components/ReportModal";
import ChatHeader from "./components/ChatHeader";
import EmptyState from "./components/EmptyState";
import ChatPlaceholder from "./components/ChatPlaceholder";
import MessagesList from "./components/MessagesList";
import MobileChatListItem from "./components/MobileChatListItem";
import ReplyBar from "./components/ReplyBar";
import ChatArea from "./components/ChatArea";
import ReportSuccessPopup from "./components/ReportSuccessPopup";

const Inbox = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // UI & state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isMobile } = useViewport(768);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileShowList, setMobileShowList] = useState(true);

  // Data
  const [chats, setChats] = useState([]);
  const [openChat, setOpenChat] = useState(null);
  const [profile, setProfile] = useState(null);

  // Compose
  const [showComposer, setShowComposer] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [deliveryDelay, setDeliveryDelay] = useState(60);
  const [friendProfile, setFriendProfile] = useState(null);

  // Fun feature placeholder (game removed)

  // Report
  const [reportModal, setReportModal] = useState({ open: false, msg: null });
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportReason, setReportReason] = useState("Spam or scam");
  const [reportOther, setReportOther] = useState("");

  const initialChatId = searchParams.get("chatId");

  const handleReply = (chat) => {
    const friend = chat.userProfiles.find(u => u.uid !== currentUserID);
    setFriendProfile(friend);
    setShowComposer(true);
  };

  // viewport handled by useViewport

  useEffect(() => {
    if (initialChatId && chats.length > 0) {
      const match = chats.find((c) => c.chatId === initialChatId);
      if (match) setOpenChat(match);
      if (isMobile) setMobileShowList(false);
    }
  }, [initialChatId, chats, isMobile]);

  // PDF download handlers (delegated to pdf helpers)
  const handleDownloadPDF = (msg, isSender, recipientName) => generateLetterPDF({ msg, isSender, recipientName, openChat });
  const handleDownloadChatPDF = (messages, currentUserID, userProfiles) => generateChatTranscriptPDF({ messages, currentUserID, userProfiles });

// Removed stray JSX and misplaced code

  // Polling for open chat messages via hook
  useChatPolling(openChat?.chatId, (messages) => {
    setOpenChat(prev => prev ? { ...prev, messages } : prev);
  });

  // Fetch profile and chats
  useEffect(() => {
    let unsubscribe;
    setLoading(true);
    setError(null);

    const fetchProfile = async (uid) => {
      try {
        const data = await apiFetchProfile(uid);
        const chatIds = data.chats || [];

        if (chatIds.length === 0) {
          setChats([]);
          setLoading(false);
          setProfile(data);
          return;
        }

        const chatDocs = await Promise.all(
          chatIds.map(async (chatId) => {
            let chat;
            try {
              chat = await apiFetchChat(chatId);
            } catch {
              return null;
            }

            if (chat && chat.users) {
              const userProfiles = await Promise.all(
                chat.users.map(async (uid) => {
                  if (uid === data.userID) return { uid, username: "You" };
                  let userData;
                  try {
                    userData = await apiFetchProfile(uid);
                  } catch {
                    return { uid, username: uid };
                  }
                  return {
                    uid,
                    username: userData.username || uid,
                    country: userData.country || "",
                    avatarUrl: userData.avatarUrl || "/default-avatar.png"
                  };
                })
              );

              chat.userProfiles = userProfiles;

              if (chat.messages && chat.messages.length > 0) {
                chat.preview = chat.messages[chat.messages.length - 1].text;
              } else {
                chat.preview = null;
              }
            }
            return chat;
          })
        );

        setChats(chatDocs.filter(Boolean));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }
      fetchProfile(user.uid);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (loading) return <LoadingScreen />;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  const currentUser = auth.currentUser;
  const currentUserID = currentUser ? currentUser.uid : null;

  const handleSendLetter = async () => {
    if (!messageText.trim()) return;

    const sentAt = Date.now();
    const newMsg = {
      sender: currentUserID,
      text: messageText,
      sentAt,
      deliveryTime: sentAt + deliveryDelay * 1000,
      delaySeconds: deliveryDelay,
    };

    try {
      await sendChatMessage(openChat.chatId, newMsg);

      setOpenChat(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), newMsg],
      }));
      setMessageText("");
      setShowComposer(false);
    } catch (err) {
      console.error(err);
      alert("Could not send message");
    }
  };

  const handleReportMessage = (msg) => {
    setReportModal({ open: true, msg });
    setReportReason('Spam or scam');
    setReportOther('');
  };

  // handleReportMessage remains unchanged
  // Move submitReport to top-level scope

// Top-level submitReport function
const submitReport = async () => {
  if (!reportModal.msg) return;
  let reasonToSend = reportReason === 'Other' ? reportOther.trim() : reportReason;
  if (!reasonToSend) {
    alert('Please provide a reason.');
    return;
  }

  let reporterUsername = "Unknown";
  let reportedUsername = "Unknown";
  try {
    // Fetch reporter username
    if (currentUserID) {
      const res = await fetch(`http://localhost:5000/api/profile?userID=${currentUserID}`);
      if (res.ok) {
        const data = await res.json();
        reporterUsername = data.username || "Unknown";
      }
    }
    // Fetch reported username
    const reportedUserId = reportModal.msg?.sender;
    if (reportedUserId) {
      const res = await fetch(`http://localhost:5000/api/profile?userID=${reportedUserId}`);
      if (res.ok) {
        const data = await res.json();
        reportedUsername = data.username || "Unknown";
      }
    }
  } catch (err) {
    // fallback to "Unknown"
  }

  try {
    await reportChatMessage({
      chatId: openChat.chatId,
      message: reportModal.msg,
      reporter: currentUserID,
      reporterUsername,
      reportedUserId: reportModal.msg?.sender,
      reportedUsername,
      reason: reasonToSend
    });
    setReportModal({ open: false, msg: null });
    setReportSuccess(true);
  } catch (err) {
    setReportModal({ open: false, msg: null });
    setReportSuccess(false);
  }
}

  // delay formatting provided by utils

  // Render helpers replaced by components

  // Render chat area
  const renderChatArea = () => {
    if (chats.length === 0) {
      return (
        <EmptyState onFind={() => router.push("/pages/matchmaking")} />
      );
    }

    if (!openChat) {
      return <ChatPlaceholder />;
    }

    return (
      <ChatArea
        openChat={openChat}
        currentUserID={currentUserID}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleDownloadChatPDF={handleDownloadChatPDF}
        handleDownloadPDF={handleDownloadPDF}
        handleReportMessage={handleReportMessage}
        setFriendProfile={setFriendProfile}
        setShowComposer={setShowComposer}
      />
    );
  };

  return (
    <div className="relative flex flex-col h-screen">
      {/* Nations background */}
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Mobile: Show either sidebar or chat */}
        {isMobile ? (
          mobileShowList ? (
            <div className="w-full h-full bg-white p-4 z-40">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Your Pen Pals</h2>
              </div>
              {chats.length === 0 ? (
                <p className="text-gray-500 text-sm">No pen pals yet.</p>
              ) : (
                <ul className="space-y-3">
                  {chats.map((chat) => (
                    <MobileChatListItem
                      key={chat.chatId}
                      chat={chat}
                      currentUserID={currentUserID}
                      isActive={openChat && openChat.chatId === chat.chatId}
                      onClick={() => {
                        setOpenChat(chat);
                        setMobileShowList(false);
                      }}
                    />
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <button
                onClick={() => setMobileShowList(true)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded mb-2 mt-2 w-fit"
              >
                ← Back to Pen Pals
              </button>
              {renderChatArea()}
            </div>
          )
        ) : (
          // Desktop: Show sidebar and chat side by side
          <div className="flex w-full h-full">
            <Sidebar
              chats={chats}
              currentUserID={currentUserID}
              isMobile={isMobile}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              onSelectChat={(chat) => setOpenChat(chat)}
              openChat={openChat}
            />
            {sidebarOpen && (
              <div
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-white bg-opacity-30 md:hidden z-30"
              />
            )}
            <main className="flex-1 flex flex-col overflow-hidden">{renderChatArea()}</main>
          </div>
        )}
      </div>

      {/* Composer Modal */}
      <ComposerModal
        open={showComposer}
        friendProfile={friendProfile}
        messageText={messageText}
        setMessageText={setMessageText}
        deliveryDelay={deliveryDelay}
        setDeliveryDelay={setDeliveryDelay}
        onSend={handleSendLetter}
        onClose={() => setShowComposer(false)}
      />

      {/* Report Modal */}
      <ReportModal
        open={reportModal.open}
        msg={reportModal.msg}
        reportReason={reportReason}
        setReportReason={setReportReason}
        reportOther={reportOther}
        setReportOther={setReportOther}
        onCancel={() => setReportModal({ open: false, msg: null })}
        onSubmit={submitReport}
      />

      <ReportSuccessPopup open={reportSuccess} onClose={() => setReportSuccess(false)} />
    </div>
  );
};

export default Inbox;
