"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import LoadingScreen from "../../components/LoadingScreen";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { EnvelopeIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import Navbar from "@/app/components/Navbar";
import { jsPDF } from "jspdf";

const Inbox = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // UI & state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (initialChatId && chats.length > 0) {
      const match = chats.find((c) => c.chatId === initialChatId);
      if (match) setOpenChat(match);
      if (isMobile) setMobileShowList(false);
    }
  }, [initialChatId, chats, isMobile]);

  // PDF download handlers
  const handleDownloadPDF = (msg, isSender, recipientName) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;
    doc.setFont('times', 'normal');
    doc.setFontSize(12);

    const dateStr = msg.deliveryTime ? new Date(msg.deliveryTime).toLocaleDateString() : '';
    doc.text(dateStr, 180, y);
    y += 16;

    let greetingName, signatureName;
    if (isSender) {
      greetingName = recipientName;
      signatureName = 'You';
    } else {
      greetingName = 'You';
      signatureName = (openChat.userProfiles && openChat.userProfiles.find(u => u.uid === msg.sender)?.username || msg.sender);
    }

    doc.setFontSize(14);
    doc.text(`Dear ${greetingName},`, margin, y);
    y += 12;

    doc.setFontSize(12);
    const lines = doc.splitTextToSize(msg.text, 170);
    doc.text(lines, margin, y);
    y += lines.length * 7 + 12;

    doc.setFontSize(13);
    doc.text('Kind regards,', margin, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(signatureName, margin, y);

    doc.save(`Letter_${dateStr}.pdf`);
  };

  const handleDownloadChatPDF = (messages, currentUserID, userProfiles) => {
    const doc = new jsPDF();
    const margin = 20;
    let y = margin;

    doc.setFont("times", "normal");
    doc.setFontSize(16);
    doc.text("Chat Transcript", margin, y);
    y += 12;

    const now = Date.now();

    messages.forEach((msg) => {
      if (!msg) return;
      const isSender = msg.sender === currentUserID;
      const senderName = isSender ? "You" : userProfiles?.find((u) => u.uid === msg.sender)?.username || msg.sender;
      // ...rest of PDF logic
    });

  };

