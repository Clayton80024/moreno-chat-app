"use client";

import React, { useState } from 'react';
import { Message } from '@/lib/chats';
import { countries } from '@/lib/countries';
import { FriendProfileModal } from './FriendProfileModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { getCountryInfo, needsTranslation } from '@/lib/translation';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  user: any;
  otherUserProfile?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
    is_online: boolean;
    last_seen: string | null;
  };
}

// Helper function to get country flag from country name
const getCountryFlag = (countryName: string | null | undefined): string => {
  if (!countryName) return '';
  const country = countries.find(c => c.name === countryName);
  return country?.flag || '';
};

// Helper function to render message content with friend mentions
const renderMessageContent = (content: string, isOwnMessage: boolean, onMentionClick: (mention: string) => void) => {
  const mentionRegex = /@(\w+)/g;
  const parts = content.split(mentionRegex);
  
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      // This is a mention (odd index)
      return (
        <button
          key={index}
          onClick={() => onMentionClick(part)}
          className={`font-medium cursor-pointer hover:opacity-80 transition-opacity ${
            isOwnMessage 
              ? "text-primary-100 bg-primary-500/20 px-1 rounded" 
              : "text-primary-600 bg-primary-100 dark:bg-primary-900/20 px-1 rounded"
          }`}
        >
          @{part}
        </button>
      );
    }
    return part;
  });
};

const MessageBubble = React.memo(({ message, isOwnMessage, user, otherUserProfile }: MessageBubbleProps) => {
  const { profile } = useAuth();
  const senderProfile = message.sender_profile;
  const messageTime = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedFriendProfile, setSelectedFriendProfile] = useState<any>(null);

  // Translation state - determine receiver based on message direction
  const senderCountry = senderProfile?.location || '';
  // For translation: receiver is the OTHER person (not the current user)
  const receiverCountry = isOwnMessage 
    ? otherUserProfile?.location || '' // For my messages, receiver is the other user
    : profile?.location || ''; // For their messages, receiver is me (using profile, not user_metadata)
  
  // Use translation hook for all messages that need translation
  const { translation, isLoading: isTranslating, error: translationError } = useTranslation(
    message.content,
    senderCountry,
    receiverCountry,
    {
      enabled: needsTranslation(senderCountry, receiverCountry)
    }
  );

  // Get country info for display
  const senderCountryInfo = getCountryInfo(senderCountry);
  const receiverCountryInfo = getCountryInfo(receiverCountry);

  // Handle mention click
  const handleMentionClick = async (mention: string) => {
    try {
      // Search for user by username or full name
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, username, avatar_url, bio, location, is_online, last_seen')
        .or(`username.ilike.%${mention}%,full_name.ilike.%${mention}%`)
        .limit(1);

      if (error) {
        console.error('Error searching for user:', error);
        return;
      }

      if (profiles && profiles.length > 0) {
        setSelectedFriendProfile(profiles[0]);
        setShowProfileModal(true);
      } else {
        console.log('User not found:', mention);
        // Could show a toast notification here
      }
    } catch (error) {
      console.error('Error handling mention click:', error);
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <div className={`
        max-w-[75%] sm:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md
        ${isOwnMessage 
          ? "bg-primary-600 text-black ml-12" 
          : "bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white mr-12"
        }
      `}>
        {!isOwnMessage && senderProfile && (
          <div className={`flex items-center space-x-2 mb-1 ${
            isOwnMessage ? "text-primary-50" : "text-gray-800 dark:text-gray-200"
          }`}>
            <p className="text-xs font-bold">
              {senderProfile.full_name || senderProfile.username || 'Unknown User'}
            </p>
            {(() => {
              const countryFlag = getCountryFlag(senderProfile.location || undefined);
              return countryFlag ? <span className="text-sm" title={senderProfile.location || undefined}>{countryFlag}</span> : null;
            })()}
          </div>
        )}
        {/* Message Content */}
        <div className="space-y-2">
          {/* Original Message */}
          <p className={`text-sm sm:text-base leading-relaxed break-words font-medium ${
            isOwnMessage ? "text-black" : "text-gray-900 dark:text-gray-100"
          }`}>
            {renderMessageContent(message.content, isOwnMessage, handleMentionClick)}
          </p>
          
          {/* Translation (for all messages that need translation) */}
          {translation && translation !== message.content && (
            <div className="relative">
              {/* Translation Loading State */}
              {isTranslating && (
                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Translating...</span>
                </div>
              )}
              
              {/* Translation Content */}
              {translation && !isTranslating && (
                <div className={`rounded-lg p-2 border-l-2 border-primary-500 ${
                  isOwnMessage 
                    ? "bg-primary-500/10" 
                    : "bg-gray-50 dark:bg-gray-600"
                }`}>
                  <p className={`text-sm leading-relaxed break-words ${
                    isOwnMessage 
                      ? "text-primary-100" 
                      : "text-gray-800 dark:text-gray-200"
                  }`}>
                    {renderMessageContent(translation, isOwnMessage, handleMentionClick)}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs flex items-center space-x-1 ${
                      isOwnMessage 
                        ? "text-primary-200" 
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      <span>🌐</span>
                      <span>Translated from {senderCountryInfo?.language || 'Unknown'}</span>
                    </span>
                    {translationError && (
                      <span className="text-xs text-red-500" title={translationError}>
                        ⚠️
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <p className={`
          text-xs text-black font-semibold mt-1.5
          ${isOwnMessage ? "text-primary-100" : "text-gray-600 dark:text-gray-400"}
        `}>
          {messageTime}
        </p>
      </div>
      
      {/* Friend Profile Modal */}
      {selectedFriendProfile && (
        <FriendProfileModal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedFriendProfile(null);
          }}
          friendProfile={selectedFriendProfile}
        />
      )}
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
