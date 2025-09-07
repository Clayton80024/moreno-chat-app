"use client";

import React from 'react';
import { User } from '@supabase/supabase-js';
import { Chat } from '@/lib/chats';
import { countries } from '@/lib/countries';

interface ChatItemProps {
  chat: Chat;
  user: User | null;
  isSelected: boolean;
  onSelect: (chatId: string) => void;
  onlineFriends: string[];
}

// Helper function to get country flag from country name
const getCountryFlag = (countryName: string | null | undefined): string => {
  if (!countryName) return '';
  const country = countries.find(c => c.name === countryName);
  return country?.flag || '';
};

const ChatItem = React.memo(({ chat, user, isSelected, onSelect, onlineFriends }: ChatItemProps) => {
  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === 'direct') {
      const otherParticipant = chat.participants?.find((p: any) => p.user_id !== user?.id);
      return otherParticipant?.user_profile?.full_name || otherParticipant?.user_profile?.username || 'Unknown User';
    }
    return chat.name || 'Group Chat';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'direct') {
      const otherParticipant = chat.participants?.find((p: any) => p.user_id !== user?.id);
      return otherParticipant?.user_profile?.avatar_url;
    }
    return null;
  };

  const getChatAvatarInitial = (chat: Chat) => {
    if (chat.type === 'direct') {
      const otherParticipant = chat.participants?.find((p: any) => p.user_id !== user?.id);
      return otherParticipant?.user_profile?.full_name?.[0] || otherParticipant?.user_profile?.username?.[0] || '?';
    }
    return chat.name?.[0] || 'G';
  };

  const isChatOnline = (chat: Chat) => {
    if (chat.type === 'direct') {
      const otherParticipant = chat.participants?.find((p: any) => p.user_id !== user?.id);
      return otherParticipant && onlineFriends.includes(otherParticipant.user_id);
    }
    return false;
  };

  const displayName = getChatDisplayName(chat);
  const avatar = getChatAvatar(chat);
  const avatarInitial = getChatAvatarInitial(chat);
  const isOnline = isChatOnline(chat);
  const lastMessageTime = chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div
      onClick={() => onSelect(chat.id)}
      className={`
        flex items-center px-4 py-3.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800
        ${isSelected ? "bg-primary-50 dark:bg-primary-900/20 lg:border-l-4 lg:border-primary-600" : ""}
      `}
    >
      <div className="relative flex-shrink-0">
        {avatar ? (
          <img 
            src={avatar} 
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover shadow-md"
          />
        ) : (
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md">
            {avatarInitial}
          </div>
        )}
        {isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"></div>
        )}
      </div>
      
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <div className="flex items-center space-x-2">
            <p className="text-base font-bold text-gray-900 dark:text-white truncate">{displayName}</p>
            {chat.type === 'direct' && (() => {
              const otherParticipant = chat.participants?.find((p: any) => p.user_id !== user?.id);
              const countryFlag = getCountryFlag(otherParticipant?.user_profile?.location || undefined);
              return countryFlag ? <span className="text-lg" title={otherParticipant?.user_profile?.location || undefined}>{countryFlag}</span> : null;
            })()}
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 ml-2 flex-shrink-0">{lastMessageTime}</span>
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate pr-2">
            {chat.last_message?.content || 'No messages yet'}
          </p>
          {chat.unread_count && chat.unread_count > 0 && (
            <span className="ml-auto bg-primary-600 text-white text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0 shadow-sm min-w-[20px] text-center">
              {chat.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

ChatItem.displayName = 'ChatItem';

export default ChatItem;
