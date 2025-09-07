"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ChatsService, Chat, Message } from '@/lib/chats';
import { FriendsService, FriendRequest } from '@/lib/friends';
import { PresenceService, UserPresence } from '@/lib/presence';

interface RealtimeContextType {
  // Chat real-time features
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  unreadCounts: Record<string, number>;
  
  // Friends real-time features
  friendRequests: {
    sent: FriendRequest[];
    received: FriendRequest[];
  };
  friends: any[]; // Array of accepted friends
  onlineFriends: string[]; // Array of user IDs who are online
  
  // Presence
  userPresence: UserPresence | null;
  
  // Actions
  setCurrentChat: (chat: Chat | null) => void;
  sendMessage: (chatId: string, content: string, replyToId?: string) => Promise<void>;
  markMessagesAsRead: (chatId: string) => Promise<void>;
  refreshChats: () => Promise<void>;
  refreshFriendRequests: () => Promise<void>;
  addOptimisticFriendRequest: (request: any) => void;
  
  // Connection status
  isConnected: boolean;
  connectionError: string | null;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [friendRequests, setFriendRequests] = useState<{
    sent: FriendRequest[];
    received: FriendRequest[];
  }>({ sent: [], received: [] });
  const [friends, setFriends] = useState<any[]>([]);
  const [onlineFriends, setOnlineFriends] = useState<string[]>([]);
  const [userPresence, setUserPresence] = useState<UserPresence | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Channels for different subscriptions
  const [channels, setChannels] = useState<RealtimeChannel[]>([]);

