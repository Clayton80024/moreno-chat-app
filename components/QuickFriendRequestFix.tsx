"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function QuickFriendRequestFix() {
  const { user } = useAuth();
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkFriendRequests = async () => {
    if (!user) return;
    
    setIsLoading(true);
    console.log('🔍 Quick check for user:', user.email, user.id);
    
    try {
      // Get ALL friend requests (no filters)
      const { data: allRequests, error: allError } = await supabase
        .from('friend_requests')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📨 ALL friend requests:', allRequests);
      console.log('📨 ALL requests error:', allError);

      // Find requests involving this user
      const userRequests = allRequests?.filter(request => 
        request.sender_id === user.id || request.receiver_id === user.id
      ) || [];

      console.log('👤 Requests involving this user:', userRequests);

      // Check each request in detail
      const detailedRequests = userRequests.map(request => ({
        ...request,
        isSender: request.sender_id === user.id,
        isReceiver: request.receiver_id === user.id,
        statusIsPending: request.status === 'pending',
        shouldShowAsReceived: request.receiver_id === user.id && request.status === 'pending',
        shouldShowAsSent: request.sender_id === user.id && request.status === 'pending'
      }));

      console.log('🔍 DETAILED ANALYSIS:', detailedRequests);

      setResults({
        allRequests,
        userRequests,
        detailedRequests,
        user: {
          id: user.id,
          email: user.email
        }
      });

    } catch (error) {
      console.error('🔴 Error:', error);
      setResults({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const fixRequestStatus = async (requestId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'pending' })
        .eq('id', requestId);

      if (error) {
        console.error('🔴 Error fixing status:', error);
        alert('Error fixing status: ' + error.message);
      } else {
        console.log('✅ Fixed request status');
        alert('Request status fixed! Please refresh the page.');
        checkFriendRequests(); // Refresh
      }
    } catch (error) {
      console.error('🔴 Error:', error);
      alert('Error: ' + error.message);
    }
  };

  if (!user) {
    return <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
      <p className="text-yellow-800">Please log in to check friend requests</p>
    </div>;
  }

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quick Friend Request Fix
        </h3>
        <button
          onClick={checkFriendRequests}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : 'Check Requests'}
        </button>
      </div>

      {results && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">User Info</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>Email:</strong> {results.user?.email}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <strong>ID:</strong> {results.user?.id}
            </p>
          </div>

          {results.detailedRequests && results.detailedRequests.length > 0 && (
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Your Friend Requests</h4>
              {results.detailedRequests.map((request: any, index: number) => (
                <div key={request.id} className="mb-4 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>Request ID:</strong> {request.id}</p>
                    <p><strong>Sender ID:</strong> {request.sender_id}</p>
                    <p><strong>Receiver ID:</strong> {request.receiver_id}</p>
                    <p><strong>Status:</strong> {request.status}</p>
                    <p><strong>Message:</strong> {request.message || 'No message'}</p>
                    <p><strong>Created:</strong> {new Date(request.created_at).toLocaleString()}</p>
                  </div>
                  
                  <div className="mt-2 text-sm">
                    <p className={request.isSender ? 'text-green-600' : 'text-gray-500'}>
                      ✓ You are the sender: {request.isSender ? 'YES' : 'NO'}
                    </p>
                    <p className={request.isReceiver ? 'text-green-600' : 'text-gray-500'}>
                      ✓ You are the receiver: {request.isReceiver ? 'YES' : 'NO'}
                    </p>
                    <p className={request.statusIsPending ? 'text-green-600' : 'text-red-600'}>
                      ✓ Status is pending: {request.statusIsPending ? 'YES' : 'NO'}
                    </p>
                    <p className={request.shouldShowAsReceived ? 'text-green-600' : 'text-gray-500'}>
                      ✓ Should show as received: {request.shouldShowAsReceived ? 'YES' : 'NO'}
                    </p>
                    <p className={request.shouldShowAsSent ? 'text-green-600' : 'text-gray-500'}>
                      ✓ Should show as sent: {request.shouldShowAsSent ? 'YES' : 'NO'}
                    </p>
                  </div>

                  {!request.statusIsPending && (
                    <button
                      onClick={() => fixRequestStatus(request.id)}
                      className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Fix Status to 'pending'
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {results.detailedRequests && results.detailedRequests.length === 0 && (
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-600 dark:text-gray-300">No friend requests found for this user.</p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Raw Data</h4>
            <pre className="text-xs text-gray-600 dark:text-gray-300 overflow-auto max-h-96 bg-gray-50 dark:bg-gray-800 p-2 rounded">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
