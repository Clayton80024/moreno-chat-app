"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FriendsService } from '@/lib/friends';
import { supabase } from '@/lib/supabase';

export function FriendRequestDebugger() {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testFriendRequestsTable = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      addResult('Testing friend_requests table accessibility...');
      
      // Test 1: Basic table access
      const { data, error } = await supabase
        .from('friend_requests')
        .select('id')
        .limit(1);
      
      if (error) {
        addResult(`❌ Table access failed: ${error.message} (Code: ${error.code})`);
        return;
      }
      
      addResult('✅ friend_requests table is accessible');
      
      // Test 2: Check if we can query with user filter
      if (user) {
        addResult(`Testing queries with user ID: ${user.id}`);
        
        const { data: userRequests, error: userError } = await supabase
          .from('friend_requests')
          .select('*')
          .eq('sender_id', user.id)
          .limit(5);
        
        if (userError) {
          addResult(`❌ User-specific query failed: ${userError.message} (Code: ${userError.code})`);
        } else {
          addResult(`✅ User-specific query works. Found ${userRequests?.length || 0} sent requests`);
        }
        
        // Test 3: Check received requests
        const { data: receivedRequests, error: receivedError } = await supabase
          .from('friend_requests')
          .select('*')
          .eq('receiver_id', user.id)
          .limit(5);
        
        if (receivedError) {
          addResult(`❌ Received requests query failed: ${receivedError.message} (Code: ${receivedError.code})`);
        } else {
          addResult(`✅ Received requests query works. Found ${receivedRequests?.length || 0} received requests`);
        }
      }
      
      // Test 4: Test the service method
      addResult('Testing FriendsService.getFriendRequests...');
      try {
        const requests = await FriendsService.getFriendRequests(user?.id || '');
        addResult(`✅ FriendsService.getFriendRequests works. Found ${requests.sent.length} sent, ${requests.received.length} received`);
      } catch (serviceError) {
        addResult(`❌ FriendsService.getFriendRequests failed: ${serviceError instanceof Error ? serviceError.message : 'Unknown error'}`);
      }
      
    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSendFriendRequest = async () => {
    if (!user) {
      addResult('❌ No user logged in');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use a test user ID (you can change this)
      const testReceiverId = '40d5a7da-cd0d-4f2e-a22f-f889e502b16c';
      
      addResult(`Testing sendFriendRequest to user: ${testReceiverId}`);
      
      await FriendsService.sendFriendRequest(user.id, testReceiverId, 'Test friend request from debugger');
      
      addResult('✅ Friend request sent successfully!');
      
      // Wait a moment and check if it appears
      setTimeout(async () => {
        try {
          const requests = await FriendsService.getFriendRequests(user.id);
          addResult(`✅ After sending: Found ${requests.sent.length} sent requests`);
        } catch (error) {
          addResult(`❌ Error checking requests after send: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }, 1000);
      
    } catch (error) {
      addResult(`❌ Send friend request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
        <p className="text-yellow-800">Please log in to test friend requests</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-blue-100 dark:bg-blue-900 border border-blue-400 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          🔧 Friend Request Debugger
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={testFriendRequestsTable}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Table Access'}
          </button>
          <button
            onClick={testSendFriendRequest}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Test Send Request'}
          </button>
        </div>
      </div>

      <div className="text-sm text-blue-800 dark:text-blue-200 mb-4">
        <p><strong>Purpose:</strong> Debug friend request issues and test table accessibility.</p>
        <p><strong>User ID:</strong> {user.id}</p>
      </div>

      {testResults.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-h-60 overflow-y-auto">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Test Results:</h4>
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <p key={index} className={`text-sm font-mono ${
                result.includes('✅') ? 'text-green-600 dark:text-green-400' : 
                result.includes('❌') ? 'text-red-600 dark:text-red-400' : 
                'text-gray-600 dark:text-gray-400'
              }`}>
                {result}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}