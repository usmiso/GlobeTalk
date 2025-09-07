import React, { useEffect, useRef, useState } from 'react';
import { auth } from '../../firebase/auth';

// API base - prefer NEXT_PUBLIC_API_URL, fallback to localhost:5000 for dev
const API = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:5000';

export default function ConversationView({ chatId, currentUser, otherUserId, delayMs = 12 * 60 * 60 * 1000, delayLabel = '12 hr' }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [editorHtml, setEditorHtml] = useState('');
  const editorRef = useRef();
  const containerRef = useRef();
  const scheduledTimersRef = React.useRef([]);
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
        setTimeout(() => containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' }), 50);

        if (!msgs || msgs.length === 0) {
          // ask server to seed canonical messages
          await fetch(`${API}/api/chats/${encodeURIComponent(chatId)}/seed`, { method: 'POST' });
          // re-fetch once seeded
          const res2 = await fetch(`${API}/api/chats/${encodeURIComponent(chatId)}/messages`);
          const msgs2 = await res2.json();
          if (mounted) setMessages(msgs2);
        }
      } catch (e) {
        console.error('fetchMessages err', e);
      }
    }

    // initial fetch and polling for updates
    fetchMessages();
    pollId = setInterval(fetchMessages, 2000);

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
    };
  }, [chatId, currentUser, otherUserId]);

  async function sendMessage(e) {
    e && e.preventDefault();
  // Use editorHtml if present, otherwise fallback to plain text
  const payloadText = (editorHtml && editorHtml.replace(/^(<p>|<div>)|(<\/p>|<\/div>)$/g, '').trim()) || text.trim();
  if (!payloadText) return;
    try {
      // prefer SDK auth uid as authoritative
      const senderUid = auth.currentUser?.uid || currentUser || null;
      const token = senderUid ? await auth.currentUser.getIdToken() : null;
  const payload = { text: payloadText, sender: senderUid, recipient: otherUserId, delayMs, delayLabel };
  const res = await fetch(`${API}/api/chats/${encodeURIComponent(chatId)}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('send failed');
  setText('');
  setEditorHtml('');
  if (editorRef.current) editorRef.current.innerHTML = '';
      // refresh messages after send
  try { const r = await fetch(`${API}/api/chats/${encodeURIComponent(chatId)}/messages`); if (r.ok) setMessages(await r.json()); } catch (_) {}
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
          <div className="text-xs text-gray-500">Between {currentUser ? currentUser.slice(0,8) : 'signed out'} and {otherUserId.slice(0,8)}</div>
          <div className="text-xs text-gray-400">(debug uid: {auth.currentUser?.uid || 'none'})</div>
        </div>
        <div>
          <button onClick={reseedMessages} className="text-sm px-3 py-1 border rounded bg-white">Reseed messages</button>
        </div>
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

          // if the message is not from me and not yet delivered, show placeholder to receiver
          if (!mine && !deliveredForReceiver) {
            const deliverLabel = m.delayLabel || (deliverAt ? formatDate(deliverAt) : 'Scheduled');
            return (
              <div key={m.id} className="max-w-3xl mx-auto self-start">
                <div className="rounded-lg p-0 overflow-hidden shadow bg-white border">
                  <div className="flex items-center justify-between px-4 py-2 bg-white">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="inline-block">🔒</span>
                      <span>Letter locked</span>
                    </div>
                    <div className="text-xs opacity-80">{deliverAt ? formatDate(deliverAt) : ''}</div>
                  </div>
                  <div className="px-4 py-6 bg-gradient-to-tr from-white to-zinc-50 text-sm text-gray-500">
                    This letter will be delivered after {deliverLabel}.
                  </div>
                </div>
              </div>
            );
          }

          // otherwise show the message (sender always sees their own messages immediately)
          return (
            <div key={m.id} className={`max-w-3xl mx-auto ${mine ? 'self-end' : 'self-start'}`}>
              <div className={`rounded-lg p-0 overflow-hidden shadow ${mine ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
                <div className={`flex items-center justify-between px-4 py-2 ${mine ? 'bg-blue-700/90' : 'bg-white'}`}>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="inline-block">✉️</span>
                    <span>{mine ? 'To my pen pal' : 'From your pen pal'}</span>
                  </div>
                  <div className="text-xs opacity-80">{formatDate(m.createdAt)}</div>
                </div>

                <div className={`px-4 py-6 ${mine ? '' : 'bg-gradient-to-tr from-white to-zinc-50'}`}>
                  <div className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitizeHtml(m.text) }} />
                </div>

                <div className={`px-4 py-2 text-xs ${mine ? 'text-blue-100' : 'text-gray-400'} border-t`}>
                  Delivered after {m.delayLabel || 'delay'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="border rounded p-2 bg-white">
              <div className="mb-2 flex items-center gap-2">
                <button type="button" onClick={() => document.execCommand('bold')} className="px-2 py-1 border rounded">B</button>
                <button type="button" onClick={() => document.execCommand('italic')} className="px-2 py-1 border rounded">I</button>
                <button type="button" onClick={() => document.execCommand('underline')} className="px-2 py-1 border rounded">U</button>
                <select onChange={(e) => document.execCommand('fontSize', false, e.target.value)} defaultValue="3" className="border rounded px-1">
                  <option value="2">Small</option>
                  <option value="3">Normal</option>
                  <option value="4">Large</option>
                  <option value="5">XL</option>
                </select>
                <select onChange={(e) => document.execCommand('fontName', false, e.target.value)} defaultValue="Arial" className="border rounded px-1">
                  <option>Arial</option>
                  <option>Georgia</option>
                  <option>Times New Roman</option>
                  <option>Courier New</option>
                </select>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning={true}
                role="textbox"
                className="min-h-[96px] outline-none"
                onInput={(e) => setEditorHtml(e.currentTarget.innerHTML)}
                onPaste={(e) => {
                  // simple paste cleanup: paste as plain text to avoid injected markup
                  e.preventDefault();
                  const text = (e.clipboardData || window.clipboardData).getData('text');
                  document.execCommand('insertText', false, text);
                }}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
              disabled={!((editorHtml && editorHtml.replace(/<[^>]*>/g, '').trim()) || text.trim())}
            >
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
