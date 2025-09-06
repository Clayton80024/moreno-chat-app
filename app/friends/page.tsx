"use client";

import { useState } from "react";
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  CheckIcon,
  XMarkIcon,
  UserGroupIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { useFriends, useFriendRequests, useUserSearch } from "@/hooks/useFriends";
import { useRealtime } from "@/contexts/RealtimeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { ChatsService } from "@/lib/chats";
import { Dialog } from "@headlessui/react";
import Avatar from "@/components/Avatar";
import { countries, Country } from "@/lib/countries";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendRequest: (userId: string, message?: string) => void;
  isProcessing: boolean;
}

function AddFriendModal({ isOpen, onClose, onSendRequest, isProcessing }: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [previewUser, setPreviewUser] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const { users, loading, error } = useUserSearch({ query: searchQuery });

  // Helper function to get country flag
  const getCountryFlag = (countryName: string | null | undefined): string => {
    if (!countryName) return '';
    const country = countries.find(c => c.name === countryName);
    return country?.flag || '';
  };

  // Handle user hover for preview
  const handleUserHover = (user: any) => {
    setPreviewUser(user);
    setShowPreview(true);
  };

  const handleUserLeave = () => {
    setShowPreview(false);
    setPreviewUser(null);
  };

  // Handle user click for mobile preview
  const handleUserClick = (user: any) => {
    if (window.innerWidth < 768) { // Mobile
      setPreviewUser(user);
      setShowPreview(true);
    } else { // Desktop - select user
      setSelectedUser(user);
    }
  };

  const handleSendRequest = async () => {
    if (selectedUser) {
      await onSendRequest(selectedUser.id, message.trim() || undefined);
      setSelectedUser(null);
      setMessage("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl relative">
          <div className="p-6">
            <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Friend
            </Dialog.Title>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search for users
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-all"
                  />
                </div>
              </div>

              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm">{error}</div>
              )}

              {users.length > 0 && (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      onMouseEnter={() => handleUserHover(user)}
                      onMouseLeave={handleUserLeave}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedUser?.id === user.id
                          ? 'bg-primary-100 dark:bg-primary-900/20 border-2 border-primary-500 shadow-md'
                          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={user.avatar_url}
                          alt={user.full_name || user.username || 'Unknown User'}
                          size="md"
                          fallbackText={user.full_name || user.username || '?'}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {user.full_name || user.username || 'Unknown User'}
                            </p>
                            {getCountryFlag(user.location) && (
                              <span className="text-lg" title={user.location || ''}>
                                {getCountryFlag(user.location)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            @{user.username}
                          </p>
                          {user.mutual_friends && user.mutual_friends > 0 && (
                            <p className="text-xs text-gray-400">
                              {user.mutual_friends} mutual friends
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Desktop Preview Card */}
              {showPreview && previewUser && (
                <div className="hidden md:block absolute right-4 top-20 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-10 p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar
                      src={previewUser.avatar_url}
                      alt={previewUser.full_name || previewUser.username || 'Unknown User'}
                      size="lg"
                      fallbackText={previewUser.full_name || previewUser.username || '?'}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {previewUser.full_name || previewUser.username || 'Unknown User'}
                        </h3>
                        {getCountryFlag(previewUser.location) && (
                          <span className="text-lg" title={previewUser.location || ''}>
                            {getCountryFlag(previewUser.location)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        @{previewUser.username}
                      </p>
                      {previewUser.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {previewUser.bio}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <div className={`w-2 h-2 rounded-full ${previewUser.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span>{previewUser.is_online ? 'Online' : 'Offline'}</span>
                          </div>
                          {previewUser.mutual_friends && previewUser.mutual_friends > 0 && (
                            <span>{previewUser.mutual_friends} mutual friends</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Preview Modal */}
              {showPreview && previewUser && (
                <div className="md:hidden fixed inset-0 bg-black/50 z-50 flex items-end">
                  <div className="w-full bg-white dark:bg-gray-800 rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Preview</h3>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                    
                    <div className="flex items-start space-x-4 mb-4">
                      <Avatar
                        src={previewUser.avatar_url}
                        alt={previewUser.full_name || previewUser.username || 'Unknown User'}
                        size="xl"
                        fallbackText={previewUser.full_name || previewUser.username || '?'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {previewUser.full_name || previewUser.username || 'Unknown User'}
                          </h4>
                          {getCountryFlag(previewUser.location) && (
                            <span className="text-xl" title={previewUser.location || ''}>
                              {getCountryFlag(previewUser.location)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          @{previewUser.username}
                        </p>
                        <div className="flex items-center space-x-1 mb-2">
                          <div className={`w-2 h-2 rounded-full ${previewUser.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {previewUser.is_online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        {previewUser.mutual_friends && previewUser.mutual_friends > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {previewUser.mutual_friends} mutual friends
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {previewUser.bio && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{previewUser.bio}</p>
                      </div>
                    )}
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setSelectedUser(previewUser);
                          setShowPreview(false);
                        }}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                      >
                        Send Request
                      </button>
                      <button
                        onClick={() => setShowPreview(false)}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    placeholder="Add a personal message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 transition-all resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendRequest}
                disabled={!selectedUser || isProcessing}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "online" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [hiddenRequests, setHiddenRequests] = useState<Set<string>>(new Set());
  
  const { user } = useAuth();
  const { friends, loading: friendsLoading } = useFriends();
  const { sentRequests, receivedRequests, sendFriendRequest, acceptRequest, declineRequest, cancelRequest, isProcessing } = useFriendRequests();
  const { onlineFriends } = useRealtime();
  const { addNotification } = useNotifications();
  const { addToast } = useToast();

  // Optimistic update functions
  const handleAcceptRequest = async (requestId: string) => {
    if (processingRequests.has(requestId)) return; // Prevent multiple clicks
    
    setProcessingRequests(prev => new Set(prev).add(requestId));
    setHiddenRequests(prev => new Set(prev).add(requestId)); // Hide immediately
    
    try {
      await acceptRequest(requestId);
      addToast({
        type: 'success',
        title: 'Friend Request Accepted',
        message: 'You are now friends!',
        duration: 2000
      });
    } catch (error) {
      // Show the request again if it failed
      setHiddenRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to accept friend request. Please try again.',
        duration: 3000
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    if (processingRequests.has(requestId)) return; // Prevent multiple clicks
    
    setProcessingRequests(prev => new Set(prev).add(requestId));
    setHiddenRequests(prev => new Set(prev).add(requestId)); // Hide immediately
    
    try {
      await declineRequest(requestId);
      addToast({
        type: 'success',
        title: 'Friend Request Declined',
        message: 'Request has been declined.',
        duration: 2000
      });
    } catch (error) {
      // Show the request again if it failed
      setHiddenRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to decline friend request. Please try again.',
        duration: 3000
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleStartChat = async (friendId: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const chat = await ChatsService.getOrCreateDirectChat(user.id, friendId);
      
      if (chat) {
        addToast({
          type: 'success',
          title: 'Chat Started',
          message: 'Opening conversation...',
          duration: 2000
        });
        setTimeout(() => {
          window.location.href = `/chats?chat=${chat.id}`;
        }, 1000);
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to start chat. Please try again.',
        duration: 5000
      });
    }
  };

  const handleAcceptAndChat = async (requestId: string, senderId: string) => {
    if (processingRequests.has(requestId)) return; // Prevent multiple clicks
    
    setProcessingRequests(prev => new Set(prev).add(requestId));
    setHiddenRequests(prev => new Set(prev).add(requestId)); // Hide immediately
    
    try {
      const request = receivedRequests.find(r => r.id === requestId);
      const senderName = request?.sender_profile?.full_name || request?.sender_profile?.username || 'Unknown User';
      
      await acceptRequest(requestId);
      
      addToast({
        type: 'success',
        title: 'Friend Request Accepted',
        message: `You are now friends with ${senderName}! Starting conversation...`,
        duration: 3000
      });
      
      addNotification({
        type: 'friend_accepted',
        title: 'Friend Request Accepted',
        message: `You are now friends with ${senderName}! Starting a conversation...`,
        data: { senderId, senderName }
      });
      
      setTimeout(async () => {
        try {
          if (!user) {
            throw new Error('User not authenticated');
          }
          
          const chat = await ChatsService.getOrCreateDirectChat(user.id, senderId);
          if (chat) {
            window.location.href = `/chats?chat=${chat.id}`;
          }
        } catch (error) {
          addToast({
            type: 'error',
            title: 'Chat Error',
            message: 'Failed to create chat. You can start a conversation from the friends list.',
            duration: 5000
          });
        }
      }, 1000);
    } catch (error) {
      // Show the request again if it failed
      setHiddenRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to accept friend request. Please try again.',
        duration: 3000
      });
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const getStatusColor = (userId: string) => {
    return onlineFriends.includes(userId) ? "bg-green-500" : "bg-gray-400";
  };

  const getStatusText = (userId: string) => {
    return onlineFriends.includes(userId) ? "Active now" : "Offline";
  };

  const filteredFriends = friends.filter((friend) => {
    if (activeTab === "online" && !onlineFriends.includes(friend.friend_id)) return false;
    if (searchQuery) {
      const profile = friend.friend_profile;
      const name = profile?.full_name || '';
      const username = profile?.username || '';
      return (
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const onlineFriendsCount = friends.filter(friend => onlineFriends.includes(friend.friend_id)).length;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Friends</h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {friends.length} friends • {onlineFriendsCount} online
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {activeTab === "pending" && receivedRequests.length > 0 && (
                <div className="relative">
                  <BellIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {receivedRequests.length}
                  </span>
                </div>
              )}
              <button 
                onClick={() => setShowAddFriendModal(true)}
                className="p-2 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700 transition-colors"
              >
                <UserPlusIcon className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="relative mb-3">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white dark:focus:bg-gray-600 transition-all"
            />
          </div>

          {/* Mobile Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "all"
                  ? "bg-white dark:bg-gray-600 text-primary-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("online")}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "online"
                  ? "bg-white dark:bg-gray-600 text-primary-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative ${
                activeTab === "pending"
                  ? "bg-white dark:bg-gray-600 text-primary-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              Requests
              {receivedRequests.length > 0 && activeTab !== "pending" && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {receivedRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Friends</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {friends.length} friends • {onlineFriendsCount} online
            </p>
          </div>
          <button 
            onClick={() => setShowAddFriendModal(true)}
            className="flex items-center px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all shadow-lg hover:shadow-xl font-bold text-base"
          >
            <UserPlusIcon className="w-5 h-5 mr-2 text-white" />
            Add Friend
          </button>
        </div>

        {/* Desktop Search and Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "all"
                  ? "bg-white dark:bg-gray-600 text-primary-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              All Friends
            </button>
            <button
              onClick={() => setActiveTab("online")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "online"
                  ? "bg-white dark:bg-gray-600 text-primary-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                activeTab === "pending"
                  ? "bg-white dark:bg-gray-600 text-primary-600 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              Pending
              {receivedRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {receivedRequests.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative w-80">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white dark:focus:bg-gray-600 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
        
        {activeTab === "pending" ? (
          /* Friend Requests */
          <div className="space-y-3 lg:space-y-4 max-w-4xl mx-auto">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-3 lg:mb-4">
              Friend Requests
            </h2>
            
            {/* Received Requests */}
            {receivedRequests.filter(request => !hiddenRequests.has(request.id)).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Received</h3>
                <div className="space-y-3">
                  {receivedRequests.filter(request => !hiddenRequests.has(request.id)).map((request) => (
                    <div key={request.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center">
                          <Avatar
                            src={request.sender_profile?.avatar_url}
                            alt={request.sender_profile?.full_name || request.sender_profile?.username || 'Unknown User'}
                            size="lg"
                            fallbackText={request.sender_profile?.full_name || request.sender_profile?.username || '?'}
                          />
                          <div className="ml-3 lg:ml-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {request.sender_profile?.full_name || request.sender_profile?.username || 'Unknown User'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              @{request.sender_profile?.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                              {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-0">
                          <button 
                            onClick={() => handleAcceptAndChat(request.id, request.sender_id)}
                            disabled={processingRequests.has(request.id)}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center font-bold shadow-md"
                          >
                            {processingRequests.has(request.id) ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                            ) : (
                              <ChatBubbleLeftIcon className="w-4 h-4 mr-1 text-white" />
                            )}
                            {processingRequests.has(request.id) ? 'Accepting...' : 'Accept & Chat'}
                          </button>
                          <button 
                            onClick={() => handleAcceptRequest(request.id)}
                            disabled={processingRequests.has(request.id)}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center font-bold shadow-md"
                          >
                            {processingRequests.has(request.id) ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                            ) : (
                              <CheckIcon className="w-4 h-4 mr-1 text-white" />
                            )}
                            {processingRequests.has(request.id) ? 'Accepting...' : 'Accept'}
                          </button>
                          <button 
                            onClick={() => handleDeclineRequest(request.id)}
                            disabled={processingRequests.has(request.id)}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center font-bold shadow-md"
                          >
                            {processingRequests.has(request.id) ? (
                              <div className="w-4 h-4 border-2 border-gray-700 dark:border-gray-300 border-t-transparent rounded-full animate-spin mr-1"></div>
                            ) : (
                              <XMarkIcon className="w-4 h-4 mr-1 text-gray-700 dark:text-gray-300" />
                            )}
                            {processingRequests.has(request.id) ? 'Declining...' : 'Decline'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Requests */}
            {sentRequests.filter(request => !hiddenRequests.has(request.id)).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sent</h3>
                <div className="space-y-3">
                  {sentRequests.filter(request => !hiddenRequests.has(request.id)).map((request) => (
                    <div key={request.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar
                            src={request.receiver_profile?.avatar_url}
                            alt={request.receiver_profile?.full_name || request.receiver_profile?.username || 'Unknown User'}
                            size="lg"
                            fallbackText={request.receiver_profile?.full_name || request.receiver_profile?.username || '?'}
                          />
                          <div className="ml-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {request.receiver_profile?.full_name || request.receiver_profile?.username || 'Unknown User'}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              @{request.receiver_profile?.username}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Sent {new Date(request.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => cancelRequest(request.id)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {receivedRequests.filter(request => !hiddenRequests.has(request.id)).length === 0 && sentRequests.filter(request => !hiddenRequests.has(request.id)).length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <UserGroupIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">No pending friend requests</p>
              </div>
            )}
          </div>
        ) : (
          /* Friends Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {friendsLoading ? (
              <div className="col-span-full flex justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <UserGroupIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? "No friends found matching your search" : "No friends to display"}
                </p>
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const profile = friend.friend_profile;
                const isOnline = onlineFriends.includes(friend.friend_id);
                
                return (
                  <div key={friend.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-5 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="relative">
                          <Avatar
                            src={profile?.avatar_url}
                            alt={profile?.full_name || profile?.username || 'Unknown User'}
                            size="lg"
                            fallbackText={profile?.full_name || profile?.username || '?'}
                          />
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 lg:w-3.5 lg:h-3.5 ${getStatusColor(friend.friend_id)} rounded-full border-2 border-white dark:border-gray-800`}></div>
                        </div>
                        <div className="ml-3">
                          <h3 className="font-bold text-gray-900 dark:text-white text-base lg:text-lg">
                            {profile?.full_name || profile?.username || 'Unknown User'}
                          </h3>
                          <p className="text-sm lg:text-base text-gray-700 dark:text-gray-300 font-medium">
                            @{profile?.username}
                          </p>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 lg:opacity-100 lg:group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <EllipsisHorizontalIcon className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>
                    
                    {profile?.bio && (
                      <p className="text-sm lg:text-base text-gray-700 dark:text-gray-300 mb-3 line-clamp-2 font-medium">{profile.bio}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className={`text-sm px-2.5 py-1 lg:py-1.5 rounded-full font-semibold ${
                          isOnline ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400" :
                          "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                        }`}>
                          {getStatusText(friend.friend_id)}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleStartChat(friend.friend_id)}
                        className="p-2 lg:p-2.5 bg-primary-100 dark:bg-primary-900/20 hover:bg-primary-200 dark:hover:bg-primary-900/30 rounded-lg transition-colors group/btn shadow-sm"
                      >
                        <ChatBubbleLeftIcon className="w-5 h-5 lg:w-6 lg:h-6 text-primary-700 dark:text-primary-400 group-hover/btn:text-primary-800 dark:group-hover/btn:text-primary-300" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Mobile Add Friend FAB */}
      <button 
        onClick={() => setShowAddFriendModal(true)}
        className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-xl hover:bg-primary-700 active:bg-primary-800 transition-all flex items-center justify-center border-2 border-white dark:border-gray-800"
      >
        <UserPlusIcon className="w-7 h-7 text-white" />
      </button>

      {/* Add Friend Modal */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onSendRequest={sendFriendRequest}
        isProcessing={isProcessing}
      />
    </div>
  );
}