  // Initialize real-time subscriptions when user logs in
  useEffect(() => {
    if (!user) {
      // Clean up subscriptions when user logs out
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
      setChannels([]);
      setChats([]);
      setCurrentChat(null);
      setMessages([]);
      setUnreadCounts({});
      setFriendRequests({ sent: [], received: [] });
      setFriends([]);
      setOnlineFriends([]);
      setUserPresence(null);
      setIsConnected(false);
      return;
    }

    // Add a small delay to ensure proper cleanup
    const timeoutId = setTimeout(() => {
      initializeRealtime();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      // Cleanup on unmount
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user]);

  const initializeRealtime = async () => {
    try {
      setIsConnected(false);
      setConnectionError(null);

      // Load initial data
      await Promise.all([
        loadChats(),
        loadFriendRequests(),
        loadFriends(),
        loadUserPresence()
      ]);

      // Set up subscriptions
      await setupSubscriptions();
      
      setIsConnected(true);
    } catch (error) {
      console.error('🔴 Error initializing realtime:', error);
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect');
    }
  };

  const loadChats = async () => {
    if (!user) return;
    
    try {
      const userChats = await ChatsService.getUserChats(user.id);
      setChats(userChats);
      
      // Calculate unread counts
      const counts: Record<string, number> = {};
      userChats.forEach(chat => {
        counts[chat.id] = chat.unread_count || 0;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error('🔴 Error loading chats:', error);
    }
  };

  const loadFriendRequests = async () => {
    if (!user) return;
    
    try {
      console.log('🔵 Loading friend requests for user:', user.id);
      
      // First test if the table is accessible
      const isTableAccessible = await FriendsService.testFriendRequestsTable();
      if (!isTableAccessible) {
        console.warn('⚠️ friend_requests table is not accessible, skipping friend requests');
        setFriendRequests({ sent: [], received: [] });
        return;
      }

      const requests = await FriendsService.getFriendRequests(user.id);
      console.log('✅ Friend requests loaded:', requests);
      
      // Filter out any requests that are not pending (accepted/declined)
      const filteredRequests = {
        sent: requests.sent.filter(req => req.status === 'pending'),
        received: requests.received.filter(req => req.status === 'pending')
      };
      
      // Deduplicate requests by ID to prevent duplicate keys
      const deduplicatedRequests = {
        sent: filteredRequests.sent.filter((req, index, self) => 
          index === self.findIndex(r => r.id === req.id)
        ),
        received: filteredRequests.received.filter((req, index, self) => 
          index === self.findIndex(r => r.id === req.id)
        )
      };
      
      console.log('✅ Deduplicated friend requests (pending only):', deduplicatedRequests);
      setFriendRequests(deduplicatedRequests);
    } catch (error) {
      console.error('🔴 Error loading friend requests:', error);
      console.error('🔴 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        user: user.id
      });
      // Set empty arrays on error to prevent UI crashes
      setFriendRequests({ sent: [], received: [] });
    }
  };

  const loadFriends = async () => {
    if (!user) return;
    
    try {
      const userFriends = await FriendsService.getFriends(user.id, 'accepted');
      
      // Deduplicate friends by ID to prevent duplicate keys
      const deduplicatedFriends = userFriends.filter((friend, index, self) => 
        index === self.findIndex(f => f.id === friend.id)
      );
      
      setFriends(deduplicatedFriends);
    } catch (error) {
      console.error('🔴 Error loading friends:', error);
      setFriends([]);
    }
  };

  const loadUserPresence = async () => {
    if (!user) return;
    
    try {
      const presence = await PresenceService.getUserStatus(user.id);
      setUserPresence(presence);
      
      // Set user as online
      if (presence?.status !== 'online') {
        await PresenceService.setOnline(user.id);
      }
    } catch (error) {
      console.error('🔴 Error loading user presence:', error);
    }
  };

  const setupSubscriptions = async () => {
    if (!user) return;

    const newChannels: RealtimeChannel[] = [];

    // 1. Messages subscription - listen for new messages in user's chats
    const messagesChannel = supabase
      .channel('user_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=neq.${user.id}` // Only messages from other users
      }, async (payload) => {
        const newMessage = payload.new as Message;
        console.log('🔵 New message from other user:', newMessage);
        
        // Check if user is participant in this chat before processing
        const isParticipant = chats.some(chat => chat.id === newMessage.chat_id);
        if (!isParticipant) {
          console.log('🔵 User not participant in chat, ignoring message');
          return;
        }
        
        // Add message to messages list, replacing optimistic message if it exists
        setMessages(prev => {
          // Remove any optimistic message with same content and sender
          const filteredMessages = prev.filter(msg => 
            !(msg.id.startsWith('temp-') && 
              msg.sender_id === newMessage.sender_id && 
              msg.content === newMessage.content &&
              msg.chat_id === newMessage.chat_id)
          );
          return [...filteredMessages, newMessage];
        });
        
        // Update chat's last message and increment unread count
        setChats(prev => prev.map(chat => {
          if (chat.id === newMessage.chat_id) {
            return {
              ...chat,
              last_message: newMessage,
              last_message_at: newMessage.created_at,
              unread_count: (chat.unread_count || 0) + 1
            };
          }
          return chat;
        }));
        
        // Update unread counts
        setUnreadCounts(prev => ({
          ...prev,
          [newMessage.chat_id]: (prev[newMessage.chat_id] || 0) + 1
        }));
      })
      .subscribe();

    newChannels.push(messagesChannel);

    // 2. Friend requests subscription
    const friendRequestsChannel = supabase
      .channel('friend_requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friend_requests',
        filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
      }, async (payload) => {
        console.log('🔵 Friend request change detected:', payload);
        console.log('🔵 Event type:', payload.eventType);
        console.log('🔵 New data:', payload.new);
        console.log('🔵 Old data:', payload.old);
        
        // Handle different event types
        if (payload.eventType === 'INSERT') {
          console.log('🔵 New friend request created');
        } else if (payload.eventType === 'UPDATE') {
          console.log('🔵 Friend request updated:', payload.new);
          // If status changed to accepted/declined, remove from pending list
          if (payload.new.status !== 'pending') {
            console.log('🔵 Request processed, removing from pending list');
          }
        } else if (payload.eventType === 'DELETE') {
          console.log('🔵 Friend request deleted');
        }
        
        // Always refresh to get the latest state - with a small delay to ensure DB consistency
        console.log('🔵 Refreshing friend requests in 100ms...');
        setTimeout(async () => {
          console.log('🔵 Executing refresh now...');
          await Promise.all([
            loadFriendRequests(),
            loadFriends() // Also refresh friends in case a request was accepted
          ]);
          console.log('🔵 Refresh completed');
        }, 100);
      })
      .subscribe((status) => {
        console.log('🔵 Friend requests channel status:', status);
      });

    newChannels.push(friendRequestsChannel);

    // 3. Friends subscription - for when friendships are created/removed
    const friendsChannel = supabase
      .channel('friends')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friends',
        filter: `user_id.eq.${user.id}`
      }, async () => {
        await Promise.all([
          loadChats(), // Refresh chats as direct chats might be created
          loadFriends() // Refresh friends list
        ]);
      })
      .subscribe();

