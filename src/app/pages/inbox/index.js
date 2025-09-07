"use client";

import React, { useEffect, useMemo, useState } from 'react';
import ConversationList from './ConversationList';
import ConversationView from './ConversationView';
import { auth, onAuthStateChanged } from '../../firebase/auth';

// Use Firebase auth state to determine current user so two different browsers
// that are logged in to different accounts will show proper back-and-forth.
export default function InboxPage() {
  const USER_A = 'vAVstGYbfsh8HL0GtAQSqt1GSvJ2';
  const USER_B = 'YEYbsnLkxKOg7LgLpg1W5nQuFdr1';

  const [currentUser, setCurrentUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u ? u.uid : null);
    });
    return () => unsub();
  }, []);

  // when undefined, auth is still resolving. When null, user is signed out.
  if (currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading auth...</div>
    );
  }

  const activeUser = currentUser; // null means signed out
  const otherUser = activeUser === USER_A ? USER_B : USER_A;
  const chatId = useMemo(() => [USER_A, USER_B].sort().join('_'), []);

  const DELAYS = [
    { label: '1 min', ms: 60 * 1000 },
    { label: '1 hr', ms: 60 * 60 * 1000 },
    { label: '5 hr', ms: 5 * 60 * 60 * 1000 },
    { label: '12 hr', ms: 12 * 60 * 60 * 1000 },
    { label: '1 day', ms: 24 * 60 * 60 * 1000 },
  ];
  const [selectedDelay, setSelectedDelay] = useState(DELAYS[3]); // default 12 hr

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Inbox — Letter chat demo</h2>
        </div>

        <div className="flex items-start gap-4 px-4 py-3 border-b">
          <div />
          <div className="ml-auto flex items-center gap-3">
            <label className="text-sm text-gray-600">Delivery delay</label>
            <select
              value={selectedDelay.label}
              onChange={(e) => setSelectedDelay(DELAYS.find((d) => d.label === e.target.value))}
              className="border rounded px-3 py-1"
            >
              {DELAYS.map((d) => (
                <option key={d.label} value={d.label}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex">
          <div className="w-80 border-r">
            <ConversationList chatId={chatId} currentUser={activeUser} otherUserId={otherUser} />
          </div>

          <div className="flex-1">
            <ConversationView chatId={chatId} currentUser={activeUser} otherUserId={otherUser} delayMs={selectedDelay.ms} delayLabel={selectedDelay.label} />
          </div>
        </div>
      </div>
    </div>
  );
}
