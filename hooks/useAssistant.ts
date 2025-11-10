'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { DEFAULT_GREETING, getAssistantFallback } from '@/lib/assistantFallbacks';

export type Sender = 'ai' | 'user';

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  timestamp: Date;
}

type UseAssistantOptions = {
  initialMessages?: ChatMessage[];
  userName?: string | null;
  typingDelay?: number;
};

type HistoryRecord = {
  role: Sender;
  content: string;
};

const createMessageId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const stampMessage = (message: Partial<ChatMessage>): ChatMessage => ({
  id: message.id ?? createMessageId(),
  sender: message.sender ?? 'ai',
  text: message.text ?? DEFAULT_GREETING,
  timestamp: message.timestamp ?? new Date()
});

export function useAssistant(options: UseAssistantOptions = {}) {
  const { initialMessages = [], userName = null, typingDelay = 500 } = options;

  const baseMessages = useMemo(() => {
    if (initialMessages.length > 0) {
      return initialMessages.map(stampMessage);
    }
    return [stampMessage({ sender: 'ai', text: DEFAULT_GREETING })];
  }, [initialMessages]);

  const [messages, setMessages] = useState<ChatMessage[]>(baseMessages);
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef<ChatMessage[]>(baseMessages);

  const reset = useCallback((nextMessages?: ChatMessage[]) => {
    const payload = (nextMessages && nextMessages.length ? nextMessages : baseMessages).map(stampMessage);
    messagesRef.current = payload;
    setMessages(payload);
    setIsTyping(false);
  }, [baseMessages]);

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return null;

      const userMessage: ChatMessage = stampMessage({ sender: 'user', text });

      const history: HistoryRecord[] = [...messagesRef.current, userMessage].map((message) => ({
        role: message.sender,
        content: message.text
      }));

      setMessages((prev) => {
        const next = [...prev, userMessage];
        messagesRef.current = next;
        return next;
      });

      setIsTyping(true);

      if (typingDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, typingDelay));
      }

      try {
        const response = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history })
        });

        const data = response.ok ? await response.json() : null;
        const reply: string | undefined = data?.reply?.toString().trim();

        const aiMessage: ChatMessage = stampMessage({
          sender: 'ai',
          text: reply && reply.length ? reply : getAssistantFallback(text, userName)
        });

        setMessages((prev) => {
          const next = [...prev, aiMessage];
          messagesRef.current = next;
          return next;
        });

        return aiMessage;
      } catch (error) {
        console.error('[assistant] request failed', error);
        const fallbackMessage: ChatMessage = stampMessage({
          sender: 'ai',
          text: getAssistantFallback(text, userName)
        });

        setMessages((prev) => {
          const next = [...prev, fallbackMessage];
          messagesRef.current = next;
          return next;
        });

        return fallbackMessage;
      } finally {
        setIsTyping(false);
      }
    },
    [typingDelay, userName]
  );

  return { messages, isTyping, sendMessage, reset };
}