// Removed stray JSX and misplaced code

  // Polling for open chat messages
  useEffect(() => {
    if (!openChat || !openChat.chatId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let isMounted = true;

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/chat?chatId=${encodeURIComponent(openChat.chatId)}`);
        if (!res.ok) return;
        const chat = await res.json();
        if (isMounted && chat && chat.messages) {
          setOpenChat(prev => prev ? { ...prev, messages: chat.messages } : prev);
        }
      } catch (err) {
        // Ignore polling errors
      }
    };

    const interval = setInterval(fetchMessages, 3000);
    fetchMessages();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [openChat?.chatId]);

  // Fetch profile and chats
  useEffect(() => {
    let unsubscribe;
    setLoading(true);
    setError(null);

    const fetchProfile = async (uid) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${apiUrl}/api/profile?userID=${uid}`);

        if (!res.ok) throw new Error('Failed to fetch user profile');

        const data = await res.json();
        const chatIds = data.chats || [];

        if (chatIds.length === 0) {
          setChats([]);
          setLoading(false);
          setProfile(data);
          return;
        }

        const chatDocs = await Promise.all(
          chatIds.map(async (chatId) => {
            const chatRes = await fetch(`${apiUrl}/api/chat?chatId=${encodeURIComponent(chatId)}`);
            if (!chatRes.ok) return null;
            const chat = await chatRes.json();

            if (chat && chat.users) {
              const userProfiles = await Promise.all(
                chat.users.map(async (uid) => {
                  if (uid === data.userID) return { uid, username: "You" };
                  const userRes = await fetch(`${apiUrl}/api/profile?userID=${uid}`);
                  if (!userRes.ok) return { uid, username: uid };
                  const userData = await userRes.json();
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
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
      const res = await fetch(`${apiUrl}/api/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: openChat.chatId, message: newMsg }),
      });

      if (!res.ok) throw new Error("Failed to send message");

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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${apiUrl}/api/chat/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: openChat.chatId,
        message: reportModal.msg,
        reporter: currentUserID,
        reporterUsername,
        reportedUserId: reportModal.msg?.sender,
        reportedUsername,
        reason: reasonToSend
      })
    });

    if (!res.ok) throw new Error('Failed to report message');
    setReportModal({ open: false, msg: null });
    setReportSuccess(true);
  } catch (err) {
    setReportModal({ open: false, msg: null });
    setReportSuccess(false);
  }
}

  const formatDelay = (secs) => {
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
  };

  // Render message component
  const renderMessage = (msg, i) => {
    if (!msg) return null;

    const isSender = currentUserID && msg.sender === currentUserID;
    const now = Date.now();
    const isUnlocked = msg.deliveryTime <= now;

    const secs = msg.delaySeconds ?? (
      msg.sentAt && msg.deliveryTime
        ? Math.max(0, Math.round((msg.deliveryTime - msg.sentAt) / 1000))
        : null
    );
    const recipientName = openChat.userProfiles &&
      openChat.userProfiles.find((u) => u.uid !== currentUserID)?.username;

    return (
      <div
        key={i}
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
              onClick={() => handleDownloadPDF(msg, isSender, recipientName)}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v12m0 0l-3-3m3 3l3-3M4.5 19.5h15"
                />
              </svg>
            </button>
          )}
        </div>

        {!isSender && (
          <button
            onClick={() => handleReportMessage(msg)}
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
  };

  // Render sidebar
  const renderSidebar = () => (
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
              const friend = chat.userProfiles?.find(u => u.uid !== currentUserID);
              return (
                <li
                  key={chat.chatId}
                  onClick={() => {
                    setOpenChat(chat);
                    if (isMobile) setMobileShowList(false);
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
                      {chat.messages && chat.messages.length > 0
                        ? (() => {
                          const now = Date.now();
                          const lastUnlocked = [...chat.messages]
                            .reverse()
                            .find(m => m.deliveryTime <= now);
                          if (lastUnlocked) {
                            const isSender = lastUnlocked.sender === currentUserID;
                            return `${isSender ? "You: " : ""}${lastUnlocked.text}`;
                          }
                          return "Locked message (coming soon…)";
                        })()
                        : "No messages yet"}
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

  // Render chat area
  const renderChatArea = () => {
    if (chats.length === 0) {
      return (
        <div className="flex flex-1 items-center justify-center text-center px-6">
          <div className="max-w-md">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              You don&apos;t have any pen pals yet
            </h2>
            <p className="text-gray-500 mb-6">
              Once you connect with a pen pal, your chats will appear here.
            </p>
            <button
              onClick={() => router.push("/pages/matchmaking")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Find a Pen Pal
            </button>
          </div>
        </div>
      );
    }

    if (!openChat) {
      return (
        <div className="flex flex-1 items-center justify-center text-gray-500">
          Select a chat to view messages.
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="shrink-0 border-b border-gray-50 bg-white px-6 py-4 shadow-sm flex items-center justify-between">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="fixed p-2 top-4 left-4 z-50 rounded-md shadow-md hover:bg-gray-200 text-gray-600 md:hidden"
              title="Open sidebar"
            >
              ☰
            </button>
          )}

          <div className="flex flex-col items-center w-full gap-3">
            <img
              src={openChat.userProfiles.find(u => u.uid !== currentUserID)?.avatarUrl || "/default-avatar.png"}
              alt="profile"
              className="w-11 h-11 rounded-full border-gray-200 object-cover border"
            />
            <h3 className="text-lg font-semibold text-center w-full">
              {openChat.userProfiles.find(u => u.uid !== currentUserID)?.username}
            </h3>
            {openChat.messages && openChat.messages.length > 0 && (
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => handleDownloadChatPDF(openChat.messages, currentUserID, openChat.userProfiles)}
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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {openChat.messages && openChat.messages.length > 0 ? (
            <div className="space-y-3">
              {openChat.messages.map(renderMessage)}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center py-20 text-gray-500">
              No messages yet. Send a letter to start a conversation!
            </div>
          )}
        </div>

        {/* Reply Button */}
        <div className="shrink-0 border-t border-gray-50  px-6 py-4">
          <button
            onClick={() => {
              if (openChat && openChat.userProfiles) {
                const friend = openChat.userProfiles.find(u => u.uid !== currentUserID);
                setFriendProfile(friend);
              }
              setShowComposer(true);
            }}
            className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700"
          >
            {openChat.messages && openChat.messages.length > 0 ? "Reply to Letter" : "Start Chatting"}
          </button>
        </div>
      </div>
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
                  {chats.map((chat) => {
                    const friend = chat.userProfiles?.find(u => u.uid !== currentUserID);
                    return (
                      <li
                        key={chat.chatId}
                        onClick={() => {
                          setOpenChat(chat);
                          setMobileShowList(false);
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
                            {chat.messages && chat.messages.length > 0
                              ? (() => {
                                const now = Date.now();
                                const lastUnlocked = [...chat.messages]
                                  .reverse()
                                  .find(m => m.deliveryTime <= now);
                                if (lastUnlocked) {
                                  const isSender = lastUnlocked.sender === currentUserID;
                                  return `${isSender ? "You: " : ""}${lastUnlocked.text}`;
                                }
                                return "Locked message (coming soon…)";
                              })()
                              : "No messages yet"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
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
            {renderSidebar()}
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
      {showComposer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 border-gray-300 overflow-y-auto bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex flex-col border-b border-gray-300 pb-3">
              <h2 className="text-xl font-semibold">Reply to Letter</h2>
              {friendProfile && (
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  To: {friendProfile.username || "Anonymous Friend"}
                  {friendProfile.country && ` in ${friendProfile.country}`}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-gray-700">
                <span>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span>
                  Will arrive: {new Date(Date.now() + deliveryDelay * 1000).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium mb-1">Delivery Delay</label>
              <div className="relative">
                <select
                  value={deliveryDelay}
                  onChange={(e) => setDeliveryDelay(Number(e.target.value))}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-gray-700 shadow-sm"
                >
                  <option value={60}>1 min</option>
                  <option value={3600}>1 hour (Express)</option>
                  <option value={43200}>12 hours (Standard)</option>
                  <option value={86400}>1 day</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Longer delays create a more authentic pen pal experience
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Your Letter</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Dear pen pal..."
                className="w-full border border-gray-300 rounded p-3 h-40 resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 text-right">
                {1000 - messageText.length} characters left
              </p>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-300">
              <button
                onClick={handleSendLetter}
                disabled={!messageText.trim()}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold shadow-sm"
              >
                Send Letter
              </button>
              <button
                onClick={() => setShowComposer(false)}
                className="h-10 px-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModal.open && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-7 min-w-80 shadow-xl max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Report Message</h3>
            <div className="mb-3 text-sm text-gray-700">
              <strong>Message:</strong>
              <div className="bg-gray-50 rounded-md p-2 mt-1 mb-2 text-sm">
                {reportModal.msg?.text}
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="report-reason" className="block text-sm font-medium mb-1">
                Reason:
              </label>
              <select
                id="report-reason"
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option>Spam or scam</option>
                <option>Harassment or bullying</option>
                <option>Inappropriate content</option>
                <option>Hate speech or discrimination</option>
                <option>Impersonation</option>
                <option>Other</option>
              </select>
            </div>
            {reportReason === 'Other' && (
              <div className="mb-3">
                <label htmlFor="report-other" className="block text-sm font-medium mb-1">
                  Describe your complaint:
                </label>
                <textarea
                  id="report-other"
                  value={reportOther}
                  onChange={e => setReportOther(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="Enter details..."
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReportModal({ open: false, msg: null })}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Success Popup */}
      {reportSuccess && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-7 min-w-80 shadow-xl max-w-[90vw] flex flex-col items-center">
            <h3 className="text-lg font-semibold mb-4 text-green-700">Report Submitted</h3>
            <p className="mb-4 text-gray-700 text-center">Message reported. Thank you for your feedback.</p>
            <button
              onClick={() => setReportSuccess(false)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;
