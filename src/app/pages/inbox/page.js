"use client";

import React, { useEffect, useState } from 'react';
import LoadingScreen from '../../components/LoadingScreen';
import Sidebar from '../../components/Sidebar';
import { useRouter } from "next/navigation";
import { auth } from "../../firebase/auth";
import { onAuthStateChanged } from "firebase/auth";

export default function InboxWithSidebar() {
  const router = useRouter();
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
  // ...existing code...
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openChat, setOpenChat] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [deliveryDelay, setDeliveryDelay] = useState(60); // seconds, default 1 min
  // Gmail-style compose modal state
  const [composeOpen, setComposeOpen] = useState(false);
  // Report modal state
  const [reportModal, setReportModal] = useState({ open: false, msg: null });
  const [reportReason, setReportReason] = useState('Spam or scam');
  const [reportOther, setReportOther] = useState('');

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

  if (loading) return <LoadingScreen />;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!chats.length) return <div>No chats found.</div>;

  // Get current userID from auth (for filtering display)
  const currentUser = auth.currentUser;
  const currentUserID = currentUser ? currentUser.uid : null;

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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 ml-10 p-2 sm:p-4 lg:p-6 overflow-auto relative">
        <div style={{ display: 'flex', gap: 32, height: '100vh', minHeight: 0 }}>
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
          <div style={{
            flex: 2,
            minWidth: 300,
            borderLeft: '1px solid #ddd',
            paddingLeft: 24,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
          }}>
            {openChat ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
                height: '100%',
              }}>
                <h3 style={{ flex: '0 0 auto' }}>
                  Chat with: {openChat.userProfiles && currentUserID && openChat.userProfiles.filter(u => u.uid !== currentUserID).map(u => u.username).join(', ')}
                </h3>
                <div style={{
                  flex: 1,
                  minHeight: 0,
                  maxHeight: 'none',
                  background: '#fafafa',
                  padding: 12,
                  borderRadius: 6,
                  marginBottom: 0,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}>
                  {openChat.messages && openChat.messages.length > 0 ? (
                    openChat.messages.map((msg, i) => {
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
                                This letter will be delivered after {Math.ceil((deliveryTime - now) / 1000 / 60)} min.
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
                              {/* Report button for delivered messages not sent by current user */}
                              {!isSender && (
                                <button
                                  style={{ marginTop: 8, marginLeft: 8, background: '#fff', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontWeight: 500 }}
                                  onClick={() => handleReportMessage(msg)}
                                >
                                  Report
                                </button>
                              )}
                            </>
                          )}
                          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6, textAlign: 'right' }}>
                            {msg.deliveryTime ? new Date(msg.deliveryTime).toLocaleDateString() : ''}
                            <br />
                            {isDelivered ? `Delivered` : `Locked`}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div>No messages yet.</div>
                  )}
                </div>
                {/* Gmail-style Compose Button - fixed at bottom */}
                <div style={{
                  position: 'sticky',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  background: 'rgba(250,250,250,0.95)',
                  paddingTop: 12,
                  paddingBottom: 8,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  zIndex: 10,
                  flex: '0 0 auto',
                }}>
                  <button
                    onClick={() => setComposeOpen(true)}
                    style={{
                      background: '#fff',
                      color: '#1976d2',
                      border: '1px solid #1976d2',
                      borderRadius: 6,
                      padding: '8px 18px',
                      fontWeight: 500,
                      boxShadow: '0 2px 8px rgba(25,118,210,0.08)',
                      cursor: 'pointer',
                    }}
                  >
                    Write a Letter
                  </button>
                </div>
                {/* Compose Modal */}
                {composeOpen && (
                  <div style={{
                    position: 'fixed',
                    bottom: 32,
                    right: 32,
                    zIndex: 1200,
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
                    minWidth: 350,
                    maxWidth: 420,
                    width: '90vw',
                    padding: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    {/* Header */}
                    <div style={{
                      background: '#1976d2',
                      color: '#fff',
                      padding: '14px 20px',
                      fontWeight: 600,
                      fontSize: 17,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span>New Letter</span>
                      <button
                        onClick={() => setComposeOpen(false)}
                        style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', fontWeight: 400 }}
                        aria-label="Close compose"
                      >×</button>
                    </div>
                    {/* Body */}
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
                          setComposeOpen(false);
                        } catch (err) {
                          alert(err.message);
                        } finally {
                          setSending(false);
                        }
                      }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 20 }}
                    >
                      <label style={{ fontWeight: 500, marginBottom: 6, color: '#333' }}>To:</label>
                      <div style={{
                        background: '#f5f5f5',
                        borderRadius: 6,
                        padding: '7px 12px',
                        marginBottom: 12,
                        fontSize: 15,
                        color: '#1976d2',
                      }}>
                        {openChat.userProfiles && currentUserID && openChat.userProfiles.filter(u => u.uid !== currentUserID).map(u => u.username).join(', ')}
                      </div>
                      <textarea
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        placeholder="Write your letter here..."
                        rows={7}
                        style={{
                          resize: 'vertical',
                          borderRadius: 8,
                          border: '1px solid #bbb',
                          padding: '10px 14px',
                          fontSize: 15,
                          marginBottom: 14,
                          minHeight: 90,
                        }}
                        disabled={sending}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <label style={{ fontWeight: 500, fontSize: 14, marginRight: 8 }}>Delivery:</label>
                          <select value={deliveryDelay} onChange={e => setDeliveryDelay(Number(e.target.value))} style={{ borderRadius: 6, padding: '6px', fontSize: 14 }}>
                            <option value={60}>1 min</option>
                            <option value={600}>10 min</option>
                            <option value={3600}>1 hr</option>
                            <option value={43200}>12 hr</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          style={{
                            background: '#1976d2',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 22px',
                            fontWeight: 500,
                            fontSize: 15,
                            boxShadow: '0 1px 6px rgba(25,118,210,0.10)',
                            cursor: sending ? 'not-allowed' : 'pointer',
                            opacity: sending ? 0.7 : 1,
                          }}
                          disabled={sending}
                        >
                          Send
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: '#888' }}>Select a chat to view messages.</div>
            )}
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
      </main>
    </div>
  );
}