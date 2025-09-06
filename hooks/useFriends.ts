"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { FriendsService, FriendRequest, SearchUser } from '@/lib/friends';
import { useAuth } from '@/contexts/AuthContext';

interface UseFriendRequestsReturn {
  sentRequests: FriendRequest[];
  receivedRequests: FriendRequest[];
  loading: boolean;
  error: string | null;
  sendFriendRequest: (receiverId: string, message?: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  isProcessing: boolean;
}

export function useFriendRequests(): UseFriendRequestsReturn {
  const { friendRequests, refreshFriendRequests, addOptimisticFriendRequest } = useRealtime();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update local state when real-time data changes
  useEffect(() => {
    // The real-time context already handles loading friend requests
  }, [friendRequests]);

  const sendFriendRequest = useCallback(async (receiverId: string, message?: string) => {
    if (!user || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create optimistic friend request
      const optimisticRequest = {
        id: `temp-${Date.now()}`, // Temporary ID
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending' as const,
        message: message || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        receiver_profile: {
          id: receiverId,
          full_name: null,
          username: null,
          avatar_url: null,
          bio: null,
          is_online: false
        }
      };

      // Add optimistic request to state immediately
      addOptimisticFriendRequest(optimisticRequest);

      // Send the actual request
      await FriendsService.sendFriendRequest(user.id, receiverId, message);
      
      // Refresh to get the real data (this will replace the optimistic request)
      await refreshFriendRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send friend request');
      // The optimistic request will be replaced by the refresh, so no need to manually remove it
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing, refreshFriendRequests, addOptimisticFriendRequest]);

  const acceptRequest = useCallback(async (requestId: string) => {
    if (!user || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await FriendsService.acceptFriendRequest(requestId, user.id);
      await refreshFriendRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept friend request');
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing, refreshFriendRequests]);

  const declineRequest = useCallback(async (requestId: string) => {
    if (!user || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await FriendsService.declineFriendRequest(requestId, user.id);
      await refreshFriendRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline friend request');
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing, refreshFriendRequests]);

  const cancelRequest = useCallback(async (requestId: string) => {
    if (!user || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // For now, we'll decline our own sent request
      await FriendsService.declineFriendRequest(requestId, user.id);
      await refreshFriendRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel friend request');
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing, refreshFriendRequests]);

  return {
    sentRequests: friendRequests.sent,
    receivedRequests: friendRequests.received,
    loading,
    error,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    isProcessing
  };
}

interface UseUserSearchProps {
  query: string;
  limit?: number;
}

interface UseUserSearchReturn {
  users: SearchUser[];
  loading: boolean;
  error: string | null;
  searchUsers: (query: string) => Promise<void>;
}

export function useUserSearch({ query, limit = 20 }: UseUserSearchProps): UseUserSearchReturn {
  const { user } = useAuth();
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!user || !searchQuery.trim()) {
      setUsers([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await FriendsService.searchUsers(searchQuery, user.id, limit);
      setUsers(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search users');
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  // Auto-search when query changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [query, searchUsers]);

  return {
    users,
    loading,
    error,
    searchUsers
  };
}

interface UseFriendsReturn {
  friends: any[]; // Using any for now, will be properly typed
  loading: boolean;
  error: string | null;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isProcessing: boolean;
}

export function useFriends(): UseFriendsReturn {
  const { user } = useAuth();
  const { friends } = useRealtime();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Friends are now loaded via real-time context
  // No need for manual loading

  const removeFriend = useCallback(async (friendId: string) => {
    if (!user || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await FriendsService.removeFriend(user.id, friendId);
      // Note: Friends will be refreshed automatically via real-time updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove friend');
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing]);

  const blockUser = useCallback(async (userId: string) => {
    if (!user || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await FriendsService.blockUser(user.id, userId);
      // Note: Friends will be refreshed automatically via real-time updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block user');
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing]);

  const unblockUser = useCallback(async (userId: string) => {
    if (!user || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      await FriendsService.unblockUser(user.id, userId);
      // Note: Friends will be refreshed automatically via real-time updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock user');
    } finally {
      setIsProcessing(false);
    }
  }, [user, isProcessing]);

  return {
    friends,
    loading,
    error,
    removeFriend,
    blockUser,
    unblockUser,
    isProcessing
  };
}
