"use client";

import { useState } from "react";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  PhoneIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  Bars3Icon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import MobileSidebar from "@/components/MobileSidebar";

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  timestamp: string;
  senderName?: string;
  avatar?: string;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  avatar: string;
  isOnline: boolean;
  unread?: number;
}

export default function ChatsPage() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const chats: Chat[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      lastMessage: "That sounds great! Let me know when",
      timestamp: "2 min",
      avatar: "https://i.pravatar.cc/150?img=1",
      isOnline: true,
      unread: 2,
    },
    {
      id: "2",
      name: "Mike Chen",
      lastMessage: "Did you see the project updates?",
      timestamp: "1 hour",
      avatar: "https://i.pravatar.cc/150?img=3",
      isOnline: true,
    },
    {
      id: "3",
      name: "Emily Davis",
      lastMessage: "Thanks for your help yesterday!",
      timestamp: "3 hours",
      avatar: "https://i.pravatar.cc/150?img=5",
      isOnline: false,
    },
    {
      id: "4",
      name: "Alex Rodriguez",
      lastMessage: "Let's catch up tomorrow",
      timestamp: "Yesterday",
      avatar: "https://i.pravatar.cc/150?img=8",
      isOnline: false,
    },
  ];

  const messages: Message[] = [
    {
      id: "1",
      text: "Hey Sarah! How's your day going?",
      sender: "me",
      timestamp: "10:30 AM",
    },
    {
      id: "2",
      text: "Hi! It's been pretty good so far. Just finished that presentation we talked about.",
      sender: "other",
      timestamp: "10:32 AM",
      senderName: "Sarah",
    },
    {
      id: "3",
      text: "That's awesome! I knew you'd nail it. Want to grab coffee later to celebrate?",
      sender: "me",
      timestamp: "10:33 AM",
    },
    {
      id: "4",
      text: "That sounds great! Let me know when",
      sender: "other",
      timestamp: "10:35 AM",
      senderName: "Sarah",
    },
  ];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      console.log("Sending message:", messageInput);
      setMessageInput("");
    }
  };

  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId);
    setShowMobileSidebar(false);
  };

  const selectedChatData = chats.find(chat => chat.id === selectedChat);

  return (
    <div className="flex h-full relative">
      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={showMobileSidebar} onClose={() => setShowMobileSidebar(false)} />
      
      {/* Chat List - Desktop always visible, Mobile conditional */}
      <div className={`
        ${selectedChat ? 'hidden lg:flex' : 'flex'}
        w-full lg:w-80 xl:w-96 bg-white border-r border-gray-200 flex-col
        absolute lg:relative h-full z-30
      `}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center flex-1">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="lg:hidden p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bars3Icon className="w-6 h-6 text-gray-700" />
              </button>
              <div className="flex-1">
                <h2 className="text-xl font-bold">
                  <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent text-2xl lg:text-xl">Moreno</span>
                  <span className="hidden lg:inline text-gray-400 mx-2">•</span>
                  <span className="hidden lg:inline text-gray-900">Messages</span>
                </h2>
                <p className="text-sm font-medium text-gray-600 lg:hidden">Messages</p>
              </div>
            </div>
            <span className="text-sm font-bold text-primary-700 bg-primary-100 px-3 py-1.5 rounded-full border border-primary-200">
              {chats.filter(c => c.unread).reduce((sum, c) => sum + (c.unread || 0), 0)} new
            </span>
          </div>
          {/* Mobile Search */}
          <div className="lg:hidden">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all font-medium text-gray-900"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 bg-gray-50">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatSelect(chat.id)}
              className={`
                flex items-center px-4 py-3.5 hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100
                ${selectedChat === chat.id ? "bg-primary-50 lg:border-l-4 lg:border-primary-600" : ""}
              `}
            >
              <div className="relative flex-shrink-0">
                {chat.avatar.startsWith('http') ? (
                  <img 
                    src={chat.avatar} 
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md
                    ${chat.isOnline ? "bg-gradient-to-br from-primary-500 to-accent-500" : "bg-gray-400"}
                  `}>
                    {chat.avatar}
                  </div>
                )}
                {chat.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                )}
              </div>
              
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <p className="text-base font-bold text-gray-900 truncate">{chat.name}</p>
                  <span className="text-xs font-medium text-gray-600 ml-2 flex-shrink-0">{chat.timestamp}</span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className="text-sm font-medium text-gray-700 truncate pr-2">{chat.lastMessage}</p>
                  {chat.unread && (
                    <span className="ml-auto bg-primary-600 text-white text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0 shadow-sm">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area - Mobile full screen when selected */}
      {selectedChat ? (
        <div className={`
          flex-1 flex flex-col bg-white
          ${selectedChat ? 'flex' : 'hidden lg:flex'}
          absolute lg:relative w-full h-full z-30
        `}>
          {/* Chat Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-gray-200 flex items-center justify-between bg-white shadow-sm">
            <div className="flex items-center flex-1">
              {/* Mobile Back Button */}
              <button
                onClick={() => setSelectedChat(null)}
                className="lg:hidden mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-700 font-bold" />
              </button>
              
              <div className="relative flex-shrink-0">
                {selectedChatData?.avatar.startsWith('http') ? (
                  <img 
                    src={selectedChatData.avatar} 
                    alt={selectedChatData.name}
                    className="w-11 h-11 rounded-full object-cover shadow-md"
                  />
                ) : (
                  <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-base shadow-md">
                    {selectedChatData?.avatar}
                  </div>
                )}
                {selectedChatData?.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                )}
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {selectedChatData?.name}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-green-600">Active now</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                <PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </button>
              <button className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                <VideoCameraIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </button>
              <button className="hidden sm:block p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-700" />
              </button>
              <button className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-lg transition-colors">
                <EllipsisVerticalIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-gradient-to-b from-gray-50 to-white">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`
                    max-w-[75%] sm:max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md
                    ${message.sender === "me" 
                      ? "bg-primary-600 text-white ml-12" 
                      : "bg-white border-2 border-gray-200 text-gray-900 mr-12"
                    }
                  `}>
                    {message.senderName && (
                      <p className={`text-xs font-bold mb-1 ${
                        message.sender === "me" ? "text-primary-100" : "text-gray-700"
                      }`}>
                        {message.senderName}
                      </p>
                    )}
                    <p className={`text-sm sm:text-base leading-relaxed break-words font-medium ${
                      message.sender === "me" ? "text-white" : "text-gray-900"
                    }`}>
                      {message.text}
                    </p>
                    <p className={`
                      text-xs font-semibold mt-1.5
                      ${message.sender === "me" ? "text-primary-200" : "text-gray-600"}
                    `}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Input */}
          <div className="px-3 sm:px-4 py-3 sm:py-4 border-t-2 border-gray-200 bg-white shadow-lg">
            <div className="flex items-center space-x-2 max-w-4xl mx-auto">
              <button className="hidden sm:flex p-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                <PaperClipIcon className="w-5 h-5 text-gray-700" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white focus:border-primary-500 transition-all text-sm sm:text-base font-medium text-gray-900"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-200 rounded-full transition-colors">
                  <FaceSmileIcon className="w-5 h-5 text-gray-700" />
                </button>
              </div>
              
              <button
                onClick={handleSendMessage}
                className="p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 active:bg-primary-800 transition-all shadow-xl border-2 border-primary-700 flex-shrink-0"
              >
                <PaperAirplaneIcon className="w-5 h-5 text-white font-bold" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state for desktop when no chat selected */
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-28 h-28 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center shadow-md">
              <ChatBubbleLeftRightIcon className="w-14 h-14 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-base font-medium text-gray-600">Choose a chat from the list to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}