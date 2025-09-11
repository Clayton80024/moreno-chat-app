"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { useFriends } from "@/hooks/useFriends";
import { StatusIndicator } from "@/components/StatusIndicator";
import { ChatsService, Message } from "@/lib/chats";
import { countries, Country } from "@/lib/countries";
import ChatItem from "@/components/ChatItem";
import MessageBubble from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";


export default function ChatsPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [emojiSuggestions, setEmojiSuggestions] = useState<string[]>([]);
  const [showEmojiSuggestions, setShowEmojiSuggestions] = useState(false);
  const [emojiCursorPosition, setEmojiCursorPosition] = useState(0);
  
  // Reply and Edit state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  
  // Friend suggestion state
  const [friendSuggestions, setFriendSuggestions] = useState<any[]>([]);
  const [showFriendSuggestions, setShowFriendSuggestions] = useState(false);
  const [friendCursorPosition, setFriendCursorPosition] = useState(0);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [selectedFriendIndex, setSelectedFriendIndex] = useState(0);
  
  
  const { chats, setCurrentChat, sendMessage, markMessagesAsRead, onlineFriends, typingIndicators, handleTyping } = useRealtime();
  const { user } = useAuth();
  const { friends } = useFriends();
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
    editMessage,
    isSending 
  } = useChatMessages({ 
    chatId: selectedChatId || '', 
    limit: 50 
  });

  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  const handleSendMessage = useCallback(async () => {
    if (messageInput.trim() && selectedChatId && !isSending) {
      try {
        if (editingMessage) {
          // Edit existing message
          await editMessage(editingMessage.id, messageInput.trim());
          setEditingMessage(null);
        } else {
          // Send new message (with reply if replying)
          await sendChatMessage(messageInput.trim(), replyingTo?.id);
          setReplyingTo(null);
        }
        setMessageInput("");
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }, [messageInput, selectedChatId, isSending, sendChatMessage, editingMessage, replyingTo]);

  // Reply handler
  const handleReply = useCallback((message: Message) => {
    setReplyingTo(message);
    setEditingMessage(null);
    setMessageInput("");
  }, []);

  // Edit handler
  const handleEdit = useCallback((message: Message) => {
    setEditingMessage(message);
    setReplyingTo(null);
    setMessageInput(message.content);
  }, []);

  // Cancel reply/edit
  const handleCancelReplyEdit = useCallback(() => {
    setReplyingTo(null);
    setEditingMessage(null);
    setMessageInput("");
  }, []);

  const handleChatSelect = useCallback(async (chatId: string) => {
    setSelectedChatId(chatId);
    
    // Set current chat in realtime context
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
      // Mark messages as read
      await markMessagesAsRead(chatId);
      
      // Enhanced scroll to bottom when switching chats
      setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      // Additional scroll after messages load
      setTimeout(() => {
        scrollToBottom();
      }, 300);
    }
  }, [chats, setCurrentChat, markMessagesAsRead]);

  // Handle friend selection
  const handleFriendSelect = useCallback((friend: any) => {
    const friendName = friend.friend_profile?.username || friend.friend_profile?.full_name || 'Unknown';
    
    // Find the start of @friends pattern (with or without search query)
    const friendsPatternStart = messageInput.lastIndexOf('@friends');
    const beforeTrigger = messageInput.substring(0, friendsPatternStart);
    const afterTrigger = messageInput.substring(messageInput.lastIndexOf('@') + 8); // "@friends" = 8 characters
    
    // If there was a search query, we need to remove it from the afterTrigger
    let cleanAfterTrigger = afterTrigger;
    if (friendSearchQuery) {
      // Remove the search query part (everything after the first slash)
      const slashIndex = afterTrigger.indexOf('/');
      if (slashIndex !== -1) {
        cleanAfterTrigger = afterTrigger.substring(slashIndex + 1 + friendSearchQuery.length);
      }
    }
    
    const newMessage = beforeTrigger + `@${friendName} ` + cleanAfterTrigger;
    setMessageInput(newMessage);
    setShowFriendSuggestions(false);
    setFriendSearchQuery("");
  }, [messageInput, friendCursorPosition, friendSearchQuery]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      
      // If friend suggestions are open, select the highlighted friend
      if (showFriendSuggestions && friendSuggestions.length > 0) {
        const selectedFriend = friendSuggestions[selectedFriendIndex];
        if (selectedFriend) {
          handleFriendSelect(selectedFriend);
          return;
        }
      }
      
      // Otherwise send the message
      handleSendMessage();
    } else if (e.key === 'ArrowDown' && showFriendSuggestions && friendSuggestions.length > 0) {
      e.preventDefault();
      setSelectedFriendIndex(prev => 
        prev < friendSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp' && showFriendSuggestions && friendSuggestions.length > 0) {
      e.preventDefault();
      setSelectedFriendIndex(prev => 
        prev > 0 ? prev - 1 : friendSuggestions.length - 1
      );
    } else if (e.key === 'Escape' && showFriendSuggestions) {
      e.preventDefault();
      setShowFriendSuggestions(false);
      setFriendSearchQuery("");
    }
  }, [handleSendMessage, showFriendSuggestions, friendSuggestions, selectedFriendIndex, handleFriendSelect]);

  // Handle emoji suggestions and friend suggestions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    
    // Handle typing indicator
    if (selectedChatId) {
      handleTyping(selectedChatId);
    }
    
    // Check for hashtag patterns (emojis)
    const hashtagMatch = value.match(/#(\w+)$/);
    if (hashtagMatch) {
      const hashtag = hashtagMatch[1].toLowerCase();
      if (emojiDatabase[hashtag]) {
        setEmojiSuggestions(emojiDatabase[hashtag]);
        setShowEmojiSuggestions(true);
        setEmojiCursorPosition(value.lastIndexOf('#'));
        // Hide friend suggestions when showing emoji suggestions
        setShowFriendSuggestions(false);
      } else {
        setShowEmojiSuggestions(false);
      }
    } else {
      setShowEmojiSuggestions(false);
    }
    
    // Check for friend sharing patterns
    const friendMatch = value.match(/@friends(\/(.*))?$/);
    
    if (friendMatch && friends && friends.length > 0) {
      const searchQuery = friendMatch[2] || ""; // Get the part after @friends/
      setFriendSearchQuery(searchQuery);
      
      // Filter friends based on search query
      let filteredFriends = friends;
      if (searchQuery) {
        filteredFriends = friends.filter(friend => {
          const fullName = friend.friend_profile?.full_name?.toLowerCase() || "";
          const username = friend.friend_profile?.username?.toLowerCase() || "";
          const query = searchQuery.toLowerCase();
          
          // Support multiple search terms (space-separated)
          const searchTerms = query.split(' ').filter(term => term.length > 0);
          
          return searchTerms.every(term => 
            fullName.includes(term) || username.includes(term)
          );
        });
        
        // Sort results by relevance (exact matches first, then partial matches)
        filteredFriends.sort((a, b) => {
          const aName = (a.friend_profile?.full_name || a.friend_profile?.username || "").toLowerCase();
          const bName = (b.friend_profile?.full_name || b.friend_profile?.username || "").toLowerCase();
          
          const aStartsWith = aName.startsWith(searchQuery);
          const bStartsWith = bName.startsWith(searchQuery);
          
          if (aStartsWith && !bStartsWith) return -1;
          if (!aStartsWith && bStartsWith) return 1;
          
          return aName.localeCompare(bName);
        });
      }
      
      setFriendSuggestions(filteredFriends);
      setShowFriendSuggestions(true);
      setFriendCursorPosition(value.lastIndexOf('@'));
      setSelectedFriendIndex(0); // Reset selection when list changes
      // Hide emoji suggestions when showing friend suggestions
      setShowEmojiSuggestions(false);
    } else {
      setShowFriendSuggestions(false);
      setFriendSearchQuery("");
    }
  }, [emojiDatabase, friends]);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji: string) => {
    const beforeHashtag = messageInput.substring(0, emojiCursorPosition);
    const afterHashtag = messageInput.substring(messageInput.lastIndexOf('#') + 1);
    const newMessage = beforeHashtag + emoji + ' ' + afterHashtag;
    setMessageInput(newMessage);
    setShowEmojiSuggestions(false);
  }, [messageInput, emojiCursorPosition]);

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

  const filteredChats = useMemo(() => {
    return chats.filter(chat => {
      if (!searchQuery) return true;
      const displayName = getChatDisplayName(chat).toLowerCase();
      const lastMessage = chat.last_message?.content?.toLowerCase() || '';
      return displayName.includes(searchQuery.toLowerCase()) || lastMessage.includes(searchQuery.toLowerCase());
    });
  }, [chats, searchQuery]);

  const totalUnreadCount = useMemo(() => {
    return chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
  }, [chats]);

  // Scroll to bottom function - enhanced for reliability
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      // Use smooth scrolling if near bottom, instant if far from bottom
      const currentScroll = container.scrollTop;
      const isNearBottom = maxScroll - currentScroll < 100;
      
      if (isNearBottom) {
        container.scrollTo({
          top: maxScroll,
          behavior: 'smooth'
        });
      } else {
        container.scrollTop = maxScroll;
      }
      
      setShowScrollButton(false);
    }
  }, []);

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
    if (messages.length > 0) {
      // Use multiple timing strategies for reliable scrolling
      const scrollImmediately = () => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      };
      
      // Immediate scroll
      scrollImmediately();
      
      // Additional scroll after DOM updates
      requestAnimationFrame(() => {
        scrollImmediately();
      });
      
      // Final scroll after a small delay
      setTimeout(() => {
        scrollImmediately();
      }, 50);
    }
  }, [messages.length, selectedChatId, messages]); // Include messages array for better reactivity

  return (
    <div className="flex h-full relative bg-gray-50 dark:bg-gray-900">
      {/* Loading State */}
      {messagesLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading messages...</p>
          </div>
        </div>
      )}
      
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-black mb-2">No conversations yet</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Start a conversation with your friends to see messages here
              </p>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                user={user}
                isSelected={selectedChatId === chat.id}
                onSelect={handleChatSelect}
                onlineFriends={onlineFriends}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat Area - Mobile full screen when selected */}
      {selectedChatId ? (
        <div className={`
          flex-1 flex flex-col bg-white dark:bg-gray-800 relative
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
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Active Engagement Status */}
              <div className="text-right">
                {selectedChatId && typingIndicators[selectedChatId] && typingIndicators[selectedChatId].length > 0 ? (
                  <>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {(() => {
                        const typingUsers = typingIndicators[selectedChatId];
                        if (typingUsers.length === 1) {
                          const user = typingUsers[0];
                          const userName = user.user_profile?.full_name || user.user_profile?.username || 'Someone';
                          return `${userName} is typing...`;
                        } else if (typingUsers.length === 2) {
                          const user1 = typingUsers[0].user_profile?.full_name || typingUsers[0].user_profile?.username || 'Someone';
                          const user2 = typingUsers[1].user_profile?.full_name || typingUsers[1].user_profile?.username || 'Someone';
                          return `${user1} and ${user2} are typing...`;
                        } else {
                          return `${typingUsers.length} people are typing...`;
                        }
                      })()}
                    </div>
                    <div className="text-xs text-green-500 dark:text-green-400">
                      Active Engagement
                    </div>
                  </>
                ) : isChatOnline(selectedChat) ? (
                  <>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Online
                    </div>
                    <div className="text-xs text-blue-500 dark:text-blue-400">
                      Active Engagement
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Offline
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      Active Engagement
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 relative"
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-black mb-2">No messages yet</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Start the conversation by sending a message
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.map((message) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  
                  // Get the other user's profile for translation
                  const otherUserProfile = selectedChat?.participants?.find(
                    (p: any) => p.user_id !== user?.id
                  )?.user_profile;
                  
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwnMessage={isOwnMessage}
                      user={user}
                      otherUserProfile={otherUserProfile}
                      onReply={handleReply}
                      onEdit={handleEdit}
                    />
                  );
                })}
                
                
                <div ref={messagesEndRef} data-messages-end />
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
          <div className="absolute bottom-0 left-0 right-0 px-3 sm:px-4 py-3 sm:py-4 border-t-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-30">
            
            {/* Typing Indicator - Above Input */}
            {selectedChatId && typingIndicators[selectedChatId] && typingIndicators[selectedChatId].length > 0 && (
              <div className="mb-3">
                <TypingIndicator 
                  typingUsers={typingIndicators[selectedChatId].map(t => t.user_profile || { id: t.user_id, full_name: null, username: null, avatar_url: null })}
                  className=""
                />
              </div>
            )}

            {/* Reply/Edit Preview */}
            {(replyingTo || editingMessage) && (
              <div className="mb-3 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      editingMessage ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {editingMessage ? 'Editing message' : 'Replying to'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {replyingTo?.sender_profile?.full_name || replyingTo?.sender_profile?.username || 'Unknown'}
                    </span>
                  </div>
                  <button
                    onClick={handleCancelReplyEdit}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {(replyingTo || editingMessage) && (
                  <div className="mt-2 p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500">
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                      {(replyingTo || editingMessage)?.content}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-center max-w-4xl mx-auto">
              <div className="w-full max-w-2xl relative">
                <div className="flex items-center space-x-3 bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary-500 focus-within:bg-white dark:focus-within:bg-gray-600 focus-within:border-primary-500 transition-all">
                  {/* Avatar/Profile Icon */}
                  <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-black font-semibold text-sm">
                      {user?.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  
                  {/* Message Input */}
                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={isSending}
                    className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base font-medium text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50"
                  />
                  
                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !messageInput.trim()}
                    className={`w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 flex-shrink-0 ${
                      messageInput.trim() 
                        ? 'bg-primary-400 hover:bg-primary-700 text-black cursor-pointer' 
                        : 'bg-gray-700 text-white dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    } ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSending ? (
                      <div className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${
                        messageInput.trim() ? 'border-white' : 'border-gray-500 dark:border-gray-400'
                      }`}></div>
                    ) : (
                      <PaperAirplaneIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
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
                
                {/* Friend Suggestions Dropdown */}
                {showFriendSuggestions && friendSuggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 p-3 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {friendSearchQuery ? `Friends matching "${friendSearchQuery}"` : 'Share a friend:'}
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          {friendSuggestions.length} {friendSuggestions.length === 1 ? 'friend' : 'friends'}
                        </div>
                      </div>
                      
                      {friendSuggestions.length === 0 && friendSearchQuery ? (
                        <div className="text-center py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            No friends found matching "{friendSearchQuery}"
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Try a different name or username
                          </div>
                        </div>
                      ) : (
                        friendSuggestions.map((friend, index) => (
                          <button
                            key={friend.id}
                            onClick={() => handleFriendSelect(friend)}
                            className={`flex items-center space-x-3 w-full p-2 rounded-lg transition-colors ${
                              index === selectedFriendIndex 
                                ? 'bg-primary-100 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {friend.friend_profile?.avatar_url ? (
                                <img 
                                  src={friend.friend_profile.avatar_url} 
                                  alt={friend.friend_profile.full_name || 'Friend'}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <span>
                                  {(friend.friend_profile?.full_name || friend.friend_profile?.username || 'F')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {friend.friend_profile?.full_name || friend.friend_profile?.username || 'Unknown Friend'}
                              </div>
                              {friend.friend_profile?.username && friend.friend_profile?.full_name && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  @{friend.friend_profile.username}
                                </div>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                      
                      {!friendSearchQuery && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          💡 Tip: Type @friends/name to filter friends
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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