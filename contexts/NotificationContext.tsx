"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'friend_request' | 'message' | 'friend_accepted' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId: string; // Add user ID to ensure notifications are user-specific
  data?: any; // Additional data like user_id, chat_id, etc.
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { friendRequests, chats, onlineFriends } = useRealtime();
  const { user } = useAuth();

  // Filter notifications by current user
  const userNotifications = notifications.filter(n => n.userId === user?.id);
  
  // Calculate unread count for current user only
  const unreadCount = userNotifications.filter(n => !n.read).length;

  // Add notification with user validation
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'userId'>) => {
    // Only add notification if user is logged in
    if (!user?.id) {
      console.warn('Cannot add notification: user not logged in');
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
      userId: user.id // Ensure notification is tied to current user
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show browser notification if permission is granted and user is active
    if (Notification.permission === 'granted' && document.hasFocus()) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      });
    }
  }, [user?.id]);

  // Mark notification as read (only for current user)
  const markAsRead = useCallback((notificationId: string) => {
    if (!user?.id) return;
    
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId && notification.userId === user.id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, [user?.id]);

  // Mark all notifications as read (only for current user)
  const markAllAsRead = useCallback(() => {
    if (!user?.id) return;
    
    setNotifications(prev => 
      prev.map(notification => 
        notification.userId === user.id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, [user?.id]);

  // Remove notification (only for current user)
  const removeNotification = useCallback((notificationId: string) => {
    if (!user?.id) return;
    
    setNotifications(prev => 
      prev.filter(notification => 
        !(notification.id === notificationId && notification.userId === user.id)
      )
    );
  }, [user?.id]);

  // Clear all notifications (only for current user)
  const clearAllNotifications = useCallback(() => {
    if (!user?.id) return;
    
    setNotifications(prev => 
      prev.filter(notification => notification.userId !== user.id)
    );
  }, [user?.id]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Listen for new friend requests (only for current user)
  useEffect(() => {
    if (!user?.id || friendRequests.received.length === 0) return;
    
    const latestRequest = friendRequests.received[0];
    
    // Check if we already have a notification for this request
    const existingNotification = userNotifications.find(
      n => n.type === 'friend_request' && n.data?.requestId === latestRequest.id
    );

    if (!existingNotification) {
      addNotification({
        type: 'friend_request',
        title: 'New Friend Request',
        message: `${latestRequest.sender_profile?.full_name || latestRequest.sender_profile?.username || 'Someone'} wants to be your friend`,
        data: {
          requestId: latestRequest.id,
          senderId: latestRequest.sender_id,
          senderName: latestRequest.sender_profile?.full_name || latestRequest.sender_profile?.username
        }
      });
    }
  }, [friendRequests.received, addNotification, userNotifications, user?.id]);

  // Listen for new messages (only for current user's chats)
  useEffect(() => {
    if (!user?.id) return;
    
    chats.forEach(chat => {
      if (chat.unread_count && chat.unread_count > 0) {
        const latestMessage = chat.last_message;
        
        if (latestMessage && latestMessage.sender_id !== user.id) {
          // Check if we already have a notification for this message
          const existingNotification = userNotifications.find(
            n => n.type === 'message' && n.data?.messageId === latestMessage.id
          );

          if (!existingNotification) {
            const senderName = latestMessage.sender_profile?.full_name || 
                             latestMessage.sender_profile?.username || 
                             'Someone';
            
            addNotification({
              type: 'message',
              title: chat.type === 'direct' ? senderName : chat.name || 'Group Chat',
              message: latestMessage.content.length > 50 
                ? latestMessage.content.substring(0, 50) + '...' 
                : latestMessage.content,
              data: {
                chatId: chat.id,
                messageId: latestMessage.id,
                senderId: latestMessage.sender_id,
                chatName: chat.name || senderName
              }
            });
          }
        }
      }
    });
  }, [chats, addNotification, userNotifications, user?.id]);

  // Clear notifications when user logs out
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
    }
  }, [user?.id]);

  // Auto-remove old notifications (older than 7 days) - only for current user
  useEffect(() => {
    if (!user?.id) return;
    
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    setNotifications(prev => 
      prev.filter(notification => 
        notification.userId === user.id && 
        new Date(notification.timestamp) > sevenDaysAgo
      )
    );
  }, [user?.id]);

  const value: NotificationContextType = {
    notifications: userNotifications, // Only return notifications for current user
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Notification component for displaying notifications
export function NotificationToast({ notification, onClose }: { 
  notification: Notification; 
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'friend_request':
        return '👥';
      case 'message':
        return '💬';
      case 'friend_accepted':
        return '✅';
      case 'system':
        return '🔔';
      default:
        return '🔔';
    }
  };

  const getColor = () => {
    switch (notification.type) {
      case 'friend_request':
        return 'bg-blue-500';
      case 'message':
        return 'bg-green-500';
      case 'friend_accepted':
        return 'bg-purple-500';
      case 'system':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 transform transition-all duration-300 ease-in-out`}>
      <div className="flex items-start space-x-3">
        <div className={`flex-shrink-0 w-8 h-8 ${getColor()} rounded-full flex items-center justify-center text-white text-sm`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {notification.title}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {notification.message}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
