"use client";

import { useState } from "react";
import {
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";

interface SettingSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    messages: true,
    friendRequests: true,
    emailNotifications: false,
    pushNotifications: true,
  });
  const [privacy, setPrivacy] = useState({
    profileVisibility: "friends",
    onlineStatus: true,
    readReceipts: true,
  });
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  const settingSections: SettingSection[] = [
    {
      id: "notifications",
      title: "Notifications",
      icon: BellIcon,
      description: "Message alerts and sounds",
    },
    {
      id: "privacy",
      title: "Privacy",
      icon: ShieldCheckIcon,
      description: "Profile and online visibility",
    },
    {
      id: "appearance",
      title: "Appearance",
      icon: PaintBrushIcon,
      description: "Theme and display settings",
    },
    {
      id: "account",
      title: "Account",
      icon: UserCircleIcon,
      description: "Profile and account info",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        {activeSection ? (
          <div className="flex items-center">
            <button
              onClick={() => setActiveSection(null)}
              className="p-2 -ml-2 mr-2"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-600 rotate-180" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {settingSections.find(s => s.id === activeSection)?.title}
            </h1>
          </div>
        ) : (
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        )}
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your preferences</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex flex-col w-80 bg-white border-r border-gray-200">
          <nav className="flex-1 p-4">
            {settingSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all mb-2 ${
                    activeSection === section.id
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-3 ${
                    activeSection === section.id ? "text-primary-600" : "text-gray-400"
                  }`} />
                  <div className="text-left">
                    <p className="font-medium text-sm">{section.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                  </div>
                </button>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-100">
            <button className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all">
              <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Mobile - Settings List or Section Content */}
          <div className="lg:hidden">
            {!activeSection ? (
              /* Mobile Settings List */
              <div className="px-4 py-4 space-y-2">
                {settingSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className="w-full flex items-center justify-between p-4 bg-white rounded-xl hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                          <Icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{section.title}</p>
                          <p className="text-xs text-gray-500">{section.description}</p>
                        </div>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    </button>
                  );
                })}
                
                {/* Sign Out Button - Mobile */}
                <button className="w-full flex items-center justify-between p-4 bg-white rounded-xl hover:bg-red-50 transition-all mt-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="font-medium text-red-600">Sign Out</p>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-red-400" />
                </button>
              </div>
            ) : (
              /* Mobile Section Content */
              <div className="px-4 py-4">
                {renderSectionContent(activeSection)}
              </div>
            )}
          </div>

          {/* Desktop - Section Content */}
          <div className="hidden lg:block p-8">
            <div className="max-w-3xl">
              {activeSection ? (
                renderSectionContent(activeSection)
              ) : (
                <div className="bg-white rounded-xl p-8 text-center">
                  <PaintBrushIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Setting</h3>
                  <p className="text-sm text-gray-500">Choose a category from the sidebar to manage your preferences</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function renderSectionContent(section: string) {
    switch (section) {
      case "notifications":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 lg:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h2>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="flex-1 mr-4">
                    <p className="font-medium text-gray-900 text-sm lg:text-base">New Messages</p>
                    <p className="text-xs lg:text-sm text-gray-500">Get notified for new messages</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifications.messages}
                      onChange={(e) => setNotifications({ ...notifications, messages: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      notifications.messages ? 'bg-primary-500' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        notifications.messages ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`} />
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="flex-1 mr-4">
                    <p className="font-medium text-gray-900 text-sm lg:text-base">Friend Requests</p>
                    <p className="text-xs lg:text-sm text-gray-500">Alerts for new friend requests</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifications.friendRequests}
                      onChange={(e) => setNotifications({ ...notifications, friendRequests: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      notifications.friendRequests ? 'bg-primary-500' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        notifications.friendRequests ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`} />
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="flex-1 mr-4">
                    <p className="font-medium text-gray-900 text-sm lg:text-base">Email Notifications</p>
                    <p className="text-xs lg:text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      notifications.emailNotifications ? 'bg-primary-500' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        notifications.emailNotifications ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`} />
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="flex-1 mr-4">
                    <p className="font-medium text-gray-900 text-sm lg:text-base">Push Notifications</p>
                    <p className="text-xs lg:text-sm text-gray-500">Mobile push notifications</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={notifications.pushNotifications}
                      onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      notifications.pushNotifications ? 'bg-primary-500' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        notifications.pushNotifications ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`} />
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 lg:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h2>
              
              <div className="space-y-4">
                <div className="p-3">
                  <label className="font-medium text-gray-900 text-sm lg:text-base block mb-2">
                    Profile Visibility
                  </label>
                  <select
                    value={privacy.profileVisibility}
                    onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm lg:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="flex-1 mr-4">
                    <p className="font-medium text-gray-900 text-sm lg:text-base">Online Status</p>
                    <p className="text-xs lg:text-sm text-gray-500">Show when you're online</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={privacy.onlineStatus}
                      onChange={(e) => setPrivacy({ ...privacy, onlineStatus: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      privacy.onlineStatus ? 'bg-primary-500' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        privacy.onlineStatus ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`} />
                    </div>
                  </div>
                </label>

                <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="flex-1 mr-4">
                    <p className="font-medium text-gray-900 text-sm lg:text-base">Read Receipts</p>
                    <p className="text-xs lg:text-sm text-gray-500">Show when you've read messages</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={privacy.readReceipts}
                      onChange={(e) => setPrivacy({ ...privacy, readReceipts: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      privacy.readReceipts ? 'bg-primary-500' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        privacy.readReceipts ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`} />
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Blocked Users</h3>
              <p className="text-sm text-gray-600 mb-4">You haven't blocked anyone</p>
              <button className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Manage Blocked Users
              </button>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 lg:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Theme</h2>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === "light"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <SunIcon className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <p className="text-sm font-medium text-gray-900">Light</p>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === "dark"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <MoonIcon className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <p className="text-sm font-medium text-gray-900">Dark</p>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    theme === "system"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <DevicePhoneMobileIcon className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <p className="text-sm font-medium text-gray-900">System</p>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Display</h3>
              <div className="space-y-3">
                <div>
                  <label className="font-medium text-gray-900 text-sm block mb-2">Font Size</label>
                  <select className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white">
                    <option>Small</option>
                    <option>Medium</option>
                    <option>Large</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case "account":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 lg:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="font-medium text-gray-900">John Doe</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-900">john.doe@example.com</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">+1 (555) 123-4567</p>
                </div>
                <button className="px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                  Edit Account Info
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Account Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Change Password
                </button>
                <button className="w-full text-left px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Download Your Data
                </button>
                <button className="w-full text-left px-4 py-2 text-sm font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
}