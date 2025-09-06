"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatsService } from '@/lib/chats';

export function ChatTester() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testChatCreation = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setResult('');
    
    try {
      console.log('🧪 Testing chat creation...');
      
      // Test with the other user ID from the friend request
      const otherUserId = '82b6db52-6370-4320-8ddf-653bd23bf192';
      
      const chat = await ChatsService.createChat(user.id, {
        type: 'direct',
        participant_ids: [otherUserId]
      });
      
      console.log('✅ Chat created successfully:', chat);
      setResult(`✅ Chat created successfully! Chat ID: ${chat.id}. Testing message loading...`);
      
      // Test message loading
      try {
        const messages = await ChatsService.getChatMessages(chat.id, user.id, 10, 0);
        console.log('✅ Messages loaded successfully:', messages.length);
        
        // Test sending a message
        try {
          const testMessage = await ChatsService.sendMessage(chat.id, user.id, 'Hello! This is a test message.', 'text');
          console.log('✅ Test message sent successfully:', testMessage.id);
          setResult(`✅ Chat created, messages loaded (${messages.length}), and test message sent! Chat ID: ${chat.id}`);
        } catch (sendError) {
          console.error('🔴 Error sending test message:', sendError);
          const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown error';
          setResult(`✅ Chat created and messages loaded (${messages.length}), but message sending failed: ${errorMessage}`);
        }
      } catch (messageError) {
        console.error('🔴 Error loading messages:', messageError);
        const errorMessage = messageError instanceof Error ? messageError.message : 'Unknown error';
        setResult(`✅ Chat created but message loading failed: ${errorMessage}`);
      }
      
      // Navigate to the chat
      setTimeout(() => {
        window.location.href = `/chats?chat=${chat.id}`;
      }, 2000);
      
    } catch (error) {
      console.error('🔴 Error creating chat:', error);
      
      if (error instanceof Error && (error.message?.includes('row-level security') || 
          error.message?.includes('policy') ||
          error.message?.includes('permission'))) {
        setResult('❌ RLS Policy Error: Chat creation blocked by database policies. Please run the SQL fix first.');
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setResult('❌ Error creating chat: ' + errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
      <p className="text-yellow-800">Please log in to test chat creation</p>
    </div>;
  }

  return (
    <div className="p-6 bg-purple-100 dark:bg-purple-900 border border-purple-400 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
          🧪 Chat Creation Tester
        </h3>
        <button
          onClick={testChatCreation}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Chat Creation'}
        </button>
      </div>

      <div className="text-sm text-purple-800 dark:text-purple-200 mb-4">
        <p><strong>Purpose:</strong> Test if chat creation works with the fixed parameters.</p>
        <p><strong>Will create:</strong> A direct chat between you and the other user.</p>
        <p><strong>If you get RLS error:</strong> Run the SQL fix in Supabase first.</p>
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
