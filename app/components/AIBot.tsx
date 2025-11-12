'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatMessage, useAssistant } from '@/hooks/useAssistant';
import { DEFAULT_GREETING, TUTORIAL_GREETING } from '@/lib/assistantFallbacks';

interface AIBotProps {
  onClose?: () => void;
  isTutorialMode?: boolean; // New prop for tutorial mode
}

export default function AIBot({ onClose, isTutorialMode = false }: AIBotProps) {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const userAlias = useMemo(
    () => user?.displayName || user?.email?.split('@')[0] || null,
    [user?.displayName, user?.email]
  );

  // Use tutorial greeting if in tutorial mode, otherwise use default
  const greetingMessage: ChatMessage = useMemo(
    () => ({
      id: `ai-greeting-${user?.uid ?? 'guest'}`,
      sender: 'ai',
      text: isTutorialMode ? TUTORIAL_GREETING : DEFAULT_GREETING,
      timestamp: new Date()
    }),
    [user?.uid, isTutorialMode]
  );

  const initialMessages = useMemo(() => [greetingMessage], [greetingMessage]);

  const { messages, sendMessage, isTyping, reset } = useAssistant({
    initialMessages,
    userName: userAlias
  });

  useEffect(() => {
    reset(
      initialMessages.map((message) => ({
        ...message,
        timestamp: new Date()
      }))
    );
  }, [initialMessages, reset]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(messages.length <= 1 ? 'instant' : 'smooth');
  }, [messages, scrollToBottom]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isTyping) return;

    const payload = input.trim();
    setInput('');
    await sendMessage(payload);
  };

  return (
    <div className="ai-bot-container">
      <div className="ai-bot-header">
        <div className="ai-bot-title">
          <span className="ai-bot-icon">⚪</span>
          <span>Robert</span>
        </div>
        {onClose && (
          <button className="ai-bot-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>

      <div className="ai-bot-messages" ref={messagesContainerRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`ai-bot-message ai-bot-message--${message.sender}`}
          >
            <div className="ai-bot-message-content">
              {message.text.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
            <div className="ai-bot-message-time">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="ai-bot-message ai-bot-message--ai ai-bot-message--typing">
            <div className="ai-bot-typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>

      <form className="ai-bot-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="ai-bot-input"
          placeholder="Ask me anything..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isTyping}
        />
        <button
          type="submit"
          className="ai-bot-send"
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

