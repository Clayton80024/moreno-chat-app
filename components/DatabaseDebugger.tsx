"use client";

import { useState } from 'react';
import { FriendsService } from '@/lib/friends';
import { useAuth } from '@/contexts/AuthContext';

export function DatabaseDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const runDebugTest = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🔵 Running database debug test...');
      
      // Test 1: Check if friend_requests table is accessible
      const tableAccessible = await FriendsService.testFriendRequestsTable();
      
      // Test 2: Try to get friend requests
      const friendRequests = await FriendsService.getFriendRequests(user.id);
      
      // Test 3: Try to get friends
      const friends = await FriendsService.getFriends(user.id);
      
      const debugData = {
        userId: user.id,
        tableAccessible,
        friendRequests,
        friends: friends.length,
        timestamp: new Date().toISOString()
      };
      
      setDebugInfo(debugData);
      console.log('🔵 Debug test completed:', debugData);
    } catch (error) {
      console.error('🔴 Debug test failed:', error);
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">Please log in to run debug test</div>;
  }

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Database Debugger</h3>
      
      <button
        onClick={runDebugTest}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Debug Test'}
      </button>
      
      {debugInfo && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg">
          <h4 className="font-semibold mb-2">Debug Results:</h4>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
