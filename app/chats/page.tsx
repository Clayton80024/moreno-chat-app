"use client";

import { useState, useEffect, useRef } from "react";
import {
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { useRealtime } from "@/contexts/RealtimeContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useAuth } from "@/contexts/AuthContext";
import { StatusIndicator } from "@/components/StatusIndicator";
import { ChatsService } from "@/lib/chats";
import { countries, Country } from "@/lib/countries";

export default function ChatsPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [emojiSuggestions, setEmojiSuggestions] = useState<string[]>([]);
  const [showEmojiSuggestions, setShowEmojiSuggestions] = useState(false);
  const [emojiCursorPosition, setEmojiCursorPosition] = useState(0);
  
  const { chats, setCurrentChat, sendMessage, markMessagesAsRead, onlineFriends } = useRealtime();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Emoji suggestions database
  const emojiDatabase: { [key: string]: string[] } = {
    food: ['🍕', '🍔', '🍜', '🥘', '🍛', '🌮', '🍱', '🍝', '🍲', '🥗'],
    happy: ['😊', '😄', '🎉', '👏', '🥳', '✨', '💫', '😃', '🙂', '😁'],
    love: ['❤️', '💕', '😍', '🥰', '💖', '💝', '🌹', '💘', '💗', '😘'],
    travel: ['✈️', '🌍', '🗺️', '🏔️', '🏖️', '🚗', '🎒', '🏕️', '🚁', '🚂'],
    work: ['💼', '📊', '💻', '📈', '⚙️', '📝', '✏️', '📋', '📌', '🔧'],
    sports: ['⚽', '🏀', '🏈', '🎾', '⛳', '🏃‍♀️', '🚴', '🏊', '🏋️', '🎯'],
    music: ['🎵', '🎶', '🎸', '🎤', '🎧', '🎹', '🎺', '🎻', '🥁', '🎼'],
    nature: ['🌳', '🌸', '🌺', '🏞️', '⛰️', '🌊', '☀️', '🌙', '⭐', '🌿'],
    party: ['🎉', '🍾', '🥂', '🎊', '🪩', '💃', '🕺', '🎈', '🎁', '🎪'],
    coffee: ['☕', '🍵', '☕️', '🥤', '🧊', '🍯', '🥛', '🍰', '🧁', '🍪']
  };

  // Get messages for selected chat
  const { 
    messages, 
    loading: messagesLoading, 
    error: messagesError, 
    sendMessage: sendChatMessage, 
    isSending 
  } = useChatMessages({ 
    chatId: selectedChatId || '', 
    limit: 50 
  });

  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  const handleSendMessage = async () => {
    if (messageInput.trim() && selectedChatId && !isSending) {
      try {
        await sendChatMessage(messageInput.trim());
        setMessageInput("");
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleChatSelect = async (chatId: string) => {
    setSelectedChatId(chatId);
    
    // Set current chat in realtime context
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      // Mark messages as read
      await markMessagesAsRead(chatId);
      
      // Scroll to bottom when switching chats
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle emoji suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    
    // Check for hashtag patterns
    const hashtagMatch = value.match(/#(\w+)$/);
    if (hashtagMatch) {
      const hashtag = hashtagMatch[1].toLowerCase();
      if (emojiDatabase[hashtag]) {
        setEmojiSuggestions(emojiDatabase[hashtag]);
        setShowEmojiSuggestions(true);
        setEmojiCursorPosition(value.lastIndexOf('#'));
      } else {
        setShowEmojiSuggestions(false);
      }
    } else {
      setShowEmojiSuggestions(false);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    const beforeHashtag = messageInput.substring(0, emojiCursorPosition);
    const afterHashtag = messageInput.substring(messageInput.lastIndexOf('#') + 1);
    const newMessage = beforeHashtag + emoji + ' ' + afterHashtag;
    setMessageInput(newMessage);
    setShowEmojiSuggestions(false);
  };

  const getChatDisplayName = (chat: any) => {
    if (chat.type === 'direct') {
      const otherParticipant = chat.participants?.find((p: any) => p.user_id !== user?.id);
      return otherParticipant?.user_profile?.full_name || otherParticipant?.user_profile?.username || 'Unknown User';
    }
    return chat.name || 'Group Chat';
  };

  const getChatAvatar = (chat: any) => {
    if (chat.type === 'direct') {
      const otherParticipant = chat.participants?.find((p: any) => p.user_id !== user?.id);
      return otherParticipant?.user_profile?.avatar_url;
    }
    return null;
  };

  const getChatAvatarInitial = (chat: any) => {
    if (chat.type === 'direct') {
      const otherParticipant = chat.participants?.find((p: any) => p.user_id !== user?.id);
      return otherParticipant?.user_profile?.full_name?.[0] || otherParticipant?.user_profile?.username?.[0] || '?';
    }
    return chat.name?.[0] || 'G';
  };

  const isChatOnline = (chat: any) => {
    if (chat.type === 'direct') {
      const otherParticipant = chat.participants?.find((p: any) => p.user_id !== user?.id);
      return otherParticipant && onlineFriends.includes(otherParticipant.user_id);
    }
    return false;
  };

  // Helper function to get country flag from country name
  const getCountryFlag = (countryName: string | null | undefined): string => {
    if (!countryName) return '';
    const country = countries.find(c => c.name === countryName);
    console.log('🔍 Debug flag lookup:', { countryName, found: !!country, flag: country?.flag });
    return country?.flag || '';
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const displayName = getChatDisplayName(chat).toLowerCase();
    const lastMessage = chat.last_message?.content?.toLowerCase() || '';
    return displayName.includes(searchQuery.toLowerCase()) || lastMessage.includes(searchQuery.toLowerCase());
  });

  const totalUnreadCount = chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    setShowScrollButton(false);
  };

  // Handle scroll events to show/hide scroll-to-bottom button
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };

  // Auto-scroll to bottom when new messages arrive or chat changes
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages, selectedChatId]);

  return (
    <div className="flex h-full relative bg-gray-50 dark:bg-gray-900">
      {/* Chat List - Desktop always visible, Mobile conditional */}
      <div className={`
        ${selectedChatId ? 'hidden lg:flex' : 'flex'}
        w-full lg:w-80 xl:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col
        absolute lg:relative h-full z-30
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center flex-1">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent text-2xl lg:text-xl">Moreno</span>
                  <span className="hidden lg:inline text-gray-400 mx-2">•</span>
                  <span className="hidden lg:inline text-gray-900 dark:text-white">Messages</span>
                </h2>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 lg:hidden">Messages</p>
              </div>
            </div>
            {totalUnreadCount > 0 && (
              <span className="text-sm font-bold text-primary-700 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/20 px-3 py-1.5 rounded-full border border-primary-200 dark:border-primary-800">
                {totalUnreadCount} new
              </span>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-all font-medium text-gray-900 dark:text-white"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 bg-gray-50 dark:bg-gray-900">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <UserGroupIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No conversations yet</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Start a conversation with your friends to see messages here
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const displayName = getChatDisplayName(chat);
              const avatar = getChatAvatar(chat);
              const avatarInitial = getChatAvatarInitial(chat);
              const isOnline = isChatOnline(chat);
              const lastMessageTime = chat.last_message_at ? new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              
              return (
                <div
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  className={`
                    flex items-center px-4 py-3.5 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-800
                    ${selectedChatId === chat.id ? "bg-primary-50 dark:bg-primary-900/20 lg:border-l-4 lg:border-primary-600" : ""}
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
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-2 flex-shrink-0">{lastMessageTime}</span>
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
            })
          )}
        </div>
      </div>

      {/* Chat Area - Mobile full screen when selected */}
      {selectedChatId ? (
        <div className={`
          flex-1 flex flex-col bg-white dark:bg-gray-800
          ${selectedChatId ? 'flex' : 'hidden lg:flex'}
          absolute lg:relative w-full h-full z-30
        `}>
          {/* Chat Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm">
            <div className="flex items-center flex-1">
              {/* Mobile Back Button */}
              <button
                onClick={() => {
                  setSelectedChatId(null);
                  setCurrentChat(null);
                }}
                className="lg:hidden mr-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 font-bold" />
              </button>
              
              <div className="relative flex-shrink-0">
                {getChatAvatar(selectedChat) ? (
                  <img 
                    src={getChatAvatar(selectedChat)} 
                    alt={getChatDisplayName(selectedChat)}
                    className="w-11 h-11 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md">
                    {getChatAvatarInitial(selectedChat)}
                  </div>
                )}
                {isChatOnline(selectedChat) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"></div>
                )}
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                    {getChatDisplayName(selectedChat)}
                  </h3>
                  {selectedChat?.type === 'direct' && (() => {
                    const otherParticipant = selectedChat.participants?.find((p: any) => p.user_id !== user?.id);
                    const countryFlag = getCountryFlag(otherParticipant?.user_profile?.location || undefined);
                    return countryFlag ? <span className="text-lg" title={otherParticipant?.user_profile?.location || undefined}>{countryFlag}</span> : null;
                  })()}
                </div>
                <div className="flex items-center space-x-2">
                  <StatusIndicator userId={selectedChat?.participants?.find((p: any) => p.user_id !== user?.id)?.user_id || ''} size="sm" showText={true} />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button className="p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />
              </button>
              <button className="p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <VideoCameraIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />
              </button>
              <button className="hidden sm:block p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
              <button className="p-2 sm:p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <EllipsisVerticalIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative"
          >
            {messagesLoading ? (
              <div className="flex justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : messagesError ? (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">{messagesError}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No messages yet</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Start the conversation by sending a message
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((message) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  const senderProfile = message.sender_profile;
                  const messageTime = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`
                        max-w-[75%] sm:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md
                        ${isOwnMessage 
                          ? "bg-primary-600 text-white ml-12" 
                          : "bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white mr-12"
                        }
                      `}>
                        {!isOwnMessage && senderProfile && (
                          <div className={`flex items-center space-x-2 mb-1 ${
                            isOwnMessage ? "text-primary-100" : "text-gray-800 dark:text-gray-200"
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
                        <p className={`text-sm sm:text-base leading-relaxed break-words font-medium ${
                          isOwnMessage ? "text-black" : "text-gray-900 dark:text-gray-100"
                        }`}>
                          {message.content}
                        </p>
                        <p className={`
                          text-xs font-semibold mt-1.5
                          ${isOwnMessage ? "text-primary-200" : "text-gray-600 dark:text-gray-400"}
                        `}>
                          {messageTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
            
            {/* Scroll to Bottom Button */}
            {showScrollButton && (
              <button
                onClick={scrollToBottom}
                className="fixed bottom-20 right-6 z-40 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-105"
                aria-label="Scroll to bottom"
              >
                <ChevronDownIcon className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Message Input - Fixed to Bottom */}
          <div className="fixed bottom-0 left-0 right-0 px-3 sm:px-4 py-3 sm:py-4 border-t-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-30">
            <div className="flex items-center space-x-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={isSending}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 focus:border-primary-500 transition-all text-sm sm:text-base font-medium text-gray-900 dark:text-white disabled:opacity-50"
                />
                
                {/* Emoji Suggestions Dropdown */}
                {showEmojiSuggestions && emojiSuggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3">
                    <div className="flex flex-wrap gap-2">
                      {emojiSuggestions.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                          title={`Insert ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || isSending}
                className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 active:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl border-2 border-primary-700 flex-shrink-0 opacity-100"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <PaperAirplaneIcon className="w-5 h-5 text-white font-bold opacity-100" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state for desktop when no chat selected */
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="w-28 h-28 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md">
              <ChatBubbleLeftRightIcon className="w-14 h-14 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a conversation</h3>
            <p className="text-base font-medium text-gray-600 dark:text-gray-400">Choose a chat from the list to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}