'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicUserById } from '@/hooks/useFirestore';
import { useChats, useChatMessages } from '@/hooks/useChats';

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientId: string;
}

export default function ChatModal({ isOpen, onClose, recipientId }: ChatModalProps) {
    const { user } = useAuth();
    const { user: recipient } = usePublicUserById(recipientId);
    const { createOrGetChat, sendMessageToChat, sending, error: chatError } = useChats(user?.uid);
    const [chatId, setChatId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [initializing, setInitializing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const { messages, loading: messagesLoading } = useChatMessages(chatId || undefined);

    // Initialize chat when modal opens
    useEffect(() => {
        if (isOpen && user && recipientId && !chatId && !initializing) {
            setInitializing(true);
            setError(null);
            createOrGetChat(recipientId)
                .then((id) => {
                    setChatId(id);
                    setInitializing(false);
                })
                .catch((err) => {
                    setError(err.message || 'Failed to initialize chat');
                    setInitializing(false);
                });
        }
    }, [isOpen, user, recipientId, chatId, initializing, createOrGetChat]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setChatId(null);
            setMessageText('');
            setError(null);
            setInitializing(false);
        }
    }, [isOpen]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!messageText.trim() || !chatId || sending) return;

        const text = messageText.trim();
        setMessageText('');

        try {
            await sendMessageToChat(chatId, text);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
            setMessageText(text); // Restore message text on error
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    const displayError = error || chatError;

    return (
        <div className="chat-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>
                        {recipient ? `Chat with ${recipient.displayName || 'User'}` : 'Chat with User'}
                    </h2>
                    <button className="close-button" onClick={onClose} aria-label="Close chat">
                        &times;
                    </button>
                </div>

                <div className="modal-body">
                    {displayError && (
                        <div style={{
                            padding: '0.75rem',
                            background: 'rgba(255, 0, 0, 0.1)',
                            border: '1px solid rgba(255, 0, 0, 0.3)',
                            borderRadius: '4px',
                            color: '#ff6b6b',
                            fontSize: '0.875rem',
                            marginBottom: '1rem'
                        }}>
                            {displayError}
                        </div>
                    )}

                    {initializing && (
                        <div style={{
                            padding: '2rem',
                            textAlign: 'center',
                            color: 'var(--text-muted)',
                            fontFamily: 'JetBrains Mono, monospace'
                        }}>
                            Initializing chat...
                        </div>
                    )}

                    {!initializing && chatId && (
                        <>
                            {messagesLoading && messages.length === 0 ? (
                                <div style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    fontFamily: 'JetBrains Mono, monospace'
                                }}>
                                    Loading messages...
                                </div>
                            ) : messages.length === 0 ? (
                                <div style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                    fontFamily: 'JetBrains Mono, monospace'
                                }}>
                                    No messages yet. Start the conversation!
                                </div>
                            ) : (
                                messages.map((message) => {
                                    const isSent = message.senderId === user?.uid;
                                    return (
                                        <div
                                            key={message.id}
                                            className={`message ${isSent ? 'sent' : 'received'}`}
                                            style={{
                                                alignSelf: isSent ? 'flex-end' : 'flex-start',
                                            }}
                                        >
                                            <div style={{ marginBottom: '0.25rem' }}>{message.text}</div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                opacity: 0.7,
                                                marginTop: '0.25rem'
                                            }}>
                                                {message.createdAt?.toDate?.()
                                                    ? new Date(message.createdAt.toDate()).toLocaleTimeString([], {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })
                                                    : ''}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <input
                        ref={inputRef}
                        id="chat-message-input"
                        type="text"
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        maxLength={500}
                        disabled={!chatId || sending || initializing}
                    />
                    <button
                        id="chat-send-btn"
                        onClick={handleSend}
                        disabled={!messageText.trim() || !chatId || sending || initializing}
                    >
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}

