import React, { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

// API base - prefer NEXT_PUBLIC_API_URL, fallback to localhost:5000 for dev
const API = typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : 'http://localhost:5000';

export default function ConversationList({ chatId, currentUser, otherUserId }) {
  const [chats, setChats] = useState([]); // { chatId, participants, lastMessage }
  const [profiles, setProfiles] = useState({}); // map userID -> profile

  useEffect(() => {
    let mounted = true;
    async function loadChats() {
      if (!currentUser) return;
      try {
        const res = await fetch(`${API}/api/chats?userID=${encodeURIComponent(currentUser)}`);
        if (!res.ok) throw new Error('failed fetching chats');
        const data = await res.json();
        if (!mounted) return;
        setChats(data);

        // fetch participant profiles in parallel (include currentUser for clarity)
        const otherIds = new Set();
        data.forEach(c => {
          (c.participants || []).forEach(p => { otherIds.add(p); });
        });
        // ensure currentUser and otherUserId included
        if (currentUser) otherIds.add(currentUser);
        if (otherUserId) otherIds.add(otherUserId);
        const profilesMap = {};
        await Promise.all(Array.from(otherIds).map(async (id) => {
          try {
            const r = await fetch(`${API}/api/profile?userID=${encodeURIComponent(id)}`);
            if (r.ok) profilesMap[id] = await r.json();
            else profilesMap[id] = { userID: id };
          } catch (e) { profilesMap[id] = { userID: id }; }
        }));
        if (mounted) setProfiles(profilesMap);
        // If there were no chats returned, but we have a current chatId/otherUserId, show a fallback entry
        if (mounted && Array.isArray(data) && data.length === 0 && otherUserId && chatId) {
          // ensure profile for otherUserId is present
          if (!profilesMap[otherUserId]) {
            try {
              const r = await fetch(`${API}/api/profile?userID=${encodeURIComponent(otherUserId)}`);
              if (r.ok) profilesMap[otherUserId] = await r.json();
              else profilesMap[otherUserId] = { userID: otherUserId };
            } catch (e) {
              profilesMap[otherUserId] = { userID: otherUserId };
            }
            if (mounted) setProfiles({ ...profilesMap });
          }
          const synthetic = { chatId, participants: [currentUser, otherUserId], lastMessage: null };
          if (mounted) setChats([synthetic]);
        }
      } catch (e) {
        console.error('loadChats err', e);
      }
    }
    loadChats();
  // Poll every 5 minutes to avoid excessive GET requests (5000ms was too frequent)
  const iv = setInterval(loadChats, 300000);
    return () => { mounted = false; clearInterval(iv); };
  }, [currentUser]);

  return (
    <div className="p-4">
      <div className="bg-white rounded-lg">
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Your Pen Pals</div>
            <div className="text-xs text-gray-500">{chats.length} active conversation{chats.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div className="p-2">
          {chats.map(c => {
            const other = (c.participants || []).find(p => p !== currentUser) || otherUserId;
            const prof = profiles[other] || {};
            const meProf = profiles[currentUser] || {};
            return (
              <div key={c.chatId} className="flex items-start gap-3 p-3 rounded hover:bg-sky-50 cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-semibold">
                  {prof.username ? prof.username.slice(0,2).toUpperCase() : (other.slice(0,2) || '??')}
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
