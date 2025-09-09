import React, { useEffect, useState } from 'react';
// ...existing imports...

// API base - prefer NEXT_PUBLIC_API_URL, fallback to localhost:5000 for dev
const API = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:5000';

export default function ConversationList({ chatId, currentUser }) {
  const [chats, setChats] = useState([]); // { chatId, participants, lastMessage }
  const [profiles, setProfiles] = useState({}); // map userID -> profile
  const [otherUserId, setOtherUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load chats and profiles
  useEffect(() => {
    let mounted = true;
    async function loadChats() {
      if (!currentUser) return;
      try {
        const res = await fetch(`${API}/api/chats?userID=${encodeURIComponent(currentUser)}`);
        if (!res.ok) throw new Error('failed fetching chats');
        const data = await res.json();
        if (!mounted) return;
        // Only set real chats, no synthetic fallback
        setChats(Array.isArray(data) ? data : []);

        // fetch participant profiles in parallel
        const otherIds = new Set();
        data.forEach(c => {
          (c.participants || []).forEach(p => { otherIds.add(p); });
        });
        if (currentUser) otherIds.add(currentUser);
        const profilesMap = {};
        await Promise.all(Array.from(otherIds).map(async (id) => {
          try {
            const r = await fetch(`${API}/api/profile?userID=${encodeURIComponent(id)}`);
            if (r.ok) profilesMap[id] = await r.json();
            else profilesMap[id] = { userID: id };
          } catch (e) { profilesMap[id] = { userID: id }; }
        }));
        if (mounted) setProfiles(profilesMap);
      } catch (e) {
        console.error('loadChats err', e);
      }
    }
    loadChats();
    const iv = setInterval(loadChats, 300000);
    return () => { mounted = false; clearInterval(iv); };
  }, [currentUser]);

  // Create new chat
  const handleCreateChat = async () => {
    if (!otherUserId) {
      setError('Please enter a user ID');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/api/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentUserId: currentUser, otherUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtherUserId('');
        // Optionally reload chats
        setTimeout(() => {
          // Give backend a moment to update
          window.location.reload();
        }, 500);
      } else {
        setError(data.error || 'Failed to create chat');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg">
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Enter user ID to chat with"
            value={otherUserId}
            onChange={e => setOtherUserId(e.target.value)}
            disabled={loading}
          />
          <button onClick={handleCreateChat} disabled={loading} style={{ marginLeft: 8 }}>
            Start Chat
          </button>
          {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        </div>
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Your Pen Pals</div>
            <div className="text-xs text-gray-500">{chats.length} active conversation{chats.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div className="p-2">
          {chats.map(c => {
            const other = (c.participants || []).find(p => p !== currentUser);
            const prof = profiles[other] || {};
            const meProf = profiles[currentUser] || {};
            return (
              <div key={c.chatId} className="flex items-start gap-3 p-3 rounded hover:bg-sky-50 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold">
                  {prof.username ? prof.username.slice(0,2).toUpperCase() : (other ? other.slice(0,2) : '??')}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{meProf.username ? `${meProf.username} ↔ ${prof.username || other}` : `${currentUser} ↔ ${prof.username || other}`}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span className="inline-block">📍</span>
                    <span>{prof.timezone || 'Unknown'}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-2 truncate">{c.lastMessage?.text || ''}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
