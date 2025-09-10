"use client";

import React from 'react';

interface TypingIndicatorProps {
  typingUsers: Array<{
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  }>;
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers, className = '' }) => {
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  const getDisplayName = (user: any) => {
    return user.full_name || user.username || 'Someone';
  };

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${getDisplayName(typingUsers[0])} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${getDisplayName(typingUsers[0])} and ${getDisplayName(typingUsers[1])} are typing...`;
    } else {
      return `${getDisplayName(typingUsers[0])} and ${typingUsers.length - 1} others are typing...`;
    }
  };

  return (
    <div className={`flex items-center space-x-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Typing Animation - Made larger and more visible */}
      <div className="flex items-center space-x-1">
        <div className="flex space-x-1">
          <div 
            className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" 
            style={{ animationDelay: '0ms' }}
          ></div>
          <div 
            className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" 
            style={{ animationDelay: '150ms' }}
          ></div>
          <div 
            className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" 
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>
      
      {/* Typing Text */}
      <span className="text-sm text-gray-600 dark:text-gray-300 italic font-medium">
        {getTypingText()}
      </span>
    </div>
  );
};

export default TypingIndicator;
