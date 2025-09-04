"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  UserCircleIcon, 
  Cog6ToothIcon,
  PlusCircleIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/outline";
import {
  ChatBubbleLeftRightIcon as ChatSolid,
  UserGroupIcon as UsersSolid,
  UserCircleIcon as ProfileSolid,
  Cog6ToothIcon as SettingsSolid,
} from "@heroicons/react/24/solid";

const navigation = [
  { name: "Chats", href: "/chats", icon: ChatBubbleLeftRightIcon, activeIcon: ChatSolid },
  { name: "Friends", href: "/friends", icon: UserGroupIcon, activeIcon: UsersSolid },
  { name: "Profile", href: "/profile", icon: UserCircleIcon, activeIcon: ProfileSolid },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon, activeIcon: SettingsSolid },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 w-72">
      {/* Logo Section */}
      <div className="px-6 py-6 border-b border-gray-100 dark:border-gray-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-black">
          Moreno Chat
        </h1>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 rounded-full text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white dark:focus:bg-gray-600 transition-all"
          />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive ? item.activeIcon : item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-4 py-3 rounded-xl transition-all duration-200
                ${isActive 
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`} />
              <span className="ml-3 font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* New Chat Button */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-md hover:shadow-lg">
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          <span className="font-medium">New Chat</span>
        </button>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center px-3 py-2">
          <div className="relative">
            <img 
              src="https://i.pravatar.cc/150?img=7" 
              alt="John Doe"
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-online rounded-full border-2 border-white"></div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">John Doe</p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
      </div>
    </div>
  );
}