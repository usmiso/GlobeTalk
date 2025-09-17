"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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
                  return { uid, username: userData.username || uid };
                })
              );
              chat.userProfiles = userProfiles;
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

  if (loading) return <div>Loading chats...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  // if (!chats.length) return <div>No chats found.</div>;

  // Get current userID from auth (for filtering display)
  const currentUser = auth.currentUser;
  const currentUserID = currentUser ? currentUser.uid : null;

  const handleSendLetter = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    if (!messageText.trim()) return;

    const newMsg = {
      sender: currentUserID,
      text: messageText,
      deliveryTime: Date.now() + deliveryDelay * 1000,
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


  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="w-full bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        {/* Left - Logo */}
        <div className="flex items-center gap-2">
          <img src="/images/globe.png" alt="GlobeTalk Logo" className="w-6 h-6" />
          <span className="font-bold text-lg">GlobeTalk</span>
        </div>

        {/* Right - Nav Links */}
        <nav className="flex items-center gap-10 mb-3 mt-2">
          <Link
            href="/pages/dashboard"
            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            Dashboard
          </Link>
          <Link href="/pages/matchmaking" className="text-sm text-gray-700 hover:text-black">
            Match
          </Link>
          <Link href="/pages/inbox" className="text-sm text-gray-700 hover:text-black">
            Inbox
          </Link>
          <Link href="/pages/explore" className="text-sm text-gray-700 hover:text-black">
            Explore
          </Link>
          <Link href="/pages/userprofile" className="text-sm text-gray-700 hover:text-black">
            Me
          </Link>
          <Link href="/pages/settings" className="text-sm text-gray-700 hover:text-black">
            Settings
          </Link>
        </nav>
      </header>

      {/* Main Content Area: Sidebar + Chat */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`fixed md:relative top-0 left-0 h-full md:h-auto md:min-h-screen w-80 border-r bg-white p-4 shadow-sm transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Your Pen Pals</h2>
            <button
              onClick={() => setSidebarOpen(true)}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 md:hidden"
            >
              ☰
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-black md:hidden"
            >
              ✖
            </button>
          </div>


          {chats.length === 0 ? (
            <div className="text-gray-500 text-sm mt-6">
              No active conversations yet.
            </div>
          ) : (
            <ul className="space-y-3">
              {chats.map((chat) => (
                <li
                  key={chat.chatId}
                  onClick={() => setOpenChat(chat)}
                  className={`p-3 rounded-lg cursor-pointer transition ${openChat && openChat.chatId === chat.chatId
                    ? "bg-blue-50"
                    : "hover:bg-gray-100"
                    }`}
                >
                  <div className="font-medium">
                    {chat.userProfiles &&
                      currentUserID &&
                      chat.userProfiles
                        .filter((u) => u.uid !== currentUserID)
                        .map((u) => u.username)
                        .join(", ")}
                  </div>
                  <p className="text-xs text-gray-400">
                    {chat.preview || "No messages yet"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>


        {/* Chat Area */}
        <main className="flex-1 flex flex-col">
          {openChat ? (
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="border-b bg-white px-6 py-4 shadow-sm">
                <h3 className="text-lg font-semibold">
                  Chat with{" "}
                  {openChat.userProfiles &&
                    currentUserID &&
                    openChat.userProfiles
                      .filter((u) => u.uid !== currentUserID)
                      .map((u) => u.username)
                      .join(", ")}
                </h3>
              </div>

              {/* Messages */}
              {/* ---------------- Main Chat Area ---------------- */}
              <div className="flex-1 flex flex-col p-6 bg-gray-50">
                {openChat.messages && openChat.messages.length > 0 ? (
                  <>
                    {/* ✅ CASE 1: Conversation already started */}
                    {/* Messages list */}
                    <div className="flex-1 overflow-y-auto space-y-3">
                      {openChat.messages.map((msg, i) => {
                        const isSender = msg.sender === currentUserID;
                        return (
                          <div
                            key={i}
                            className={`max-w-lg rounded-lg p-4 shadow ${isSender
                              ? "ml-auto bg-blue-600 text-white"
                              : "mr-auto bg-white text-gray-800"
                              }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                            <span className="block mt-2 text-xs opacity-70 text-right">
                              {msg.deliveryTime ? new Date(msg.deliveryTime).toLocaleDateString() : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* ✅ Reply input stays at bottom once chat has started */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendLetter();
                      }}>
                      
  <button
    onClick={() => setShowComposer(true)} // open the modal composer
    className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2"
  >
  Reply to Letter
  </button>

                    </form>
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
              className="fixed inset-0 flex items-center justify-center bg-transparent z-50"
            >
              <div
                // 🔹 Modal box styling
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 flex flex-col gap-6 border py-6 max-h-fit overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b pb-3">
                  <h2 className="text-xl font-semibold">Reply to Letter</h2>
                  <button
                    onClick={() => setShowComposer(false)}
                    className="text-gray-500 hover:text-black"
                  >
                    Cancel
                  </button>
                </div>

                {/* Delivery Delay dropdown (NEW) */}
                <div>
                  <label className="block text-sm font-medium mb-1">Delivery Delay</label>
                  <select
                    value={deliveryDelay}
                    onChange={(e) => setDeliveryDelay(Number(e.target.value))}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value={3600}>1 hour</option>
                    <option value={43200}>12 hours (Standard)</option>
                    <option value={86400}>1 day</option>
                  </select>
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
                    className="w-full border rounded p-3 h-40 resize-none"
                  />
                  <p className="text-xs text-gray-500 text-right">
                    {1000 - messageText.length} characters left
                  </p>
                </div>

                {/* Footer actions (NEW) */}
                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    onClick={() => setShowComposer(false)}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendLetter}
                    className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Send Letter
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );

};
export default Inbox;