"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { 
  XMarkIcon,
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
import { useAuth } from "@/contexts/AuthContext";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Chats", href: "/chats", icon: ChatBubbleLeftRightIcon, activeIcon: ChatSolid },
  { name: "Friends", href: "/friends", icon: UserGroupIcon, activeIcon: UsersSolid },
  { name: "Profile", href: "/profile", icon: UserCircleIcon, activeIcon: ProfileSolid },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon, activeIcon: SettingsSolid },
];

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                <div className="flex h-16 shrink-0 items-center justify-between">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-black">
                    Moreno Chat
                  </h1>
                  <button
                    type="button"
                    className="p-2 -mr-2"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-600" aria-hidden="true" />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    aria-label="Search conversations"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 focus:bg-white transition-all"
                  />
                </div>

                <nav className="flex flex-1 flex-col">
                  <ul className="flex flex-1 flex-col gap-y-1">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = isActive ? item.activeIcon : item.icon;
                      
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={`
                              flex items-center px-4 py-3 rounded-xl transition-all duration-200
                              ${isActive 
                                ? 'bg-primary-100 text-primary-700' 
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }
                            `}
                          >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                            <span className="ml-3 font-medium">{item.name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* New Chat Button 
                <button 
                  type="button"
                  aria-label="Start new chat"
                  className="w-full text-black flex items-center justify-center px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <PlusCircleIcon className="w-5 h-5 mr-2 text-black" />
                  <span className="font-medium text-black">New Chat</span>
                </button>
                */}
                {/* User Profile Section */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-center px-3 py-2">
                    <div className="relative">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.full_name || "User"}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-md">
                          {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        profile?.is_online ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.full_name || "User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {profile?.is_online ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}