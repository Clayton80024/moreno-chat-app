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
  FunnelIcon,
  BellIcon,
} from "@heroicons/react/24/outline";

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  status: "online" | "offline" | "away";
  bio?: string;
  mutualFriends?: number;
}

interface FriendRequest {
  id: string;
  name: string;
  username: string;
  avatar: string;
  mutualFriends: number;
  timestamp: string;
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "online" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const friends: Friend[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      username: "@sarahj",
      avatar: "https://i.pravatar.cc/150?img=1",
      status: "online",
      bio: "Love traveling and photography",
      mutualFriends: 12,
    },
    {
      id: "2",
      name: "Mike Chen",
      username: "@mikechen",
      avatar: "https://i.pravatar.cc/150?img=3",
      status: "online",
      bio: "Software developer | Coffee enthusiast",
      mutualFriends: 8,
    },
    {
      id: "3",
      name: "Emily Davis",
      username: "@emilyd",
      avatar: "https://i.pravatar.cc/150?img=5",
      status: "away",
      bio: "Designer | Creating beautiful things",
      mutualFriends: 15,
    },
    {
      id: "4",
      name: "Alex Rodriguez",
      username: "@alexr",
      avatar: "https://i.pravatar.cc/150?img=8",
      status: "offline",
      bio: "Fitness coach | Healthy living advocate",
      mutualFriends: 5,
    },
    {
      id: "5",
      name: "Lisa Wang",
      username: "@lisawang",
      avatar: "https://i.pravatar.cc/150?img=9",
      status: "online",
      bio: "Artist | Music lover",
      mutualFriends: 10,
    },
    {
      id: "6",
      name: "David Kim",
      username: "@davidk",
      avatar: "https://i.pravatar.cc/150?img=11",
      status: "offline",
      bio: "Entrepreneur | Tech enthusiast",
      mutualFriends: 7,
    },
  ];

  const friendRequests: FriendRequest[] = [
    {
      id: "1",
      name: "Jessica Taylor",
      username: "@jessicat",
      avatar: "https://i.pravatar.cc/150?img=16",
      mutualFriends: 3,
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      name: "Ryan Foster",
      username: "@ryanf",
      avatar: "https://i.pravatar.cc/150?img=13",
      mutualFriends: 5,
      timestamp: "1 day ago",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-online";
      case "away":
        return "bg-away";
      default:
        return "bg-offline";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "online":
        return "Active now";
      case "away":
        return "Away";
      default:
        return "Offline";
    }
  };

  const filteredFriends = friends.filter((friend) => {
    if (activeTab === "online" && friend.status !== "online") return false;
    if (searchQuery) {
      return (
        friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Friends</h1>
              <p className="text-xs text-gray-600">
                {friends.length} friends • {friends.filter(f => f.status === "online").length} online
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {activeTab === "pending" && friendRequests.length > 0 && (
                <div className="relative">
                  <BellIcon className="w-6 h-6 text-gray-600" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {friendRequests.length}
                  </span>
                </div>
              )}
              <button className="p-2 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700 transition-colors">
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
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white transition-all"
            />
          </div>

          {/* Mobile Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "all"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("online")}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === "online"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative ${
                activeTab === "pending"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Requests
              {friendRequests.length > 0 && activeTab !== "pending" && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {friendRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
            <p className="text-sm text-gray-600 mt-1">
              {friends.length} friends • {friends.filter(f => f.status === "online").length} online
            </p>
          </div>
          <button className="flex items-center px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all shadow-lg hover:shadow-xl font-bold text-base">
            <UserPlusIcon className="w-5 h-5 mr-2 text-white" />
            Add Friend
          </button>
        </div>

        {/* Desktop Search and Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "all"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Friends
            </button>
            <button
              onClick={() => setActiveTab("online")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "online"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Online
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                activeTab === "pending"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Pending
              {friendRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {friendRequests.length}
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
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white transition-all"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="p-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FunnelIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
        {activeTab === "pending" ? (
          /* Friend Requests */
          <div className="space-y-3 lg:space-y-4 max-w-4xl mx-auto">
            <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">
              Friend Requests
            </h2>
            {friendRequests.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <UserGroupIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">No pending friend requests</p>
              </div>
            ) : (
              friendRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center">
                      {request.avatar.startsWith('http') ? (
                        <img 
                          src={request.avatar} 
                          alt={request.name}
                          className="w-12 h-12 lg:w-14 lg:h-14 rounded-full object-cover shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-accent-400 to-primary-400 rounded-full flex items-center justify-center text-white font-semibold text-base lg:text-lg">
                          {request.avatar}
                        </div>
                      )}
                      <div className="ml-3 lg:ml-4">
                        <h3 className="font-semibold text-gray-900">{request.name}</h3>
                        <p className="text-sm text-gray-600">{request.username}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {request.mutualFriends} mutual friends • {request.timestamp}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-15 sm:ml-0">
                      <button className="flex-1 sm:flex-none px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center font-bold shadow-md">
                        <CheckIcon className="w-4 h-4 mr-1 text-white" />
                        Accept
                      </button>
                      <button className="flex-1 sm:flex-none px-4 py-2.5 bg-white border-2 border-gray-400 text-gray-900 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center font-bold shadow-md">
                        <XMarkIcon className="w-4 h-4 mr-1 text-gray-700" />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Friends Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {filteredFriends.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl p-8 text-center">
                <UserGroupIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600">
                  {searchQuery ? "No friends found matching your search" : "No friends to display"}
                </p>
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <div key={friend.id} className="bg-white rounded-xl p-4 lg:p-5 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="relative">
                        {friend.avatar.startsWith('http') ? (
                          <img 
                            src={friend.avatar} 
                            alt={friend.name}
                            className="w-11 h-11 lg:w-12 lg:h-12 rounded-full object-cover shadow-md"
                          />
                        ) : (
                          <div className="w-11 h-11 lg:w-12 lg:h-12 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-semibold text-sm lg:text-base">
                            {friend.avatar}
                          </div>
                        )}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 lg:w-3.5 lg:h-3.5 ${getStatusColor(friend.status)} rounded-full border-2 border-white`}></div>
                      </div>
                      <div className="ml-3">
                        <h3 className="font-bold text-gray-900 text-base lg:text-lg">{friend.name}</h3>
                        <p className="text-sm lg:text-base text-gray-700 font-medium">{friend.username}</p>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 lg:opacity-100 lg:group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded">
                      <EllipsisHorizontalIcon className="w-4 h-4 lg:w-5 lg:h-5 text-gray-600" />
                    </button>
                  </div>
                  
                  {friend.bio && (
                    <p className="text-sm lg:text-base text-gray-700 mb-3 line-clamp-2 font-medium">{friend.bio}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className={`text-sm px-2.5 py-1 lg:py-1.5 rounded-full font-semibold ${
                        friend.status === "online" ? "bg-green-100 text-green-800" :
                        friend.status === "away" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-200 text-gray-800"
                      }`}>
                        {getStatusText(friend.status)}
                      </span>
                      {friend.mutualFriends && (
                        <span className="text-xs text-gray-500">
                          {friend.mutualFriends} mutual
                        </span>
                      )}
                    </div>
                    <button className="p-2 lg:p-2.5 bg-primary-100 hover:bg-primary-200 rounded-lg transition-colors group/btn shadow-sm">
                      <ChatBubbleLeftIcon className="w-5 h-5 lg:w-6 lg:h-6 text-primary-700 group-hover/btn:text-primary-800" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Mobile Add Friend FAB */}
      <button className="lg:hidden fixed bottom-20 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-xl hover:bg-primary-700 active:bg-primary-800 transition-all flex items-center justify-center border-2 border-white">
        <UserPlusIcon className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}