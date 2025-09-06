"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { FriendsService } from '@/lib/friends';
import { supabase } from '@/lib/supabase';

export function FriendRequestDebugger() {
  const { user } = useAuth();
  const { friendRequests } = useRealtime();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebugCheck = async () => {
    if (!user) return;
    
    setIsLoading(true);
    console.log('🔍 Starting friend request debug for user:', user.email, user.id);
    
    try {
      // 1. Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('👤 User profile:', profile);
      console.log('👤 Profile error:', profileError);

      // 2. Check friend_requests table accessibility
      const isTableAccessible = await FriendsService.testFriendRequestsTable();
      console.log('📋 Friend requests table accessible:', isTableAccessible);

      // 3. Check for any friend requests involving this user
      const { data: allRequests, error: allRequestsError } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      console.log('📨 All friend requests involving user:', allRequests);
      console.log('📨 All requests error:', allRequestsError);
      
      // 3.5. Let's see the actual content of the friend request
      if (allRequests && allRequests.length > 0) {
        console.log('🔍 DETAILED FRIEND REQUEST DATA:');
        allRequests.forEach((request, index) => {
          console.log(`Request ${index + 1}:`, {
            id: request.id,
            sender_id: request.sender_id,
            receiver_id: request.receiver_id,
            status: request.status,
            message: request.message,
            created_at: request.created_at,
            sender_id_type: typeof request.sender_id,
            receiver_id_type: typeof request.receiver_id,
            sender_id_length: request.sender_id?.length,
            receiver_id_length: request.receiver_id?.length,
            user_id: user.id,
            user_id_type: typeof user.id,
            user_id_length: user.id.length,
            sender_matches_user: request.sender_id === user.id,
            receiver_matches_user: request.receiver_id === user.id,
            sender_id_strict_equals: request.sender_id === user.id,
            receiver_id_strict_equals: request.receiver_id === user.id
          });
        });
      }

      // 4. Check specifically for received requests
      console.log('🔍 Testing received requests query...');
      console.log('🔍 Looking for receiver_id =', user.id, 'status = pending');
      
      const { data: receivedRequests, error: receivedError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('📥 Received requests:', receivedRequests);
      console.log('📥 Received error:', receivedError);
      console.log('📥 Received count:', receivedRequests?.length || 0);

      // 5. Check specifically for sent requests
      console.log('🔍 Testing sent requests query...');
      console.log('🔍 Looking for sender_id =', user.id, 'status = pending');
      
      const { data: sentRequests, error: sentError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('📤 Sent requests:', sentRequests);
      console.log('📤 Sent error:', sentError);
      console.log('📤 Sent count:', sentRequests?.length || 0);
      
      // 5.5. Let's also test without the status filter
      console.log('🔍 Testing received requests WITHOUT status filter...');
      const { data: receivedAllStatus, error: receivedAllStatusError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      console.log('📥 Received requests (all statuses):', receivedAllStatus);
      console.log('📥 Received error (all statuses):', receivedAllStatusError);
      
      console.log('🔍 Testing sent requests WITHOUT status filter...');
      const { data: sentAllStatus, error: sentAllStatusError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      console.log('📤 Sent requests (all statuses):', sentAllStatus);
      console.log('📤 Sent error (all statuses):', sentAllStatusError);

      // 6. Check friends table
      const { data: friends, error: friendsError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      console.log('👥 Friends:', friends);
      console.log('👥 Friends error:', friendsError);

      // 7. Use the service method
      const serviceRequests = await FriendsService.getFriendRequests(user.id);
      console.log('🔧 Service method result:', serviceRequests);

      // 8. Check realtime context data
      console.log('🔄 Realtime context data:', friendRequests);

      setDebugInfo({
        user: {
          id: user.id,
          email: user.email,
          profile: profile,
          profileError: profileError
        },
        tableAccessible: isTableAccessible,
        allRequests: allRequests,
        allRequestsError: allRequestsError,
        receivedRequests: receivedRequests,
        receivedError: receivedError,
        receivedAllStatus: receivedAllStatus,
        receivedAllStatusError: receivedAllStatusError,
        sentRequests: sentRequests,
        sentError: sentError,
        sentAllStatus: sentAllStatus,
        sentAllStatusError: sentAllStatusError,
        friends: friends,
        friendsError: friendsError,
        serviceRequests: serviceRequests,
        realtimeData: friendRequests
      });

    } catch (error) {
      console.error('🔴 Debug error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      runDebugCheck();
    }
  }, [user]);

  if (!user) {
    return <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
      <p className="text-yellow-800">Please log in to debug friend requests</p>
    </div>;
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Friend Request Debugger
        </h3>
        <button
          onClick={runDebugCheck}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : 'Refresh Debug'}
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">User Info</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Email:</strong> {user.email}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>ID:</strong> {user.id}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Realtime Context Data</h4>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <p><strong>Received Requests:</strong> {friendRequests.received.length}</p>
            <p><strong>Sent Requests:</strong> {friendRequests.sent.length}</p>
          </div>
        </div>

        {debugInfo && (
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Debug Results</h4>
            <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto max-h-96 bg-gray-50 dark:bg-gray-800 p-2 rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