    newChannels.push(friendsChannel);

    // 4. Presence subscription - listen for friends' online status
    const presenceChannel = supabase
      .channel('friends_presence')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_presence'
      }, async (payload) => {
        const presence = payload.new as UserPresence;
        
        // Update online friends list
        if (presence.status === 'online') {
          setOnlineFriends(prev => [...new Set([...prev, presence.user_id])]);
        } else {
          setOnlineFriends(prev => prev.filter(id => id !== presence.user_id));
        }
      })
      .subscribe();

    newChannels.push(presenceChannel);

    // 5. Chat participants subscription - for group chat changes
    const participantsChannel = supabase
      .channel('chat_participants')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_participants',
        filter: `user_id.eq.${user.id}`
      }, async () => {
        await loadChats();
      })
      .subscribe();

    newChannels.push(participantsChannel);

    setChannels(newChannels);
  };

  // Actions
  const sendMessage = useCallback(async (chatId: string, content: string, replyToId?: string) => {
    if (!user) return;
    
    // Create optimistic message for immediate UI update
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      chat_id: chatId,
      sender_id: user.id,
      content: content.trim(),
      message_type: 'text' as const,
      reply_to_id: replyToId || null,
      edited_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender_profile: {
        id: user.id,
        full_name: user.user_metadata?.full_name || '',
        username: user.user_metadata?.username || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        location: null
      }
    };
    
    // Add optimistic message immediately for instant scroll
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      await ChatsService.sendMessage(chatId, user.id, content, 'text', replyToId);
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      console.error('🔴 Error sending message:', error);
      throw error;
    }
  }, [user]);

  const markMessagesAsRead = useCallback(async (chatId: string) => {
    if (!user) return;
    
    try {
      await ChatsService.markMessagesAsRead(chatId, user.id);
      
      // Update local state
      setUnreadCounts(prev => ({
        ...prev,
        [chatId]: 0
      }));
      
      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, unread_count: 0 }
          : chat
      ));
    } catch (error) {
      console.error('🔴 Error marking messages as read:', error);
    }
  }, [user]);

  const refreshChats = useCallback(async () => {
    await loadChats();
  }, []);

  const refreshFriendRequests = useCallback(async () => {
    await loadFriendRequests();
  }, []);

  const addOptimisticFriendRequest = useCallback((request: any) => {
    setFriendRequests(prev => ({
      ...prev,
      sent: [...prev.sent, request]
    }));
  }, []);

  const loadChatMessages = useCallback(async (chatId: string) => {
    if (!user) return;
    
    try {
      const chatMessages = await ChatsService.getChatMessages(chatId, user.id);
      setMessages(chatMessages);
      
      // Mark messages as read when opening chat
      await markMessagesAsRead(chatId);
    } catch (error) {
      console.error('🔴 Error loading chat messages:', error);
    }
  }, [user, markMessagesAsRead]);

  // Load messages when current chat changes
  useEffect(() => {
    if (currentChat && user) {
      loadChatMessages(currentChat.id);
    } else {
      setMessages([]);
    }
  }, [currentChat, user, loadChatMessages]);

  // Set up presence tracking
  useEffect(() => {
    if (!user) return;

    // Set user as online when component mounts
    PresenceService.setOnline(user.id);

    // Set user as away when page becomes hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        PresenceService.setAway(user.id);
      } else {
        PresenceService.setOnline(user.id);
      }
    };

    // Set user as offline when page unloads
    const handleBeforeUnload = () => {
      PresenceService.setOffline(user.id);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      PresenceService.setOffline(user.id);
    };
  }, [user]);

  const value: RealtimeContextType = {
    chats,
    currentChat,
    messages,
    unreadCounts,
    friendRequests,
    friends,
    onlineFriends,
    userPresence,
    setCurrentChat,
    sendMessage,
    markMessagesAsRead,
    refreshChats,
    refreshFriendRequests,
    addOptimisticFriendRequest,
    isConnected,
    connectionError
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
