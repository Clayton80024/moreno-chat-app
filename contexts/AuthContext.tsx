"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { AuthService } from '@/lib/auth'
import { ProfileService, UserProfile } from '@/lib/profiles'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserProfile = async (user: User | null) => {
    if (user) {
      try {
        const userProfile = await ProfileService.getUserProfile(user.id)
        setProfile(userProfile)
      } catch (error) {
        console.error('Error loading user profile:', error)
        setProfile(null)
      }
    } else {
      setProfile(null)
    }
  }

  useEffect(() => {
    const getInitialUser = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser()
        setUser(currentUser)
        await loadUserProfile(currentUser)
      } catch (error) {
        console.error('Error getting initial user:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialUser()

    const { data: { subscription } } = AuthService.onAuthStateChange(async (user) => {
      setUser(user)
      await loadUserProfile(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('🔵 AuthContext: signUp called', { email, fullName })
    setLoading(true)
    try {
      await AuthService.signUp({ email, password, fullName })
      console.log('🟢 AuthContext: signUp successful')
      // Profile will be loaded automatically by the auth state change listener
    } catch (error) {
      // Error is already handled by AuthService with user-friendly messages
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('🔵 AuthContext: signIn called', { email })
    setLoading(true)
    try {
      await AuthService.signIn({ email, password })
      console.log('🟢 AuthContext: signIn successful')
      // Profile will be loaded automatically by the auth state change listener
    } catch (error) {
      // Error is already handled by AuthService with user-friendly messages
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await AuthService.signOut()
    } catch (error) {
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await AuthService.resetPassword(email)
    } catch (error) {
      throw error
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}