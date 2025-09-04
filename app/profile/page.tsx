"use client";

import { useState } from "react";
import {
  CameraIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  PaperAirplaneIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  const profileData = {
    name: "John Doe",
    username: "@johndoe",
    bio: "Passionate about personal growth and helping others achieve their goals. Love connecting with like-minded individuals.",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    joinedDate: "March 2024",
    friends: 127,
    conversations: 892,
    avatar: "https://i.pravatar.cc/150?img=7",
    isVerified: true,
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-primary-500 to-accent-500 px-4 pt-6 pb-24">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-white text-primary-600 font-medium rounded-lg text-sm flex items-center shadow-md hover:shadow-lg transition-shadow"
          >
            <PencilIcon className="w-4 h-4 mr-1.5" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-gradient-to-r from-primary-500 to-accent-500 pt-12 pb-32">
        <div className="max-w-4xl mx-auto px-8">
          <div className="flex justify-end">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-5 py-2.5 bg-white text-primary-600 font-medium rounded-lg hover:shadow-lg transition-all flex items-center"
            >
              <PencilIcon className="w-5 h-5 mr-2" />
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 px-4 lg:px-8 -mt-20 lg:-mt-24 pb-6">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Avatar and Basic Info */}
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                {/* Avatar */}
                <div className="relative mb-4 sm:mb-0 sm:mr-6">
                  {profileData.avatar.startsWith('http') ? (
                    <img 
                      src={profileData.avatar} 
                      alt={profileData.name}
                      className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full object-cover shadow-xl border-4 border-white"
                    />
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-bold text-3xl sm:text-4xl lg:text-5xl shadow-xl">
                      {profileData.avatar}
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 p-2.5 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                    <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                  </button>
                </div>

                {/* Name and Bio */}
                <div className="flex-1">
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                      {profileData.name}
                    </h1>
                    {profileData.isVerified && (
                      <CheckBadgeIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary-500" />
                    )}
                  </div>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-3">{profileData.username}</p>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed max-w-2xl">
                    {profileData.bio}
                  </p>

                  {/* Mobile Stats */}
                  <div className="flex justify-center sm:justify-start space-x-8 mt-5 sm:hidden">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{profileData.friends}</p>
                      <p className="text-sm text-gray-600 font-medium">Friends</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{profileData.conversations}</p>
                      <p className="text-sm text-gray-600 font-medium">Chats</p>
                    </div>
                  </div>
                </div>

                {/* Desktop Stats */}
                <div className="hidden sm:flex flex-col space-y-4 mt-4 sm:mt-0 ml-0 sm:ml-8">
                  <div className="bg-primary-50 rounded-xl p-4 text-center">
                    <UserGroupIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900">{profileData.friends}</p>
                    <p className="text-sm lg:text-base text-gray-700 font-medium">Friends</p>
                  </div>
                  <div className="bg-accent-50 rounded-xl p-4 text-center">
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-accent-600 mx-auto mb-2" />
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900">{profileData.conversations}</p>
                    <p className="text-sm lg:text-base text-gray-700 font-medium">Chats</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t-2 border-gray-100 px-5 sm:px-6 lg:px-8 py-5 sm:py-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full mr-3 shadow-sm">
                    <EnvelopeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Email</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{profileData.email}</p>
                  </div>
                </div>

                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full mr-3 shadow-sm">
                    <PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Phone</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{profileData.phone}</p>
                  </div>
                </div>

                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full mr-3 shadow-sm">
                    <MapPinIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Location</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{profileData.location}</p>
                  </div>
                </div>

                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full mr-3 shadow-sm">
                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Joined</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{profileData.joinedDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Mobile */}
            <div className="sm:hidden border-t-2 border-gray-100 p-5 bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center px-4 py-3.5 bg-primary-600 text-white rounded-lg font-bold text-base shadow-lg hover:bg-primary-700 active:bg-primary-800 transition-colors">
                  <PaperAirplaneIcon className="w-5 h-5 mr-2 text-white" />
                  Message
                </button>
                <button className="flex items-center justify-center px-4 py-3.5 bg-white border-2 border-gray-400 text-gray-900 rounded-lg font-bold text-base shadow-md hover:bg-gray-100 hover:border-gray-500 transition-all">
                  <ShareIcon className="w-5 h-5 mr-2 text-gray-700" />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions - Desktop */}
          <div className="hidden sm:flex justify-center space-x-4 mt-8">
            <button className="flex items-center px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 active:bg-primary-800 transition-all shadow-xl hover:shadow-2xl font-bold text-lg">
              <PaperAirplaneIcon className="w-6 h-6 mr-3 text-white" />
              Send Message
            </button>
            <button className="flex items-center px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl font-bold text-lg border-2 border-gray-400 hover:border-gray-500">
              <ShareIcon className="w-6 h-6 mr-3 text-gray-700" />
              Share Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}