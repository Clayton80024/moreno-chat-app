"use client";

import React, { useState } from 'react';
import { XMarkIcon, UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { FriendsService } from '@/lib/friends';

interface FriendProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendProfile: {
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

export function FriendProfileModal({ isOpen, onClose, friendProfile }: FriendProfileModalProps) {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [isProcessing, setIsProcessing] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined'>('none');

  // Check if this user is already a friend
  const isAlreadyFriend = friends?.some(friend => friend.friend_profile?.id === friendProfile.id);
  
  // Check friend request status
  React.useEffect(() => {
    if (user && friendProfile.id) {
      FriendsService.getFriendRequestStatus(user.id, friendProfile.id)
        .then(status => {
          setFriendStatus(status.status);
        })
        .catch(error => {
          console.error('Error checking friend status:', error);
        });
    }
  }, [user, friendProfile.id]);

  const handleSendFriendRequest = async () => {
    if (!user || isProcessing) return;
    
    setIsProcessing(true);
    try {
      await FriendsService.sendFriendRequest(user.id, friendProfile.id, `Hi! I saw you mentioned in a chat and wanted to connect.`);
      setFriendStatus('pending_sent');
    } catch (error) {
      console.error('Error sending friend request:', error);
      // Handle error (could show a toast notification)
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!user || isProcessing) return;
    
    setIsProcessing(true);
    try {
      // This would need the request ID, but for now we'll use a simplified approach
      // In a real implementation, you'd need to get the request ID
      setFriendStatus('accepted');
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusText = () => {
    switch (friendStatus) {
      case 'accepted':
        return 'You are friends';
      case 'pending_sent':
        return 'Friend request sent';
      case 'pending_received':
        return 'Wants to be friends';
      case 'declined':
        return 'Friend request declined';
      default:
        return 'Not friends yet';
    }
  };

  const getStatusColor = () => {
    switch (friendStatus) {
      case 'accepted':
        return 'text-green-600 dark:text-green-400';
      case 'pending_sent':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'pending_received':
        return 'text-blue-600 dark:text-blue-400';
      case 'declined':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getActionButton = () => {
    if (isAlreadyFriend) {
      return (
        <button
          disabled
          className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <UserMinusIcon className="w-4 h-4" />
          <span>Already Friends</span>
        </button>
      );
    }

    switch (friendStatus) {
      case 'pending_sent':
        return (
          <button
            disabled
            className="w-full px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <UserPlusIcon className="w-4 h-4" />
            <span>Request Sent</span>
          </button>
        );
      case 'pending_received':
        return (
          <button
            onClick={handleAcceptFriendRequest}
            disabled={isProcessing}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <UserPlusIcon className="w-4 h-4" />
            <span>{isProcessing ? 'Accepting...' : 'Accept Request'}</span>
          </button>
        );
      case 'declined':
        return (
          <button
            onClick={handleSendFriendRequest}
            disabled={isProcessing}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <UserPlusIcon className="w-4 h-4" />
            <span>{isProcessing ? 'Sending...' : 'Send Request Again'}</span>
          </button>
        );
      default:
        return (
          <button
            onClick={handleSendFriendRequest}
            disabled={isProcessing}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-black rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <UserPlusIcon className="w-4 h-4" />
            <span>{isProcessing ? 'Sending...' : 'Send Friend Request'}</span>
          </button>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Friend Profile
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Info */}
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {friendProfile.avatar_url ? (
                <img 
                  src={friendProfile.avatar_url} 
                  alt={friendProfile.full_name || 'Friend'}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <span>
                  {(friendProfile.full_name || friendProfile.username || 'F')[0].toUpperCase()}
                </span>
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {friendProfile.full_name || friendProfile.username || 'Unknown User'}
            </h3>
            
            {friendProfile.username && friendProfile.full_name && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                @{friendProfile.username}
              </p>
            )}

            {/* Online Status */}
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${friendProfile.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {friendProfile.is_online ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Friend Status */}
            <div className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </div>
          </div>

          {/* Bio */}
          {friendProfile.bio && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{friendProfile.bio}</p>
            </div>
          )}

          {/* Location */}
          {friendProfile.location && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{friendProfile.location}</p>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4">
            {getActionButton()}
          </div>
        </div>
      </div>
    </div>
  );
}
