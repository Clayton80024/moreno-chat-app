"use client"

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useAuth } from '@/contexts/AuthContext'
import { Menu } from '@headlessui/react'
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'

interface UserButtonProps {
  user: User
}

export default function UserButton({ user }: UserButtonProps) {
  const { signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const userInitials = user.user_metadata?.full_name 
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center p-1 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors">
        {user.user_metadata?.avatar_url ? (
          <img 
            src={user.user_metadata.avatar_url} 
            alt="Profile" 
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-sm font-semibold">
            {userInitials}
          </div>
        )}
      </Menu.Button>

      <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {user.user_metadata?.full_name || 'User'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {user.email}
          </p>
        </div>
        
        <Menu.Item>
          {({ active }) => (
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className={`${
                active ? 'bg-gray-100 dark:bg-gray-700' : ''
              } flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50`}
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
              {isSigningOut ? 'Signing out...' : 'Sign out'}
            </button>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  )
}