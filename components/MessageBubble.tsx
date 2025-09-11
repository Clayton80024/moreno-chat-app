"use client";

import React, { useState } from 'react';
import { Message } from '@/lib/chats';
import { countries } from '@/lib/countries';
import { FriendProfileModal } from './FriendProfileModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useOptimizedTranslation } from "@/hooks/useOptimizedTranslation";
import { getCountryInfo, needsTranslation } from '@/lib/translation';
import { ArrowUturnLeftIcon, PencilIcon } from '@heroicons/react/24/outline';

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
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onContentChange?: () => void;
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

const MessageBubble = React.memo(({ message, isOwnMessage, user, otherUserProfile, onReply, onEdit, onContentChange }: MessageBubbleProps) => {
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
  
  // Use optimized translation hook
  const { translation, isLoading: isTranslating, error: translationError, isCommand, commandResult } = useOptimizedTranslation(
    message.content,
    {
      enabled: true,
      senderCountry,
      receiverCountry
    }
  );

  // Trigger onContentChange when translation loads
  React.useEffect(() => {
    if (translation && !isTranslating && onContentChange) {
      onContentChange();
    }
  }, [translation, isTranslating, onContentChange]);

  // Trigger onContentChange when modal state changes
  React.useEffect(() => {
    if (onContentChange) {
      onContentChange();
    }
  }, [showProfileModal, onContentChange]);

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
      <div className={`group max-w-[75%] sm:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md
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
        
        {/* Reply Preview */}
        {message.reply_to_id && message.reply_to_message && (
          <div className={`mb-2 p-2 rounded-lg border-l-4 ${
            isOwnMessage 
              ? "bg-primary-500/10 border-primary-500" 
              : "bg-gray-100 dark:bg-gray-600 border-gray-400"
          }`}>
            <div className="flex items-center space-x-2 mb-1">
              <ArrowUturnLeftIcon className={`w-3 h-3 ${
                isOwnMessage ? "text-primary-400" : "text-gray-500"
              }`} />
              <span className={`text-xs font-medium ${
                isOwnMessage ? "text-primary-300" : "text-gray-600 dark:text-gray-400"
              }`}>
                Replying to {message.reply_to_message.sender_profile?.full_name || message.reply_to_message.sender_profile?.username || 'Unknown'}
              </span>
            </div>
            <p className={`text-xs truncate ${
              isOwnMessage ? "text-primary-200" : "text-gray-700 dark:text-gray-300"
            }`}>
              {message.reply_to_message.content}
            </p>
          </div>
        )}
        
        {/* Message Content */}
        <div className="space-y-2">
          {/* Command Result */}
          {isCommand && commandResult && (
            <div className={`rounded-lg p-3 border-l-4 border-blue-500 ${
              isOwnMessage 
                ? "bg-blue-500/10" 
                : "bg-blue-50 dark:bg-blue-900/20"
            }`}>
              <div className="flex items-start space-x-2">
                <span className="text-blue-500 text-lg">⚡</span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    isOwnMessage 
                      ? "text-blue-100" 
                      : "text-blue-800 dark:text-blue-200"
                  }`}>
                    Command Result:
                  </p>
                  <pre className={`text-xs mt-1 whitespace-pre-wrap break-words ${
                    isOwnMessage 
                      ? "text-blue-200" 
                      : "text-blue-700 dark:text-blue-300"
                  }`}>
                    {commandResult}
                  </pre>
                </div>
              </div>
            </div>
          )}
          
          {/* Original Message */}
          <p className={`text-sm sm:text-base leading-relaxed break-words font-medium ${
            isOwnMessage ? "text-black" : "text-gray-900 dark:text-gray-100"
          }`}>
            {renderMessageContent(message.content, isOwnMessage, handleMentionClick)}
          </p>
          
          {/* Translation (only for non-command messages) */}
          {!isCommand && translation && translation !== message.content && (
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
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center space-x-2">
            <p className={`
              text-xs text-black font-semibold
              ${isOwnMessage ? "text-primary-100" : "text-gray-600 dark:text-gray-400"}
            `}>
              {messageTime}
            </p>
            {message.edited_at && (
              <span className={`text-xs ${
                isOwnMessage ? "text-primary-200" : "text-gray-500 dark:text-gray-500"
              }`}>
                (edited)
              </span>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Reply Button */}
            <button
              onClick={() => onReply?.(message)}
              className={`p-1 rounded-full hover:bg-opacity-20 transition-colors ${
                isOwnMessage 
                  ? "hover:bg-primary-200 text-primary-200" 
                  : "hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
              }`}
              title="Reply to message"
            >
              <ArrowUturnLeftIcon className="w-4 h-4" />
            </button>
            
            {/* Edit Button (only for own messages) */}
            {isOwnMessage && (
              <button
                onClick={() => onEdit?.(message)}
                className="p-1 rounded-full hover:bg-primary-200 hover:bg-opacity-20 text-primary-200 transition-colors"
                title="Edit message"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
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
