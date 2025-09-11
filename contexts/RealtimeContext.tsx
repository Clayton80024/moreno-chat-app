"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ChatsService, Chat, Message } from '@/lib/chats';
import { FriendsService, FriendRequest } from '@/lib/friends';
import { PresenceService, UserPresence } from '@/lib/presence';
import { TypingService, TypingIndicator } from '@/lib/typing';
import { SimpleTypingService } from '@/lib/typing-simple';

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
  
  // Typing indicators
  typingIndicators: Record<string, TypingIndicator[]>;
  
  // Actions
  setCurrentChat: (chat: Chat | null) => void;
  sendMessage: (chatId: string, content: string, replyToId?: string) => Promise<void>;
  markMessagesAsRead: (chatId: string) => Promise<void>;
  refreshChats: () => Promise<void>;
  refreshFriendRequests: () => Promise<void>;
  refreshOnlineFriends: () => Promise<void>;
  debugPresence: () => void;
  testPresence: () => Promise<void>;
  handleTyping: (chatId: string) => void;
  testTypingIndicator: (chatId: string) => void;
  addOptimisticFriendRequest: (request: any) => void;
  loadChatMessages: (chatId: string) => Promise<void>;
  
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
  const [typingIndicators, setTypingIndicators] = useState<Record<string, TypingIndicator[]>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Channels for different subscriptions
  const [channels, setChannels] = useState<RealtimeChannel[]>([]);
  
  // Ref to track current chats state for real-time callbacks
  const chatsRef = useRef<Chat[]>([]);

  // Initialize real-time subscriptions when user logs in
  useEffect(() => {
    console.log('🔵 Realtime useEffect triggered, user:', user?.id || 'NO USER');
    
    if (!user) {
      console.log('🔵 No user, cleaning up subscriptions...');
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
      setTypingIndicators({});
      setIsConnected(false);
      return;
    }

    // Add a small delay to ensure proper cleanup
    console.log('🔵 Setting timeout to initialize realtime...');
    const timeoutId = setTimeout(() => {
      console.log('🔵 Timeout triggered, calling initializeRealtime...');
      initializeRealtime();
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      // Cleanup on unmount
      console.log('🔵 Cleaning up realtime channels on unmount...');
      channels.forEach((channel, index) => {
        console.log(`🔵 Removing channel ${index}:`, channel.topic);
        supabase.removeChannel(channel);
      });
      // Clear typing indicators when realtime context unmounts
      if (user) {
        SimpleTypingService.clearUserTyping(user.id);
      }
    };
  }, [user]);

  const initializeRealtime = async () => {
    try {
      setIsConnected(false);
      setConnectionError(null);

      // Load initial data in correct order
      console.log('🔵 Initializing realtime...');
      
      // 1. Load friends first (needed for presence filtering)
      await loadFriends();
      
      // 2. Load other data in parallel
      await Promise.all([
        loadChats(),
        loadFriendRequests(),
        loadUserPresence()
      ]);
      
      // 3. Load online friends after friends are loaded
      await loadOnlineFriends();

      // 4. Set up subscriptions (now with friend data available)
      console.log('🔵 Setting up subscriptions...');
      await setupSubscriptions();
      console.log('🔵 Subscriptions setup complete');
      
      setIsConnected(true);
      console.log('✅ Realtime initialization complete');
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
      chatsRef.current = userChats; // Update ref for real-time callbacks
      
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
      console.log('🔵 Loading friends...');
      const userFriends = await FriendsService.getFriends(user.id, 'accepted');
      
      // Deduplicate friends by ID to prevent duplicate keys
      const deduplicatedFriends = userFriends.filter((friend, index, self) => 
        index === self.findIndex(f => f.id === friend.id)
      );
      
      setFriends(deduplicatedFriends);
      console.log('✅ Loaded friends:', deduplicatedFriends.length, 'friends');
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

  const loadOnlineFriends = async () => {
    if (!user) return;
    
    try {
      console.log('🔵 Loading initial online friends...');
      const onlineFriends = await PresenceService.getOnlineFriends(user.id);
      const friendIds = onlineFriends.map(friend => friend.id);
      setOnlineFriends(friendIds);
      console.log('✅ Loaded online friends:', friendIds.length, 'friends online');
    } catch (error) {
      console.error('🔴 Error loading online friends:', error);
      console.log('🔵 Falling back to empty online friends list');
      setOnlineFriends([]);
      
      // Don't throw the error - let the app continue without online friends
      // The real-time subscription will still work for future updates
    }
  };

  const setupSubscriptions = async () => {
    if (!user) {
      console.log('🔵 No user, skipping subscription setup');
      return;
    }

    console.log('🔵 Setting up all subscriptions for user:', user.id);
    const newChannels: RealtimeChannel[] = [];

    // 1. Messages subscription - listen for ALL new messages in user's chats
    const messagesChannel = supabase
      .channel('user_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
        // Remove filter to listen to ALL messages (including own)
      }, async (payload) => {
        const newMessage = payload.new as Message;
        console.log('🔵 New message received:', newMessage);
        
        // Check if user is participant in this chat
        // First try using the ref (faster), then fallback to database query
        const isParticipantFromRef = chatsRef.current.some(chat => chat.id === newMessage.chat_id);
        
        if (!isParticipantFromRef) {
          // Fallback: query database to double-check
          try {
            const { data: participant, error } = await supabase
              .from('chat_participants')
              .select('chat_id')
              .eq('chat_id', newMessage.chat_id)
              .eq('user_id', user.id)
              .single();
            
            if (error || !participant) {
              console.log('🔵 User not participant in chat, ignoring message:', error?.message);
              return;
            }
          } catch (err) {
            console.log('🔵 Error checking participant status, ignoring message:', err);
            return;
          }
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
          // Add new message at the end
          return [...filteredMessages, newMessage];
        });
        
        // If chats array is empty, refresh it to ensure proper state
        setChats(prev => {
          if (prev.length === 0) {
            console.log('🔵 Chats array is empty, refreshing...');
            loadChats(); // Refresh chats asynchronously
          }
          return prev;
        });
        
        // Update chat's last message and increment unread count (only for other users)
        setChats(prev => {
          const updatedChats = prev.map(chat => {
            if (chat.id === newMessage.chat_id) {
              return {
                ...chat,
                last_message: newMessage,
                last_message_at: newMessage.created_at,
                // Only increment unread count for messages from other users
                unread_count: newMessage.sender_id !== user.id 
                  ? (chat.unread_count || 0) + 1 
                  : chat.unread_count || 0
              };
            }
            return chat;
          });
          chatsRef.current = updatedChats; // Keep ref in sync
          return updatedChats;
        });
        
        // Update unread counts (only for other users)
        if (newMessage.sender_id !== user.id) {
          setUnreadCounts(prev => ({
            ...prev,
            [newMessage.chat_id]: (prev[newMessage.chat_id] || 0) + 1
          }));
        }
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
        
        // Handle different event types with direct state updates
        if (payload.eventType === 'INSERT') {
          console.log('🔵 New friend request created - adding to state');
          console.log('🔵 Payload new data:', payload.new);
          console.log('🔵 Current user ID:', user.id);
          console.log('🔵 Sender ID:', payload.new.sender_id);
          console.log('🔵 Receiver ID:', payload.new.receiver_id);
          
          const newRequest = payload.new as FriendRequest;
          
          // Add to appropriate list based on who sent it
          setFriendRequests(prev => {
            console.log('🔵 Current friend requests state:', prev);
            
            if (newRequest.sender_id === user.id) {
              // User sent this request
              console.log('🔵 Adding to SENT requests');
              const updatedSent = [newRequest, ...prev.sent.filter(req => req.id !== newRequest.id)];
              console.log('🔵 Updated sent requests:', updatedSent);
              return {
                ...prev,
                sent: updatedSent
              };
            } else {
              // User received this request
              console.log('🔵 Adding to RECEIVED requests');
              const updatedReceived = [newRequest, ...prev.received.filter(req => req.id !== newRequest.id)];
              console.log('🔵 Updated received requests:', updatedReceived);
              return {
                ...prev,
                received: updatedReceived
              };
            }
          });
          
        } else if (payload.eventType === 'UPDATE') {
          console.log('🔵 Friend request updated:', payload.new);
          const updatedRequest = payload.new as FriendRequest;
          
          // Update the request in state
          setFriendRequests(prev => {
            const updateInList = (requests: FriendRequest[]) => 
              requests.map(req => req.id === updatedRequest.id ? updatedRequest : req);
            
            return {
              sent: updateInList(prev.sent),
              received: updateInList(prev.received)
            };
          });
          
          // If status changed to accepted, refresh friends list
          if (updatedRequest.status === 'accepted') {
            console.log('🔵 Request accepted, refreshing friends list');
            loadFriends();
          }
          
        } else if (payload.eventType === 'DELETE') {
          console.log('🔵 Friend request deleted - removing from state');
          const deletedRequest = payload.old as FriendRequest;
          
          // Remove from both lists
          setFriendRequests(prev => ({
            sent: prev.sent.filter(req => req.id !== deletedRequest.id),
            received: prev.received.filter(req => req.id !== deletedRequest.id)
          }));
        }
      })
      .subscribe((status) => {
        console.log('🔵 Friend requests channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Friend requests channel successfully subscribed');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Friend requests channel error');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Friend requests channel timed out');
        }
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
          loadFriends(), // Refresh friends list
          loadOnlineFriends() // Refresh online friends when friends change
        ]);
      })
      .subscribe();

    newChannels.push(friendsChannel);

    // 4. Presence subscription - listen for friends' online status
    const presenceChannel = supabase
      .channel(`friends_presence_${user.id}`) // Make channel unique per user
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_presence'
      }, async (payload) => {
        const presence = payload.new as UserPresence;
        
        // Validate that this user is actually a friend before updating
        const isFriend = friends.some(friend => friend.friend_id === presence.user_id);
        
        console.log('🔵 Presence update received:', {
          userId: presence.user_id,
          status: presence.status,
          isFriend: isFriend,
          currentFriends: friends.map(f => f.friend_id),
          currentOnlineFriends: onlineFriends
        });
        
        if (isFriend) {
          console.log('🔵 Friend presence update:', presence.user_id, 'status:', presence.status);
          
          // Update online friends list
          if (presence.status === 'online') {
            setOnlineFriends(prev => {
              const updated = [...new Set([...prev, presence.user_id])];
              console.log('✅ Added friend to online list:', presence.user_id, 'Total online:', updated.length);
              return updated;
            });
          } else {
            setOnlineFriends(prev => {
              const updated = prev.filter(id => id !== presence.user_id);
              console.log('✅ Removed friend from online list:', presence.user_id, 'Total online:', updated.length);
              return updated;
            });
          }
        } else {
          console.log('🔵 Ignoring presence update for non-friend:', presence.user_id);
          console.log('🔵 Available friends:', friends.map(f => ({ id: f.friend_id, name: f.friend_profile?.full_name })));
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

    // 6. Typing indicators subscription - SIMPLIFIED
    console.log('🟢 Setting up SIMPLIFIED typing indicators subscription for user:', user.id);
    const typingChannel = supabase
      .channel(`typing_simple_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators'
      }, async (payload) => {
        console.log('🟢 ===== SIMPLE TYPING REAL-TIME EVENT RECEIVED =====');
        console.log('🟢 Event type:', payload.eventType);
        console.log('🟢 Payload:', payload);
        console.log('🔵 ===== TYPING REAL-TIME EVENT RECEIVED =====');
        console.log('🔵 Event type:', payload.eventType);
        console.log('🔵 Raw typing payload received:', payload);
        console.log('🔵 Payload new data:', payload.new);
        console.log('🔵 Payload old data:', payload.old);
        console.log('🔵 =============================================');
        const typingIndicator = payload.new as TypingIndicator;
        
        // Add user profile data manually since RLS blocks the join
        if (typingIndicator && typingIndicator.user_id) {
          // Find the user profile from friends or participants
          let userProfile = null;
          
          // Try to find in friends list
          const friend = friends.find(f => f.friend_id === typingIndicator.user_id);
          if (friend?.friend_profile) {
            userProfile = {
              id: friend.friend_profile.id,
              full_name: friend.friend_profile.full_name,
              username: friend.friend_profile.username,
              avatar_url: friend.friend_profile.avatar_url
            };
          } else {
            // Try to find in current chat participants
            const participant = chatsRef.current
              .find(chat => chat.id === typingIndicator.chat_id)
              ?.participants?.find(p => p.user_id === typingIndicator.user_id);
            
            if (participant?.user_profile) {
              userProfile = {
                id: participant.user_profile.id,
                full_name: participant.user_profile.full_name,
                username: participant.user_profile.username,
                avatar_url: participant.user_profile.avatar_url
              };
            }
          }
          
          // Add the profile to the typing indicator
          typingIndicator.user_profile = userProfile || undefined;
        }
        
        console.log('🔵 Typing indicator received:', typingIndicator);
        console.log('🔵 Current user:', user.id);
        console.log('🔵 Typing user:', typingIndicator.user_id);
        console.log('🔵 Chat ID:', typingIndicator.chat_id);
        console.log('🔵 Is typing:', typingIndicator.is_typing);
        console.log('🔵 Added user profile:', typingIndicator.user_profile);
        
        // Only process typing indicators for chats the user is in
        const isParticipant = chatsRef.current.some(chat => chat.id === typingIndicator.chat_id);
        console.log('🔵 Is participant:', isParticipant);
        console.log('🔵 Available chats:', chatsRef.current.map(c => c.id));
        
        if (!isParticipant) {
          console.log('🔵 User not participant in chat, ignoring typing indicator');
          return;
        }
        
        // Don't show own typing indicators in the UI, but still process for state management
        const isOwnTyping = typingIndicator.user_id === user.id;
        console.log('🔵 Processing typing indicator:', { isOwnTyping, userId: typingIndicator.user_id });
        
        // Skip UI update for own typing indicators but don't return early
        // This allows proper cleanup of own indicators when they expire
        
        setTypingIndicators(prev => {
          const chatId = typingIndicator.chat_id;
          const currentIndicators = prev[chatId] || [];
          
          console.log('🔵 Updating typing indicators state:', {
            chatId,
            currentIndicators: currentIndicators.length,
            isTyping: typingIndicator.is_typing,
            typingUserId: typingIndicator.user_id,
            isOwnTyping
          });
          
          if (typingIndicator.is_typing) {
            // For own typing indicators, don't add to UI state but process for consistency
            if (isOwnTyping) {
              console.log('🔵 Own typing indicator - not adding to UI state');
              return prev; // Don't show own typing
            }
            
            // Add or update typing indicator for other users
            const existingIndex = currentIndicators.findIndex(t => t.user_id === typingIndicator.user_id);
            if (existingIndex >= 0) {
              // Update existing
              const updated = [...currentIndicators];
              updated[existingIndex] = typingIndicator;
              console.log('🔵 Updated existing typing indicator:', updated);
              return { ...prev, [chatId]: updated };
            } else {
              // Add new
              const newIndicators = [...currentIndicators, typingIndicator];
              console.log('🔵 Added new typing indicator:', newIndicators);
              return { ...prev, [chatId]: newIndicators };
            }
          } else {
            // Remove typing indicator (including own)
            const filtered = currentIndicators.filter(t => t.user_id !== typingIndicator.user_id);
            console.log('🔵 Removed typing indicator:', filtered);
            return { ...prev, [chatId]: filtered };
          }
        });
      })
      .subscribe((status) => {
        console.log('🟢 SIMPLE Typing subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('🟢 ✅ Typing indicators subscription is ACTIVE and listening!');
        } else if (status === 'CLOSED') {
          console.log('🟢 ❌ Typing indicators subscription CLOSED!');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('🟢 ❌ Typing indicators subscription ERROR!');
        }
      });

    newChannels.push(typingChannel);

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
    setFriendRequests(prev => {
      // If request status is 'declined', remove it from received requests
      if (request.status === 'declined') {
        return {
          ...prev,
          received: prev.received.filter(req => req.id !== request.id)
        };
      }
      
      // If request status is 'cancelled', remove it from sent requests
      if (request.status === 'cancelled') {
        return {
          ...prev,
          sent: prev.sent.filter(req => req.id !== request.id)
        };
      }
      
      // Otherwise, add to sent requests (for new requests)
      return {
        ...prev,
        sent: [...prev.sent, request]
      };
    });
  }, []);

  const loadChatMessages = useCallback(async (chatId: string) => {
    if (!user) return;
    
    try {
      const chatMessages = await ChatsService.getChatMessages(chatId, user.id);
      // Only set messages for the current chat to avoid conflicts
      setMessages(prev => {
        // Remove messages from other chats and add new ones for current chat
        const otherChatMessages = prev.filter(msg => msg.chat_id !== chatId);
        return [...otherChatMessages, ...chatMessages];
      });
      
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
    }
    // Don't clear messages when no current chat - let useChatMessages handle filtering
  }, [currentChat?.id, user?.id, loadChatMessages]);

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
        // Refresh online friends when page becomes visible again
        // This helps catch any missed real-time updates
        setTimeout(() => {
          loadOnlineFriends();
        }, 1000);
      }
    };

    // Set user as offline when page unloads
    const handleBeforeUnload = () => {
      PresenceService.setOffline(user.id);
    };

    // Periodic refresh of online friends (every 30 seconds)
    // This helps catch any missed real-time updates
    const refreshInterval = setInterval(() => {
      loadOnlineFriends();
    }, 30000);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(refreshInterval);
      PresenceService.setOffline(user.id);
    };
  }, [user]);

  const refreshOnlineFriends = useCallback(async () => {
    if (!user) return;
    console.log('🔵 Refreshing online friends...');
    await loadOnlineFriends();
  }, [user]);

  const debugPresence = useCallback(() => {
    console.log('🔍 DEBUG PRESENCE STATE:', {
      currentUser: user?.id,
      friends: friends.map(f => ({ id: f.friend_id, name: f.friend_profile?.full_name })),
      onlineFriends: onlineFriends,
      userPresence: userPresence,
      isConnected: isConnected,
      connectionError: connectionError
    });
  }, [user, friends, onlineFriends, userPresence, isConnected, connectionError]);

  const testPresence = useCallback(async () => {
    if (!user) return;
    console.log('🧪 TESTING PRESENCE SYSTEM...');
    
    // 1. Check current state
    debugPresence();
    
    // 2. Force refresh online friends
    console.log('🔄 Refreshing online friends...');
    await loadOnlineFriends();
    
    // 3. Update own presence
    console.log('🔄 Updating own presence...');
    await PresenceService.setOnline(user.id);
    
    // 4. Check state again
    setTimeout(() => {
      console.log('🔍 FINAL STATE:');
      debugPresence();
    }, 2000);
  }, [user, debugPresence, loadOnlineFriends]);

  const handleTyping = useCallback((chatId: string) => {
    if (!user) return;
    SimpleTypingService.handleTyping(user.id, chatId);
  }, [user]);

  // Cleanup typing indicators when user leaves
  useEffect(() => {
    if (!user) return;

    return () => {
      // Clear all typing indicators when component unmounts
      SimpleTypingService.clearUserTyping(user.id);
    };
  }, [user]);

  // Global cleanup when user logs out
  useEffect(() => {
    if (!user) {
      console.log('🟢 User logged out, clearing all simple typing data...');
      // Clear all typing service data when user logs out
      SimpleTypingService.clearAll();
      // Clear local typing indicators state
      setTypingIndicators({});
    }
  }, [user]);

  // Test typing indicator function
  const testTypingIndicator = useCallback((chatId: string) => {
    console.log('🧪 Testing typing indicator for chat:', chatId);
    const testTypingUsers = [
      { id: 'test-user', full_name: 'Test User', username: 'testuser', avatar_url: null }
    ];
    
    // Temporarily add test typing indicator
    setTypingIndicators(prev => ({
      ...prev,
      [chatId]: testTypingUsers.map(u => ({
        id: 'test-' + Date.now(),
        user_id: u.id,
        chat_id: chatId,
        is_typing: true,
        timestamp: new Date().toISOString(),
        user_profile: u
      }))
    }));
    
    // Remove after 3 seconds
    setTimeout(() => {
      setTypingIndicators(prev => ({
        ...prev,
        [chatId]: []
      }));
    }, 3000);
  }, []);

  // Expose debug functions globally for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugPresence = debugPresence;
      (window as any).testPresence = testPresence;
      (window as any).refreshOnlineFriends = refreshOnlineFriends;
      (window as any).testTyping = (chatId: string) => {
        console.log('🧪 Testing typing for chat:', chatId);
        handleTyping(chatId);
      };
      (window as any).testTypingIndicator = testTypingIndicator;
      (window as any).typingIndicators = typingIndicators;
      
      // Simple typing test function
      (window as any).testTypingSimple = async (chatId: string) => {
        console.log('🧪 Simple Typing Test for chat:', chatId);
        console.log('🔍 Current typing indicators:', typingIndicators);
        console.log('🔍 Current user:', user?.id);
        
        // Test database directly
        try {
          const { data, error } = await supabase
            .from('typing_indicators')
            .select('*')
            .eq('chat_id', chatId);
          
          console.log('🔍 Database typing indicators:', data);
          if (error) console.error('🔍 Database error:', error);
        } catch (err) {
          console.error('🔍 Database test error:', err);
        }
        
        // Test subscription status
        console.log('🔍 Active channels:', channels.length);
        channels.forEach((channel, index) => {
          console.log(`🔍 Channel ${index}:`, channel.topic);
        });
      };

      // Add reset function for debugging
      (window as any).resetTyping = (chatId: string) => {
        if (user) {
          console.log('🔧 Resetting typing state from global function');
          TypingService.resetTypingState(user.id, chatId);
          // Also clear React state
          setTypingIndicators({});
        }
      };

      // Add function to check database directly
      (window as any).checkTypingInDB = async (chatId: string) => {
        try {
          const { data, error } = await supabase
            .from('typing_indicators')
            .select('*')
            .eq('chat_id', chatId);
          
          console.log('🔍 TYPING INDICATORS IN DATABASE:', data);
          if (error) {
            console.error('🔍 Database query error:', error);
          }
        } catch (err) {
          console.error('🔍 Database check error:', err);
        }
      };
    }
  }, [debugPresence, testPresence, refreshOnlineFriends, handleTyping, testTypingIndicator, typingIndicators, user, channels]);

  const value: RealtimeContextType = {
    chats,
    currentChat,
    messages,
    unreadCounts,
    friendRequests,
    friends,
    onlineFriends,
    userPresence,
    typingIndicators,
    setCurrentChat,
    sendMessage,
    markMessagesAsRead,
    refreshChats,
    refreshFriendRequests,
    refreshOnlineFriends,
    debugPresence,
    testPresence,
    handleTyping,
    testTypingIndicator,
    addOptimisticFriendRequest,
    loadChatMessages,
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
