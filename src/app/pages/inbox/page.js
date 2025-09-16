"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

const Inbox = () => {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openChat, setOpenChat] = useState(null);

  useEffect(() => {
    let unsubscribe;
    setLoading(true);
    setError(null);

    // Helper to fetch profile and chats, and usernames for chat partners
    const fetchProfile = async (uid) => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        // const res = await fetch(`${apiUrl}/api/profile?userID=${uid}`);
        const res = await fetch(`http://localhost:5000/api/profile?userID=${uid}`);
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
            if (!chatRes.ok) return null;
            const chat = await chatRes.json();
            // Fetch usernames for all users in this chat (except current user)
            if (chat && chat.users) {
              const userProfiles = await Promise.all(
                chat.users.map(async (uid) => {
                  if (uid === data.userID) return { uid, username: "You" };
                  const userRes = await fetch(`${apiUrl}/api/profile?userID=${uid}`);
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
  if (!chats.length) return <div>No chats found.</div>;

  // Get current userID from auth (for filtering display)
  const currentUser = auth.currentUser;
  const currentUserID = currentUser ? currentUser.uid : null;

  return (
    <div className="flex min-h-screen bg-gray-100">


      <main className="flex flex-col items-center w-full min-h-screen py-2 px-4 bg-gray-50">

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


            <Link href="/pages/matchmaking" className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">

              Match
            </Link>

            <Link href="/pages/inbox"
              className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">

              Inbox
            </Link>

            <Link href="explore" className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">

              Explore
            </Link>

            <Link href="settings" className="flex items-center gap-1 text-gray-700 hover:text-black text-sm">

              Settings
            </Link>
          </nav>
        </header>
        <div style={{ display: 'flex', gap: 32 }}>
          {/* Left: Chat List */}
          <div style={{ flex: 1, minWidth: 250 }}>
            <h2>Your Chats</h2>
            <ul>
              {chats.map((chat, idx) => (
                <li key={chat.chatId || idx} style={{ marginBottom: 12, background: openChat && openChat.chatId === chat.chatId ? '#f0f0f0' : undefined, cursor: 'pointer', padding: 8, borderRadius: 4 }}
                  onClick={() => setOpenChat(chat)}>
                  <strong>Chat with:</strong> {chat.userProfiles && currentUserID && chat.userProfiles.filter(u => u.uid !== currentUserID).map(u => u.username).join(', ')}<br />
                  <button onClick={e => { e.stopPropagation(); router.push(`/chat/${chat.chatId}`); }}>Open Chat</button>
                </li>
              ))}
            </ul>
          </div>
          {/* Right: Open Chat */}
          <div style={{ flex: 2, minWidth: 300, borderLeft: '1px solid #ddd', paddingLeft: 24 }}>
            {openChat ? (
              <div>
                <h3>Chat with: {openChat.userProfiles && currentUserID && openChat.userProfiles.filter(u => u.uid !== currentUserID).map(u => u.username).join(', ')}</h3>
                <div style={{ minHeight: 200, background: '#fafafa', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                  {openChat.messages && openChat.messages.length > 0 ? (
                    <ul>
                      {openChat.messages.map((msg, i) => (
                        <li key={i} style={{ marginBottom: 8 }}>
                          <strong>{msg.sender === currentUserID ? 'You' : (openChat.userProfiles && openChat.userProfiles.find(u => u.uid === msg.sender)?.username || msg.sender)}:</strong> {msg.text}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div>No messages yet.</div>
                  )}
                </div>
                {/* Placeholder for message input, not implemented */}
                <div style={{ color: '#888' }}><em>Message sending not implemented here.</em></div>
              </div>
            ) : (
              <div style={{ color: '#888' }}>Select a chat to view messages.</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Inbox;