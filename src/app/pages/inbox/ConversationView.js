import React, { useEffect, useRef, useState } from 'react';
import Modal from 'react-modal';
import jsPDF from 'jspdf';

// helper to format Firestore Timestamp or Date
function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}
  // Download a single message as PDF
  function handleDownloadPDF(m) {
    const doc = new jsPDF();
    const sender = m.sender || '';
    const date = m.createdAt ? formatDate(m.createdAt) : '';
    const text = m.text || '';
    doc.setFontSize(16);
    doc.text(`From: ${sender}`, 10, 20);
    doc.setFontSize(12);
    doc.text(`Date: ${date}`, 10, 30);
    doc.text('Message:', 10, 40);
    doc.text(text, 10, 50);
    doc.save(`letter_${m.id || 'message'}.pdf`);
  }
import { auth } from '../../firebase/auth';

// API base - prefer NEXT_PUBLIC_API_URL, fallback to localhost:5000 for dev
const API = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:5000';

export default function ConversationView({ chatId, currentUser, otherUserId, delayMs = 12 * 60 * 60 * 1000, delayLabel = '12 hr' }) {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [editorHtml, setEditorHtml] = useState('');
  const editorRef = useRef();
  const containerRef = useRef();
  const scheduledTimersRef = React.useRef([]);
  const autoScrollRef = useRef(true);
  const initialLoadRef = useRef(true);
  const prevCountRef = useRef(0);
  // canonical demo users (seeded messages should use these profiles)
  const USER_A = 'vAVstGYbfsh8HL0GtAQSqt1GSvJ2';
  const USER_B = 'YEYbsnLkxKOg7LgLpg1W5nQuFdr1';

  // helper to format Firestore Timestamp or Date
  function formatDate(ts) {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : ts instanceof Date ? ts : new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${day}`;
  }

  // very small HTML sanitizer: remove script/style tags and on* attributes
  function sanitizeHtml(html) {
    if (!html) return '';
    // remove script and style tags
    let out = html.replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
    // remove on* attributes
    out = out.replace(/on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    return out;
  }

  useEffect(() => {
    if (!chatId) return;

    let mounted = true;
    let pollId = null;

    async function fetchMessages() {
      try {
  const res = await fetch(`${API}/api/chats/${encodeURIComponent(chatId)}/messages`);
        if (!res.ok) throw new Error('failed fetching messages');
        const msgs = await res.json();
  if (!mounted) return;
  const prevCount = prevCountRef.current || 0;
  setMessages(msgs);
        // clear any previously scheduled timers
        try { scheduledTimersRef.current.forEach(t => clearTimeout(t)); } catch (_) {}
        scheduledTimersRef.current = [];
        // schedule re-fetch for any messages that are locked for this receiver
        const now = new Date();
        msgs.forEach((m) => {
          const deliverAt = m.deliverAt ? new Date(m.deliverAt) : null;
          const isRecipient = currentUser && m.recipient === currentUser;
          if (deliverAt && deliverAt > now && isRecipient) {
            const ms = deliverAt.getTime() - now.getTime() + 500; // small slack
            // avoid scheduling ridiculously long timers
            if (ms > 0 && ms < 1000 * 60 * 60 * 24 * 7) {
              const t = setTimeout(() => { if (mounted) fetchMessages(); }, ms);
              scheduledTimersRef.current.push(t);
            }
          }
        });
        // Only auto-scroll on initial load, or if user is at bottom AND new messages arrived
        const newCount = Array.isArray(msgs) ? msgs.length : 0;
        const hasNew = newCount > prevCount;
        const doScroll = initialLoadRef.current || (autoScrollRef.current && hasNew);
        if (doScroll) {
          setTimeout(() => containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' }), 50);
        }
        initialLoadRef.current = false;
        prevCountRef.current = newCount;

  // Remove logic that hides or reseeds messages if none exist
      } catch (e) {
        console.error('fetchMessages err', e);
      }
    }

    // initial fetch and polling for updates
    fetchMessages();
    pollId = setInterval(fetchMessages, 2000);

    // attach scroll listener to detect user position
    const el = containerRef.current;
    function onScroll() {
      if (!el) return;
      // consider near-bottom within 100px as 'at bottom'
      const threshold = 100;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
      autoScrollRef.current = atBottom;
    }
    if (el) {
      el.addEventListener('scroll', onScroll, { passive: true });
      // initialize autoScroll flag
      onScroll();
    }

    // ensure chat doc participants via server (best-effort)
    (async () => {
      try {
  await fetch(`${API}/api/chats/${encodeURIComponent(chatId)}/messages`);
      } catch (e) {
        console.error('ensure chat via server err', e);
      }
    })();

    return () => {
      mounted = false;
      if (pollId) clearInterval(pollId);
      try { scheduledTimersRef.current.forEach(t => clearTimeout(t)); } catch (_) {}
      if (el) el.removeEventListener('scroll', onScroll);
    };
  }, [chatId, currentUser, otherUserId]);

  async function sendMessage(e) {
    e && e.preventDefault();
    // Use composeBody if modal is open, otherwise fallback to editorHtml/text
    const payloadText = isComposeOpen
      ? composeBody.trim()
      : (editorHtml && editorHtml.replace(/^(<p>|<div>)|(<\/p>|<\/div>)$/g, '').trim()) || text.trim();
    if (!payloadText) return;
    try {
      const senderUid = auth.currentUser?.uid || currentUser || null;
      const token = senderUid ? await auth.currentUser.getIdToken() : null;
      const now = new Date();
      const deliverAtDate = delayMs ? new Date(now.getTime() + Number(delayMs)) : now;
      const optimisticMsg = {
        id: `optimistic-${Date.now()}`,
        text: payloadText,
        subject: isComposeOpen ? composeSubject : '',
        sender: senderUid,
        recipient: otherUserId,
        createdAt: now.toISOString(),
        deliverAt: deliverAtDate.toISOString(),
        delayMs,
        delayLabel,
        meta: { type: 'letter' },
      };
      setMessages(prev => [...prev, optimisticMsg]);
      setText('');
      setEditorHtml('');
      setComposeSubject('');
      setComposeBody('');
      setIsComposeOpen(false);
      if (editorRef.current) editorRef.current.innerHTML = '';
      const payload = { text: payloadText, subject: optimisticMsg.subject, sender: senderUid, recipient: otherUserId, delayMs, delayLabel };
      const res = await fetch(`${API}/api/chats/${encodeURIComponent(chatId)}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('send failed');
      try { const r = await fetch(`${API}/api/chats/${encodeURIComponent(chatId)}/messages`); if (r.ok) setMessages(await r.json()); } catch (_) {}
      try { containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' }); autoScrollRef.current = true; } catch (_) {}
    } catch (err) {
      console.error('sendMessage err', err);
    }
  }

  // helper to seed canonical messages (used on empty chat or via manual reseed)
  async function reseedMessages() {
    try {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const res = await fetch(`${API}/api/chats/${encodeURIComponent(chatId)}/seed`, { method: 'POST', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (!res.ok) throw new Error('seed failed');
  const r2 = await fetch(`${API}/api/chats/${encodeURIComponent(chatId)}/messages`);
      if (r2.ok) setMessages(await r2.json());
    } catch (e) {
      console.error('reseedMessages failed', e);
    }
  }

  return (
    <div className="h-[72vh] flex flex-col">
      <div className="p-4 border-b flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Conversation</h3>
          {/* Only show participants if both are present and not demo/default */}
          {chatId && currentUser && otherUserId &&
            currentUser !== 'vAVstGYbfsh8HL0GtAQSqt1GSvJ2' &&
            otherUserId !== 'YEYbsnLkxKOg7LgLpg1W5nQuFdr1' && (
              <div className="text-xs text-gray-500">Between {currentUser.slice(0,8)} and {otherUserId.slice(0,8)}</div>
            )}
        </div>
        <div />
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto p-6 space-y-6 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-500">No messages yet — send the first letter.</div>
        )}

  {messages.map((m) => {
          // authoritative sender uid is the SDK auth currentUser when available
          const senderUid = auth.currentUser?.uid || currentUser || null;
          const mine = m.sender === senderUid;

          // determine deliverAt date and visibility for receiver
          const deliverAt = m.deliverAt ? new Date(m.deliverAt) : null;
          const now = new Date();
          const deliveredForReceiver = !deliverAt || deliverAt <= now;
          const deliverLabel = m.delayLabel || (deliverAt ? formatDate(deliverAt) : 'Scheduled');

          // Always show the message
          return (
            <div key={m.id} className={`max-w-3xl mx-auto ${mine ? 'self-end' : 'self-start'}`}>
              <div className={`rounded-lg p-0 overflow-hidden shadow ${mine ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                <div className={`flex items-center justify-between px-4 py-2 ${mine ? 'bg-blue-700/90' : 'bg-white'}`}>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {(!mine && !deliveredForReceiver) ? (
                      <>
                        <span className="inline-block">🔒</span>
                        <span>Letter locked</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-block">✉️</span>
                        <span>{mine ? 'To my pen pal' : 'From your pen pal'}</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs opacity-80">{formatDate(m.createdAt)}</div>
                </div>

                <div className={`px-4 py-6 ${mine ? '' : 'bg-gradient-to-tr from-white to-zinc-50'}`}>
                  {(!mine && !deliveredForReceiver) ? (
                    <div className="text-sm text-gray-500">Scheduled: {deliverLabel}</div>
                  ) : (
                    <>
                      <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.text) }} />
                      <button
                        className="mt-2 px-3 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
                        onClick={() => handleDownloadPDF(m)}
                      >
                        Download PDF
                      </button>
                    </>
                  )}
                </div>

                <div className={`px-4 py-2 text-xs ${mine ? 'text-blue-100' : 'text-gray-400'} border-t`}>
                  Delivered after {m.delayLabel || 'delay'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t flex justify-end">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          onClick={() => setIsComposeOpen(true)}
        >
          Compose
        </button>
      </div>

      <Modal
        isOpen={isComposeOpen}
        onRequestClose={() => setIsComposeOpen(false)}
        className="fixed inset-0 flex items-center justify-center z-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-30 z-40"
        ariaHideApp={false}
        shouldCloseOnOverlayClick={true}
      >
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-12 relative border border-gray-200 min-h-[500px] flex flex-col justify-between">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            onClick={() => setIsComposeOpen(false)}
          >
            ×
          </button>
          <h3 className="text-lg font-semibold mb-4">New Letter</h3>
          <form onSubmit={sendMessage} autoComplete="off">
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">To</label>
              <input
                type="text"
                value={otherUserId}
                disabled
                className="w-full border rounded px-2 py-1 bg-gray-100"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Subject</label>
              <input
                type="text"
                value={composeSubject}
                onChange={e => setComposeSubject(e.target.value)}
                className="w-full border rounded px-2 py-1"
                placeholder="Subject (optional)"
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Message</label>
              <textarea
                value={composeBody}
                onChange={e => setComposeBody(e.target.value)}
                className="w-full border rounded px-2 py-1 min-h-[96px]"
                placeholder="Write your letter..."
                required
              />
            </div>
            <div className="flex justify-end mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 text-base"
                disabled={!composeBody.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
