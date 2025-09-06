"use client";

import React from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';

interface StatusIndicatorProps {
  userId: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function StatusIndicator({ userId, size = 'md', showText = false }: StatusIndicatorProps) {
  const { onlineFriends } = useRealtime();
  
  const isOnline = onlineFriends.includes(userId);
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`${sizeClasses[size]} rounded-full ${
          isOnline 
            ? 'bg-green-500 border-2 border-white dark:border-gray-800' 
            : 'bg-gray-400 border-2 border-white dark:border-gray-800'
        }`}
      />
      {showText && (
        <span className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </div>
  );
}

interface OnlineFriendsListProps {
  maxDisplay?: number;
}

export function OnlineFriendsList({ maxDisplay = 5 }: OnlineFriendsListProps) {
  const { chats } = useRealtime();
  
  // Get online friends from chats
  const onlineFriends = chats
    .filter(chat => chat.type === 'direct')
    .map(chat => {
      const otherParticipant = chat.participants?.find(p => p.user_id !== chat.created_by);
      return otherParticipant;
    })
    .filter(Boolean)
    .slice(0, maxDisplay);

  if (onlineFriends.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        No friends online
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Online Friends
      </h4>
      <div className="space-y-1">
        {onlineFriends.map((friend) => (
          <div key={friend?.user_id} className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
              {friend?.user_profile?.avatar_url ? (
                <img
                  src={friend.user_profile.avatar_url}
                  alt={friend.user_profile.full_name || friend.user_profile.username || 'Friend'}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {friend?.user_profile?.full_name?.[0] || friend?.user_profile?.username?.[0] || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 dark:text-white truncate">
                {friend?.user_profile?.full_name || friend?.user_profile?.username || 'Unknown'}
              </p>
            </div>
            <StatusIndicator userId={friend?.user_id || ''} size="sm" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const { isConnected, connectionError } = useRealtime();

  if (connectionError) {
    return (
      <div className={`flex items-center space-x-2 text-red-500 ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        <span className="text-sm">Connection Error</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {isConnected ? 'Connected' : 'Connecting...'}
      </span>
    </div>
  );
}
