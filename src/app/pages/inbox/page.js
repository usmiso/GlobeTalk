"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

const Inbox = () => {
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
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openChat, setOpenChat] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [deliveryDelay, setDeliveryDelay] = useState(60); // seconds, default 1 min

  // Polling for open chat messages every 3 seconds
  useEffect(() => {
    if (!openChat || !openChat.chatId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiUrl}/api/profile?userID=${uid}`);
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
  if (error) return <div style={{color: 'red'}}>Error: {error}</div>;
  if (!chats.length) return <div>No chats found.</div>;

  // Get current userID from auth (for filtering display)
  const currentUser = auth.currentUser;
  const currentUserID = currentUser ? currentUser.uid : null;

  return (
    <div style={{ display: 'flex', gap: 32 }}>
      {/* Left: Chat List */}
      <div style={{ flex: 1, minWidth: 250 }}>
        <h2>Your Chats</h2>
        <ul>
          {chats.map((chat, idx) => (
            <li key={chat.chatId || idx} style={{marginBottom: 12, background: openChat && openChat.chatId === chat.chatId ? '#f0f0f0' : undefined, cursor: 'pointer', padding: 8, borderRadius: 4 }}
                onClick={() => setOpenChat(chat)}>
              <strong>Chat with:</strong> {chat.userProfiles && currentUserID && chat.userProfiles.filter(u => u.uid !== currentUserID).map(u => u.username).join(', ')}<br/>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {openChat.messages.map((msg, i) => {
                    // Delivery logic
                    const now = Date.now();
                    const deliveryTime = msg.deliveryTime ? new Date(msg.deliveryTime).getTime() : 0;
                    const isDelivered = now >= deliveryTime;
                    const isSender = msg.sender === currentUserID;
                    const recipientName = openChat.userProfiles && currentUserID && openChat.userProfiles.filter(u => u.uid !== currentUserID).map(u => u.username).join(', ');
                    return (
                      <div key={i} style={{
                        alignSelf: isSender ? 'flex-end' : 'flex-start',
                        background: isSender ? '#1976d2' : '#fff',
                        color: isSender ? '#fff' : '#222',
                        borderRadius: 8,
                        padding: '10px 16px',
                        maxWidth: '70%',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                        position: 'relative',
                      }}>
                        {/* Locked message logic */}
                        {!isDelivered ? (
                          <div>
                            <strong style={{ color: isSender ? '#fff' : '#1976d2' }}>Letter locked</strong>
                            <div style={{ fontSize: 13, marginTop: 4 }}>
                              This letter will be delivered after {Math.ceil((deliveryTime - now)/1000/60)} min.
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontWeight: 500 }}>{isSender ? 'To my pen pal' : 'From pen pal'}</div>
                            <div style={{ margin: '6px 0' }}>{msg.text}</div>
                            <button
                              style={{ marginTop: 8, background: '#fff', color: '#1976d2', border: '1px solid #1976d2', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontWeight: 500 }}
                              onClick={() => handleDownloadPDF(msg, isSender, recipientName)}
                            >
                              Download PDF
                            </button>
                          </>
                        )}
                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6, textAlign: 'right' }}>
                          {msg.deliveryTime ? new Date(msg.deliveryTime).toLocaleDateString() : ''}
                          <br/>
                          {isDelivered ? `Delivered` : `Locked`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>No messages yet.</div>
              )}
            </div>
            {/* Message input */}
            <form
              onSubmit={async e => {
                e.preventDefault();
                if (!messageText.trim() || sending) return;
                setSending(true);
                try {
                  // Compose message object
                  const newMsg = {
                    sender: currentUserID,
                    text: messageText,
                    deliveryTime: Date.now() + deliveryDelay * 1000,
                  };
                  // Send to backend (replace with your API endpoint)
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                  const res = await fetch(`${apiUrl}/api/chat/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chatId: openChat.chatId, message: newMsg }),
                  });
                  if (!res.ok) throw new Error('Failed to send message');
                  // Optionally, update UI immediately
                  setOpenChat(prev => ({
                    ...prev,
                    messages: [...(prev.messages || []), newMsg],
                  }));
                  setMessageText("");
                } catch (err) {
                  alert(err.message);
                } finally {
                  setSending(false);
                }
              }}
              style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}
            >
              <input
                type="text"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder="Write a letter..."
                style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc' }}
                disabled={sending}
              />
              <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500 }} disabled={sending}>
                Send
              </button>
              <select value={deliveryDelay} onChange={e => setDeliveryDelay(Number(e.target.value))} style={{ marginLeft: 8, borderRadius: 6, padding: '6px' }}>
                <option value={60}>1 min</option>
                <option value={600}>10 min</option>
                <option value={3600}>1 hr</option>
                <option value={43200}>12 hr</option>
              </select>
            </form>
          </div>
        ) : (
          <div style={{ color: '#888' }}>Select a chat to view messages.</div>
        )}
      </div>
    </div>
  );
}

export default Inbox;