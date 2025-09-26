"use client";
import React, { useEffect, useState } from 'react';
import LoadingScreen from '../../components/LoadingScreen';
import { useRouter } from "next/navigation";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EnvelopeIcon, CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import Navbar from '@/app/components/Navbar';


const Inbox = () => {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openChat, setOpenChat] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [deliveryDelay, setDeliveryDelay] = useState(60); // seconds, default 1 min
  const searchParams = useSearchParams();
  const initialChatId = searchParams.get("chatId");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  // Gmail-style compose modal state
  const [composeOpen, setComposeOpen] = useState(false);
  // Report modal state
  const [reportModal, setReportModal] = useState({ open: false, msg: null });
  const [reportReason, setReportReason] = useState('Spam or scam');
  const [reportOther, setReportOther] = useState('');
  const [profile, setProfile] = useState(null);
  const [friendProfile, setFriendProfile] = useState(null);

  // When user clicks "Reply", set the friend profile
  const handleReply = (chat) => {
    const friend = chat.userProfiles.find(u => u.uid !== currentUserID);
    setFriendProfile(friend);
    setShowComposer(true);
  };



  useEffect(() => {
    if (initialChatId && chats.length > 0) {
      const match = chats.find((c) => c.chatId === initialChatId);
      if (match) setOpenChat(match);
    }
  }, [initialChatId, chats]);

  // PDF download handler
  const handleDownloadPDF = (msg, isSender, recipientName) => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      const margin = 20;
      let y = margin;
      doc.setFont('times', 'normal');
      doc.setFontSize(12);
      // Date at top right
      const dateStr = msg.deliveryTime ? new Date(msg.deliveryTime).toLocaleDateString() : '';
      doc.text(dateStr, 180, y);
      y += 16;
      // Greeting and signature logic
      let greetingName, signatureName;
      if (isSender) {
        greetingName = recipientName;
        signatureName = 'You';
      } else {
        greetingName = 'You';
        signatureName = (openChat.userProfiles && openChat.userProfiles.find(u => u.uid === msg.sender)?.username || msg.sender);
      }
      // Greeting
      doc.setFontSize(14);
      doc.text(`Dear ${greetingName},`, margin, y);
      y += 12;
      // Message body
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(msg.text, 170);
      doc.text(lines, margin, y);
      y += lines.length * 7 + 12;
      // Closing
      doc.setFontSize(13);
      doc.text('Kind regards,', margin, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(signatureName, margin, y);
      // Save PDF
      doc.save(`Letter_${dateStr}.pdf`);
    });
  };

  const handleDownloadChatPDF = (messages, currentUserID, userProfiles) => {
    import("jspdf").then(({ jsPDF }) => {
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
        const senderName = isSender
          ? "You"
          : userProfiles?.find((u) => u.uid === msg.sender)?.username || msg.sender;

        const dateStr = msg.deliveryTime
          ? new Date(msg.deliveryTime).toLocaleDateString()
          : "";

        const isUnlocked = msg.deliveryTime <= now;

        // Sender + date
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        doc.text(`${senderName} (${dateStr})`, margin, y);
        y += 8;

        // Message text (locked/unlocked)
        doc.setFont(undefined, "normal");
        if (isUnlocked) {
          const lines = doc.splitTextToSize(msg.text, 170);
          doc.text(lines, margin, y);
          y += lines.length * 7 + 6;
        } else {
          doc.setTextColor(150); // gray for locked
          doc.text("This letter is locked and will unlock later...", margin, y);
          doc.setTextColor(0); // reset to black
          y += 12;
        }

        // Page break if needed
        if (y > 270) {
          doc.addPage();
          y = margin;
        }
      });

      doc.save("Chat_Transcript.pdf");
    });
  };



  // Polling for open chat messages every 3 seconds
  useEffect(() => {
    if (!openChat || !openChat.chatId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    let isMounted = true;
    const fetchMessages = async () => {
      try {
        // const res = await fetch(`${apiUrl}/api/chat?chatId=${encodeURIComponent(openChat.chatId)}`);
        const res = await fetch(`http://localhost:5000/api/chat?chatId=${encodeURIComponent(openChat.chatId)}`);
        if (!res.ok) return;
        const chat = await res.json();
        if (isMounted && chat && chat.messages) {
          setOpenChat(prev => prev ? { ...prev, messages: chat.messages } : prev);
        }
      } catch (err) {
        // Ignore polling errors for smoothness
      }
    };
    const interval = setInterval(fetchMessages, 3000);
    // Fetch immediately on open
    fetchMessages();
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [openChat?.chatId]);

  useEffect(() => {
    let unsubscribe;
    setLoading(true);
    setError(null);

    // Helper to fetch profile and chats, and usernames for chat partners
    const fetchProfile = async (uid) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        const res = await fetch(`${apiUrl}/api/profile?userID=${uid}`);
        // const res = await fetch(`http://localhost:5000/api/profile?userID=${uid}`);
        if (!res.ok) throw new Error('Failed to fetch user profile');
        const data = await res.json();
        const chatIds = data.chats || [];
        if (chatIds.length === 0) {
          setChats([]);
          setLoading(false);
          setProfile(data);
          return;
        }
        // Fetch all chat documents in parallel
        const chatDocs = await Promise.all(
          chatIds.map(async (chatId) => {
            const chatRes = await fetch(`${apiUrl}/api/chat?chatId=${encodeURIComponent(chatId)}`);
            // const chatRes = await fetch(`http://localhost:5000/api/chat?chatId=${encodeURIComponent(chatId)}`);
            if (!chatRes.ok) return null;
            const chat = await chatRes.json();
            // Fetch usernames for all users in this chat (except current user)
            if (chat && chat.users) {
              const userProfiles = await Promise.all(
                chat.users.map(async (uid) => {
                  if (uid === data.userID) return { uid, username: "You" };
                  const userRes = await fetch(`${apiUrl}/api/profile?userID=${uid}`);
                  // const userRes = await fetch(`http://localhost:5000/api/profile?userID=${uid}`);
                  if (!userRes.ok) return { uid, username: uid };
                  const userData = await userRes.json();
                  console.log("Fetched user profile:", userData);
                  return { uid, username: userData.username || uid, country: userData.country || "", avatarUrl: userData.avatarUrl || "/default-avatar.png" };
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
  if (!chats.length) return <div>No chats found.</div>;

  // Get current userID from auth (for filtering display)
  const currentUser = auth.currentUser;
  const currentUserID = currentUser ? currentUser.uid : null;

  const handleSendLetter = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    if (!messageText.trim()) return;

    const sentAt = Date.now();
    const newMsg = {
      sender: currentUserID,
      text: messageText,
      sentAt,                                   // when composed
      deliveryTime: sentAt + deliveryDelay * 1000,
      delaySeconds: deliveryDelay,              // <-- save the chosen delay
    };
    try {
      const res = await fetch(`${apiUrl}/api/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: openChat.chatId, message: newMsg }),
      });

      if (!res.ok) throw new Error("Failed to send message");

      // ✅ Update UI immediately
      setOpenChat(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), newMsg],
      }));
      setMessageText("");
      setShowComposer(false); // close modal
    } catch (err) {
      console.error(err);
      alert("Could not send message");
    }
  };


  // Open report modal
  const handleReportMessage = (msg) => {
    setReportModal({ open: true, msg });
    setReportReason('Spam or scam');
    setReportOther('');
  };

  // Submit report
  const submitReport = async () => {
    if (!reportModal.msg) return;
    let reasonToSend = reportReason === 'Other' ? reportOther.trim() : reportReason;
    if (!reasonToSend) {
      alert('Please provide a reason.');
      return;
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
          reason: reasonToSend
        })
      });
      if (!res.ok) throw new Error('Failed to report message');
      alert('Message reported. Thank you for your feedback.');
      setReportModal({ open: false, msg: null });
    } catch (err) {
      alert('Error reporting message: ' + err.message);
    }
  };


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

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />

      {/* Main Content Area: Sidebar + Chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}

        <aside
          className={`fixed md:relative top-0 left-0 h-full md:h-auto md:min-h-screen border-r border-gray-300 bg-white shadow-sm transition-all duration-300 ${sidebarOpen ? "w-80 p-4" : "w-16 p-2"
            }`}
        >
          <div className="flex justify-between items-center mb-4">
            {/* Show title only when expanded */}
            {sidebarOpen && <h2 className="text-lg font-semibold">Your Pen Pals</h2>}

            {/* Toggle button always visible */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md hover:bg-gray-200 text-gray-600"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? "✖" : "☰"}
            </button>
          </div>

          {/* Sidebar content only when expanded */}
          {sidebarOpen && (
            <ul className="space-y-3">
              {chats.map((chat) => {
                const friend = chat.userProfiles?.find(u => u.uid !== currentUserID);

                return (
                  <li
                    key={chat.chatId}
                    onClick={() => setOpenChat(chat)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${openChat && openChat.chatId === chat.chatId
                        ? "bg-blue-50"
                        : "hover:bg-gray-100"
                      }`}
                  >
                    {/* Profile Image */}
                    <img
                      src={friend?.avatarUrl || "/default-avatar.png"}
                      alt={friend?.username}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />

                    {/* Name + preview */}
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
                            return "No unlocked messages yet";
                          })()
                          : "No messages yet"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

          )}
        </aside>



        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {openChat ? (
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="shrink-0 border-b border-gray-50 bg-white px-6 py-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={openChat.userProfiles.find(u => u.uid !== currentUserID)?.avatarUrl || "/default-avatar.png"}
                    alt="profile"
                    className="w-11 h-11 rounded-full border-gray-200 object-cover border"
                  />
                  <h3 className="text-lg font-semibold">
                    {openChat.userProfiles.find(u => u.uid !== currentUserID)?.username}
                  </h3>
                </div>
                <button
                  onClick={() =>
                    handleDownloadChatPDF(openChat.messages, currentUserID, openChat.userProfiles)
                  }
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-sm text-gray-700"
                >
                  Download Chat
                </button>
              </div>

              {/* Messages */}
              {/* ---------------- Main Chat Area ---------------- */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {openChat.messages && openChat.messages.length > 0 ? (
                  <>
                    {/* ✅ CASE 1: Conversation already started */}
                    {/* Messages list */}
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {openChat.messages.map((msg, i) => {
                        if (!msg) return null; // guard
                        const isSender = currentUserID && msg.sender === currentUserID;
                        const now = Date.now();
                        const isUnlocked = msg.deliveryTime <= now;
                        const secs =
                          msg.delaySeconds ??
                          (msg.sentAt && msg.deliveryTime
                            ? Math.max(0, Math.round((msg.deliveryTime - msg.sentAt) / 1000))
                            : null);
                        // 👇 recipient name for this message
                        const recipientName =
                          openChat.userProfiles &&
                          openChat.userProfiles.find((u) => u.uid !== currentUserID)?.username;

                        return (
                          <div key={i} className={`w-full max-w-md rounded-lg border border-gray-300 shadow-sm p-2 ${isSender ? "ml-auto bg-blue-50" : "mr-auto bg-pink-50"}`}>

                            {/* Header */}
                            <div className={`flex items-center justify-between px-4 py-1 pb-0.5 border-b ${isSender ? "border-blue-200" : "border-pink-200"
                              }`}>
                              <div className="flex items-center gap-2 font-semibold">
                                <EnvelopeIcon className="w-4 h-4" />
                                <p className="flex items-center gap-2 pb-1 text-sm font-medium">
                                  {isSender ? "To my pen pal" : "From your pen pal"}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <CalendarIcon className="w-4 h-4" />
                                <span className="text-xs text-gray-400 opacity-80">

                                  {msg.deliveryTime
                                    ? new Date(msg.deliveryTime).toLocaleDateString()
                                    : ""}
                                </span>
                              </div>
                            </div>

                            {/* Body */}
                            <div className="px-4 py-4 text-sm leading-relaxed">
                              {isUnlocked ? (
                                <p className="text-gray-800 text-sm">{msg.text}</p>
                              ) : (
                                <p className="italic text-gray-400 text-sm">This letter will unlock soon...</p>
                              )}
                            </div>

                            {/* Footer */}
                            <div
                              className={`flex items-center justify-between pt-0.5 px-4 py-2 border-t text-xs ${isSender ? "border-blue-200" : "border-pink-200"
                                }`}
                            >
                              {/* Left: delivery info */}
                              <span className="flex items-center gap-1 pt-3 opacity-80">
                                <div className="flex items-center gap-1">
                                  <ClockIcon className="w-4 h-4" />
                                  Delivered after {formatDelay(secs)} delay
                                </div>
                              </span>

                              {/* Right: download button */}
                              {isUnlocked && (
                                <button
                                  onClick={() => handleDownloadPDF(msg, isSender, recipientName)}
                                  className={"ml-3 transition text-black"
                                  }
                                  title="Download letter"
                                >
                                  {/* Download icon */}
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

                                  {/* Report button */}
                                  <button
                                    onClick={() => handleReportMessage(msg)}
                                    className="ml-2 transition text-red-600 hover:text-red-800 text-xs border border-red-200 rounded px-2 py-1"
                                    title="Report this message"
                                  >
                                    Report
                                  </button>

                          </div>
                        );
                      })}
                    </div>

                  </>
                ) : (
                  // ✅ CASE 2: No messages yet → Start Chatting button in center
                  <div className="flex-1 flex items-center justify-center">
                    <button
                      onClick={() => setShowComposer(true)}
                      className="bg-blue-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                      Start Chatting
                    </button>
                  </div>
                )}
              </div>

              {/* ✅ Reply input stays at bottom once chat has started */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendLetter();
                }}>

                <div className="shrink-0 border-t border-gray-50 bg-white px-6 py-4">
                  <button
                    onClick={() => {
                      if (openChat && openChat.userProfiles) {
                        const friend = openChat.userProfiles.find(u => u.uid !== currentUserID);
                        setFriendProfile(friend);   // 🔹 set the other user
                      }
                      setShowComposer(true);        // 🔹 open modal
                    }}
                    className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700"
                  >
                    Reply to Letter
                  </button>
                </div>

              </form>

              {/* Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // your send logic
                }}
              >
              </form>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-500">
              Select a chat to view messages.
            </div>
          )}

          {/* ---------------- Modal Composer (NEW) ---------------- */}
          {showComposer && (
            <div
              // 🔹 Fullscreen dark semi-transparent overlay
              className=" fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <div
                // 🔹 Modal box styling
                className="bg-white p-6  border-gray-300 overflow-y-auto
                bg-card text-card-foreground flex flex-col gap-6 rounded-xl
                 border py-6 shadow-sm w-full max-w-2xl max-h-[90vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="flex flex-col border-b border-gray-300 pb-3">
                  <h2 className="text-xl font-semibold">Reply to Letter</h2>
                  {friendProfile && (
                    <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                      To: {friendProfile.username || "Anonymous Friend"}
                      {friendProfile.country && ` in ${friendProfile.country}`}
                    </p>
                  )}
                </div>

                {/* Delivery Info Section */}
                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                  {/* Current Date */}
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

                  {/* Arrival Time */}
                  <div className="flex items-center gap-2 text-gray-700">

                    <span>
                      Will arrive:{" "}
                      {new Date(Date.now() + deliveryDelay * 1000).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Delivery Delay dropdown (NEW) */}

                <div className="w-full">
                  <label className="block text-sm font-medium mb-1">Delivery Delay</label>
                  <div className="relative">
                    <select
                      value={deliveryDelay}
                      onChange={(e) => setDeliveryDelay(Number(e.target.value))}
                      className="w-full appearance-none rounded-lg border border-gray-300bg-white px-4 py-3 pr-10 text-gray-700 shadow-sm"
                    >
                      <option value={120}>2 min</option>
                      <option value={3600}>1 hour (Express)</option>
                      <option value={43200}>12 hours (Standard)</option>
                      <option value={86400}>1 day</option>
                    </select>

                    {/* Custom chevron icon on the right */}
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



                {/* Letter textarea (NEW) */}
                <div>
                  <label className="block text-sm font-medium mb-1">Your Letter</label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Dear pen pal..."
                    className="w-full border border-gray-300 rounded p-3 h-40 resize-none"
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {1000 - messageText.length} characters left
                  </p>
                </div>


                {/* Footer actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-300">
                  {/* Send Letter (full width, equal height) */}
                  <button
                    onClick={handleSendLetter}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-sm"
                  >
                    Send Letter
                  </button>

                  {/* Cancel (same height as Send) */}
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
        </main>
      </div>
      {/* Report Modal */}
      {reportModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.25)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 10,
            padding: 28,
            minWidth: 320,
            boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
            maxWidth: '90vw',
          }}>
            <h3 style={{ marginTop: 0 }}>Report Message</h3>
            <div style={{ marginBottom: 12, fontSize: 15, color: '#333' }}>
              <strong>Message:</strong>
              <div style={{ background: '#f5f5f5', borderRadius: 6, padding: '8px 12px', marginTop: 4, marginBottom: 8 }}>{reportModal.msg?.text}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label htmlFor="report-reason" style={{ fontWeight: 500 }}>Reason:</label><br />
              <select
                id="report-reason"
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                style={{ width: '100%', padding: '7px 8px', borderRadius: 6, border: '1px solid #bbb', marginTop: 4 }}
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
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="report-other" style={{ fontWeight: 500 }}>Describe your complaint:</label><br />
                <textarea
                  id="report-other"
                  value={reportOther}
                  onChange={e => setReportOther(e.target.value)}
                  rows={3}
                  style={{ width: '100%', borderRadius: 6, border: '1px solid #bbb', marginTop: 4, padding: '7px 8px' }}
                  placeholder="Enter details..."
                />
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                onClick={() => setReportModal({ open: false, msg: null })}
                style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', fontWeight: 500, cursor: 'pointer' }}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

};
export default Inbox;