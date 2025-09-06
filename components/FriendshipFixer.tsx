"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export function FriendshipFixer() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const fixFriendship = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setResult('');
    
    try {
      console.log('🔧 Fixing friendship for user:', user.email, user.id);
      
      // The friend request shows:
      // sender_id: '82b6db52-6370-4320-8ddf-653bd23bf192' (other user)
      // receiver_id: '941700bd-5410-4e22-8e39-e6f3aa2ae15f' (Jackie)
      // status: 'accepted'
      
      const otherUserId = '82b6db52-6370-4320-8ddf-653bd23bf192';
      const jackieUserId = '941700bd-5410-4e22-8e39-e6f3aa2ae15f';
      
      // First, test if the friends table is accessible
      console.log('🔍 Testing friends table accessibility...');
      const { data: testData, error: testError } = await supabase
        .from('friends')
        .select('id')
        .limit(1);

      if (testError) {
        console.error('🔴 Friends table not accessible:', testError);
        console.error('🔴 Test error details:', {
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint
        });
        setResult('❌ Friends table not accessible. Check RLS policies.');
        return;
      }

      console.log('✅ Friends table is accessible');

      // Check if friendship already exists
      const { data: existingFriendship, error: checkError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', jackieUserId)
        .eq('friend_id', otherUserId)
        .single();

      console.log('🔍 Existing friendship check:', existingFriendship);
      console.log('🔍 Check error:', checkError);

      if (existingFriendship) {
        setResult('✅ Friendship already exists! The issue might be elsewhere.');
        return;
      }

      // Try inserting one friendship at a time to isolate the issue
      console.log('🔍 Creating first friendship entry...');
      const { data: firstInsert, error: firstError } = await supabase
        .from('friends')
        .insert({
          user_id: jackieUserId,
          friend_id: otherUserId,
          status: 'accepted',
          created_at: new Date().toISOString()
        })
        .select();

      if (firstError) {
        console.error('🔴 Error creating first friendship:', firstError);
        console.error('🔴 First error details:', {
          code: firstError.code,
          message: firstError.message,
          details: firstError.details,
          hint: firstError.hint
        });
        console.error('🔴 Full first error object:', JSON.stringify(firstError, null, 2));
        setResult('❌ Error creating first friendship: ' + (firstError.message || 'Unknown error'));
        return;
      }

      console.log('✅ First friendship created:', firstInsert);

      // Try creating the second friendship
      console.log('🔍 Creating second friendship entry...');
      const { data: secondInsert, error: secondError } = await supabase
        .from('friends')
        .insert({
          user_id: otherUserId,
          friend_id: jackieUserId,
          status: 'accepted',
          created_at: new Date().toISOString()
        })
        .select();

      if (secondError) {
        console.error('🔴 Error creating second friendship:', secondError);
        console.error('🔴 Second error details:', {
          code: secondError.code,
          message: secondError.message,
          details: secondError.details,
          hint: secondError.hint
        });
        console.error('🔴 Full second error object:', JSON.stringify(secondError, null, 2));
        console.error('🔴 Second error type:', typeof secondError);
        console.error('🔴 Second error keys:', Object.keys(secondError));
        console.error('🔴 Second error toString:', secondError.toString());
        setResult('❌ Error creating second friendship: ' + (secondError.message || 'Unknown error'));
        return;
      }

      console.log('✅ Second friendship created:', secondInsert);
      setResult('✅ Both friendships created successfully! Please refresh the page to see your friend.');

    } catch (error) {
      console.error('🔴 Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult('❌ Error: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
      <p className="text-yellow-800">Please log in to fix friendship</p>
    </div>;
  }

  return (
    <div className="p-6 bg-green-100 dark:bg-green-900 border border-green-400 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
          🎯 Friendship Fixer
        </h3>
        <button
          onClick={fixFriendship}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Fixing...' : 'Fix Friendship'}
        </button>
      </div>

      <div className="text-sm text-green-800 dark:text-green-200 mb-4">
        <p><strong>Issue Found:</strong> Friend request is 'accepted' but friendship not in friends table.</p>
        <p><strong>Solution:</strong> Create the friendship entries so you can see each other as friends.</p>
      </div>

      {result && (
        <div className={`p-3 rounded-lg ${
          result.includes('✅') ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800'
        }`}>
          <p className={`text-sm ${
            result.includes('✅') ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
          }`}>
            {result}
          </p>
        </div>
      )}
    </div>
  );
}
