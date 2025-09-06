"use client";

import { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";
import { ProfileService, UserProfile } from "@/lib/profiles";
import { useAuth } from "@/contexts/AuthContext";
import ProfileEditModal from "@/components/ProfileEditModal";
import { StorageService } from "@/lib/storage";
import { FriendsService } from "@/lib/friends";
import { ChatsService } from "@/lib/chats";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [chatsCount, setChatsCount] = useState<number>(0);
  const { user, profile } = useAuth();

  useEffect(() => {
    // Initialize storage bucket on component mount - handle errors gracefully
    StorageService.createAvatarsBucket().catch((error) => {
      console.warn('Storage bucket initialization failed:', error);
      // Don't show error to user, just log it
    });
    
    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Profile loading timeout - showing fallback state');
        setLoading(false);
        if (user && !profileData) {
          setProfileData(null); // Show profile not found state
        }
      }
    }, 10000); // 10 second timeout
    
    if (profile) {
      setProfileData(profile);
      setLoading(false);
      clearTimeout(timeoutId);
      // Fetch counts when profile is loaded
      fetchCounts(user.id);
    } else if (user) {
      // User exists but no profile - this can happen for new users
      // Try to create a basic profile or show profile not found
      console.log('🔵 User exists but no profile found, attempting to create basic profile...');
      
      ProfileService.createProfile(user.id, {
        full_name: user.user_metadata?.full_name || 'New User',
        username: null,
        avatar_url: null,
        bio: null,
        phone: null,
        location: null,
        website: null,
        is_online: true,
        last_seen: new Date().toISOString()
      }).then((newProfile) => {
        console.log('🟢 Basic profile created successfully:', newProfile);
        setProfileData(newProfile);
        setLoading(false);
        clearTimeout(timeoutId);
        // Fetch counts when new profile is created
        fetchCounts(user.id);
      }).catch((error) => {
        console.error('🔴 Failed to create basic profile:', error);
        // Show profile not found state instead of loading forever
        setProfileData(null);
        setLoading(false);
        clearTimeout(timeoutId);
      });
    } else {
      setError('No user found');
      setLoading(false);
      clearTimeout(timeoutId);
    }
    
    return () => clearTimeout(timeoutId);
  }, [user, profile]);

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfileData(updatedProfile);
  };

  // Fetch friends and chats counts
  const fetchCounts = async (userId: string) => {
    try {
      // Fetch friends count
      const friends = await FriendsService.getFriends(userId, 'accepted');
      setFriendsCount(friends.length);
      
      // Fetch chats count
      const chats = await ChatsService.getUserChats(userId);
      setChatsCount(chats.length);
    } catch (error) {
      console.error('Error fetching counts:', error);
      // Set counts to 0 if there's an error
      setFriendsCount(0);
      setChatsCount(0);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-pulse">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
              Moreno Chat
            </h1>
            <p className="text-gray-600 mt-2">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Show profile not found state
  if (!profileData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-bold text-4xl mx-auto mb-6">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
          <p className="text-gray-600 mb-6">Your profile hasn't been created yet. Let's set it up!</p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-semibold rounded-lg hover:from-primary-700 hover:to-accent-700 transition-all shadow-lg hover:shadow-xl flex items-center mx-auto"
          >
            <PencilIcon className="w-5 h-5 mr-2" />
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  // Format joined date
  const joinedDate = new Date(profileData.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  // Default values for missing data
  const displayName = profileData.full_name || 'No Name Set';
  const displayUsername = profileData.username ? `@${profileData.username}` : '@username';
  const displayBio = profileData.bio || 'No bio available';
  const displayEmail = user?.email || 'No email available';
  const displayPhone = profileData.phone || 'No phone number';
  const displayLocation = profileData.location || 'No location set';
  const displayAvatar = profileData.avatar_url; // Remove fallback to show database image

  console.log('🔵 Profile avatar_url:', profileData.avatar_url);

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
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
      <div className="px-4 lg:px-8 -mt-20 lg:-mt-24 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Avatar and Basic Info */}
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">
                {/* Avatar */}
                <div className="relative mb-4 sm:mb-0 sm:mr-6">
                  {displayAvatar && displayAvatar.startsWith('http') ? (
                    <img 
                      src={displayAvatar} 
                      alt={displayName}
                      className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-full object-cover shadow-xl border-4 border-white"
                      crossOrigin="anonymous"
                      onLoad={() => {
                        console.log('🟢 Avatar loaded successfully:', displayAvatar);
                      }}
                      onError={(e) => {
                        console.error('🔴 Failed to load avatar:', displayAvatar);
                        console.log('🔵 Trying to access URL directly...');
                        
                        // Try to fetch the image directly to see what's wrong
                        fetch(displayAvatar)
                          .then(response => {
                            console.log('🔵 Direct fetch response:', response.status, response.statusText);
                            if (!response.ok) {
                              console.error('🔴 Image not accessible:', response.status, response.statusText);
                            }
                          })
                          .catch(err => {
                            console.error('🔴 Direct fetch failed:', err);
                          });
                        
                        // Fallback to initials if image fails to load
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const fallback = parent.querySelector('.fallback-avatar');
                          if (fallback) {
                            fallback.classList.remove('hidden');
                            fallback.classList.add('flex');
                          }
                        }
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback avatar with initials - show when no image or image fails */}
                  <div 
                    className={`w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-bold text-3xl sm:text-4xl lg:text-5xl shadow-xl fallback-avatar ${
                      displayAvatar && displayAvatar.startsWith('http') ? 'hidden' : 'flex'
                    }`}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="absolute bottom-0 right-0 p-2.5 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
                  >
                    <CameraIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                  </button>
                </div>

                {/* Name and Bio */}
                <div className="flex-1">
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                      {displayName}
                    </h1>
                    {profileData.is_online && (
                      <CheckBadgeIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-500" />
                    )}
                  </div>
                  <p className="text-base sm:text-lg text-gray-700 font-medium mb-3">{displayUsername}</p>
                  <p className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed max-w-2xl">
                    {displayBio}
                  </p>

                  {/* Online Status */}
                  <div className="flex items-center justify-center sm:justify-start mt-3">
                    <div className={`w-2 h-2 rounded-full mr-2 ${profileData.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-600">
                      {profileData.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>

                  {/* Mobile Stats */}
                  <div className="flex justify-center sm:justify-start space-x-8 mt-5 sm:hidden">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{friendsCount}</p>
                      <p className="text-sm text-gray-600 font-medium">Friends</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{chatsCount}</p>
                      <p className="text-sm text-gray-600 font-medium">Chats</p>
                    </div>
                  </div>
                </div>

                {/* Desktop Stats */}
                <div className="hidden sm:flex flex-col space-y-4 mt-4 sm:mt-0 ml-0 sm:ml-8">
                  <div className="bg-primary-50 rounded-xl p-4 text-center">
                    <UserGroupIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900">{friendsCount}</p>
                    <p className="text-sm lg:text-base text-gray-700 font-medium">Friends</p>
                  </div>
                  <div className="bg-accent-50 rounded-xl p-4 text-center">
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-accent-600 mx-auto mb-2" />
                    <p className="text-2xl lg:text-3xl font-bold text-gray-900">{chatsCount}</p>
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
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{displayEmail}</p>
                  </div>
                </div>

                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full mr-3 shadow-sm">
                    <PhoneIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Phone</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{displayPhone}</p>
                  </div>
                </div>

                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full mr-3 shadow-sm">
                    <MapPinIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Location</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{displayLocation}</p>
                  </div>
                </div>

                <div className="flex items-center bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full mr-3 shadow-sm">
                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium">Joined</p>
                    <p className="text-sm sm:text-base text-gray-900 font-semibold">{joinedDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Mobile */}
            <div className="sm:hidden border-t-2 border-gray-100 p-5 pb-8 bg-gray-50">
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
          <div className="hidden sm:flex justify-center space-x-4 mt-8 mb-8">
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

      {/* Profile Edit Modal */}
      {isEditing && (
        <ProfileEditModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          profile={profileData || {
            id: user?.id || '',
            full_name: user?.user_metadata?.full_name || 'New User',
            username: null,
            avatar_url: null,
            bio: null,
            phone: null,
            location: null,
            website: null,
            is_online: true,
            last_seen: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}