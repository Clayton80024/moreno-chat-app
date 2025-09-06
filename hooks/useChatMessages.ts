"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ChatsService, Message } from '@/lib/chats';

interface UseChatMessagesProps {
  chatId: string;
  limit?: number;
}

interface UseChatMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  sendMessage: (content: string, replyToId?: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  isSending: boolean;
}

export function useChatMessages({ chatId, limit = 50 }: UseChatMessagesProps): UseChatMessagesReturn {
  const { messages: realtimeMessages, sendMessage: realtimeSendMessage } = useRealtime();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [offset, setOffset] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages for current chat using useMemo to prevent infinite loops
  const messages = useMemo(() => {
    return realtimeMessages.filter(msg => msg.chat_id === chatId);
  }, [realtimeMessages, chatId]);

  // Load initial messages
  useEffect(() => {
    if (!chatId || !user?.id) return;
    
    const loadInitialMessages = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const newMessages = await ChatsService.getChatMessages(
          chatId, 
          user.id, 
          limit, 
          0
        );
        
        // Don't set local messages state, rely on real-time updates
        setOffset(limit);
        setHasMore(newMessages.length === limit);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadInitialMessages();
  }, [chatId, user?.id, limit]);

  const loadMessages = useCallback(async (reset = true) => {
    if (!chatId || !user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const currentOffset = reset ? 0 : offset;
      const newMessages = await ChatsService.getChatMessages(
        chatId, 
        user.id, 
        limit, 
        currentOffset
      );
      
      // Don't set local messages state, rely on real-time updates
      if (reset) {
        setOffset(limit);
      } else {
        setOffset(prev => prev + limit);
      }
      
      setHasMore(newMessages.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [chatId, user?.id, limit, offset]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await loadMessages(false);
  }, [hasMore, loading, loadMessages]);

  const sendMessage = useCallback(async (content: string, replyToId?: string) => {
    if (!content.trim() || !chatId || isSending) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      await realtimeSendMessage(chatId, content, replyToId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [chatId, realtimeSendMessage, isSending]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    
    try {
      await ChatsService.editMessage(messageId, user?.id || '', newContent);
      // Don't update local state, rely on real-time updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit message');
    }
  }, [user]);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await ChatsService.deleteMessage(messageId, user?.id || '');
      // Don't update local state, rely on real-time updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message');
    }
  }, [user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return {
    messages,
    loading,
    error,
    hasMore,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    isSending
  };
}
