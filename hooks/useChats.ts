'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  DocumentData,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Chat, Message } from './useFirestore';

/**
 * Generate a deterministic chat ID from two user IDs
 * This ensures the same two users always get the same chat ID
 */
function generateChatId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `chat_${sorted[0]}_${sorted[1]}`;
}

/**
 * Get or create a chat between two users
 */
export async function getOrCreateChat(userId1: string, userId2: string): Promise<string> {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  if (userId1 === userId2) {
    throw new Error('Cannot create chat with yourself');
  }

  const chatId = generateChatId(userId1, userId2);
  const chatRef = doc(db, 'chats', chatId);

  try {
    // Check if chat exists
    const chatSnap = await getDoc(chatRef);
    
    if (chatSnap.exists()) {
      return chatId;
    }

    // Create new chat
    const participants: [string, string] = [userId1, userId2].sort() as [string, string];
    await setDoc(chatRef, {
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return chatId;
  } catch (error: any) {
    console.error('Error creating/getting chat:', error);
    throw error;
  }
}

/**
 * Send a message to a chat
 */
export async function sendMessage(chatId: string, senderId: string, text: string): Promise<string> {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  if (!text.trim()) {
    throw new Error('Message text cannot be empty');
  }

  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const chatRef = doc(db, 'chats', chatId);

  // Use transaction to add message and update chat metadata
  let messageId: string;
  await runTransaction(db, async (tx) => {
    // Verify chat exists and user is a participant
    const chatSnap = await tx.get(chatRef);
    if (!chatSnap.exists()) {
      throw new Error('Chat does not exist');
    }

    const chatData = chatSnap.data() as Chat;
    if (!chatData.participants.includes(senderId)) {
      throw new Error('User is not a participant in this chat');
    }

    // Add message
    const messageRef = doc(messagesRef);
    messageId = messageRef.id;
    tx.set(messageRef, {
      chatId,
      senderId,
      text: text.trim(),
      createdAt: serverTimestamp(),
    });

    // Update chat metadata
    tx.update(chatRef, {
      lastMessage: text.trim().substring(0, 100), // Store first 100 chars
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return messageId!;
}

/**
 * Hook to get real-time messages for a chat
 */
export function useChatMessages(chatId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(!!chatId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    if (!db) {
      console.error('Firestore not initialized - useChatMessages will not attach listeners');
      setError('Firestore not initialized');
      setMessages([]);
      setLoading(false);
      return;
    }

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    try {
      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const messagesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Message[];
          setMessages(messagesData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching messages:', err);
          setError(err.message || String(err));
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Failed to attach messages listener:', err);
      setError(err?.message || String(err));
      setLoading(false);
    }
  }, [chatId]);

  return { messages, loading, error };
}

/**
 * Hook to get all chats for a user
 */
export function useUserChats(userId?: string) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setChats([]);
      setLoading(false);
      return;
    }

    if (!db) {
      console.error('Firestore not initialized - useUserChats will not attach listeners');
      setError('Firestore not initialized');
      setChats([]);
      setLoading(false);
      return;
    }

    const chatsRef = collection(db, 'chats');
    // Query for chats where user is a participant
    // Note: Firestore doesn't support array-contains-any with multiple fields,
    // so we need to query both possible positions
    const q1 = query(chatsRef, where('participants', 'array-contains', userId));
    
    try {
      const unsubscribe = onSnapshot(
        q1,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const chatsData = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Chat))
            .filter(chat => chat.participants.includes(userId))
            .sort((a, b) => {
              // Sort by lastMessageAt descending, or createdAt if no messages
              const aTime = a.lastMessageAt?.toDate?.()?.getTime() || a.createdAt?.toDate?.()?.getTime() || 0;
              const bTime = b.lastMessageAt?.toDate?.()?.getTime() || b.createdAt?.toDate?.()?.getTime() || 0;
              return bTime - aTime;
            });
          setChats(chatsData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('Error fetching chats:', err);
          setError(err.message || String(err));
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Failed to attach chats listener:', err);
      setError(err?.message || String(err));
      setLoading(false);
    }
  }, [userId]);

  return { chats, loading, error };
}

/**
 * Mark a message as read
 */
export async function markAsRead(chatId: string, messageId: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
  await updateDoc(messageRef, {
    readAt: serverTimestamp(),
  });
}

/**
 * Main hook for chat operations
 */
export function useChats(currentUserId?: string) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrGetChat = useCallback(async (otherUserId: string): Promise<string> => {
    if (!currentUserId) {
      throw new Error('User must be authenticated');
    }
    try {
      setError(null);
      return await getOrCreateChat(currentUserId, otherUserId);
    } catch (err: any) {
      setError(err.message || String(err));
      throw err;
    }
  }, [currentUserId]);

  const sendMessageToChat = useCallback(async (chatId: string, text: string): Promise<void> => {
    if (!currentUserId) {
      throw new Error('User must be authenticated');
    }
    try {
      setSending(true);
      setError(null);
      await sendMessage(chatId, currentUserId, text);
    } catch (err: any) {
      setError(err.message || String(err));
      throw err;
    } finally {
      setSending(false);
    }
  }, [currentUserId]);

  return {
    createOrGetChat,
    sendMessageToChat,
    sending,
    error,
  };
}

