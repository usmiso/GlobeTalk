"use client";

import { useEffect } from 'react';
import { fetchChat } from '../lib/api';

export function useChatPolling(chatId, onMessages) {
  useEffect(() => {
    if (!chatId) return;
    let isMounted = true;

    const poll = async () => {
      try {
        const chat = await fetchChat(chatId);
        if (isMounted && chat && Array.isArray(chat.messages)) {
          onMessages(chat.messages);
        }
      } catch (e) {
        // swallow polling errors
      }
    };

    const interval = setInterval(poll, 3000);
    poll();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [chatId, onMessages]);
}
