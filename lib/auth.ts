import { supabase } from './supabase'
import { User, AuthError } from '@supabase/supabase-js'
import { ProfileService } from './profiles'

export interface AuthUser {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
}

export interface SignUpData {
  email: string
  password: string
  fullName?: string
}

export interface SignInData {
  email: string
  password: string
}

export class AuthService {
  static async signUp({ email, password, fullName }: SignUpData) {
    console.log('🔵 Starting signup process...', { email, fullName })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        }
      }
    })

    console.log('🔵 Supabase signup response:', { data, error })

    if (error) {
      // Provide more user-friendly error messages
      let userMessage = error.message
      
      if (error.message.includes('User already registered')) {
        userMessage = 'An account with this email already exists. Please sign in instead.'
      } else if (error.message.includes('Password should be at least')) {
        userMessage = 'Password must be at least 6 characters long.'
      } else if (error.message.includes('Invalid email')) {
        userMessage = 'Please enter a valid email address.'
      } else if (error.message.includes('Signup is disabled')) {
        userMessage = 'Account creation is currently disabled. Please contact support.'
      }
      
      throw new Error(userMessage)
    }

    // Try to create profile manually if the trigger fails
    if (data.user && fullName) {
      try {
        // Wait a moment for the trigger to potentially create the profile
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Try to create or update the profile
        try {
          await ProfileService.createProfile(data.user.id, {
            full_name: fullName
          })
          console.log('🟢 Profile created manually')
        } catch (createError) {
          // If creation fails, try to update (profile might already exist)
          try {
            await ProfileService.updateProfile(data.user.id, {
              full_name: fullName
            })
            console.log('🟢 Profile updated')
          } catch (updateError) {
            console.warn('⚠️ Profile creation/update failed:', createError, updateError)
          }
        }
      } catch (profileError) {
        console.warn('⚠️ Profile handling failed:', profileError)
        // Don't throw error here as the main signup was successful
      }
    }

    return data
  }

  static async signIn({ email, password }: SignInData) {
    console.log('🔵 Starting signin process...', { email })
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('🔵 Supabase signin response:', { data, error })

    if (error) {
      // Provide more user-friendly error messages
      let userMessage = error.message
      
      if (error.message.includes('Invalid login credentials')) {
        userMessage = 'Invalid email or password. Please check your credentials and try again.'
      } else if (error.message.includes('Email not confirmed')) {
        userMessage = 'Please check your email and click the confirmation link before signing in.'
      } else if (error.message.includes('Too many requests')) {
        userMessage = 'Too many login attempts. Please wait a moment before trying again.'
      }
      
      throw new Error(userMessage)
    }

    // Update online status when user signs in
    if (data.user) {
      try {
        await ProfileService.updateOnlineStatus(data.user.id, true)
      } catch (profileError) {
        console.warn('Failed to update online status:', profileError)
      }
    }

    return data
  }

  static async signOut() {
    // Get current user before signing out
    const { data: { user } } = await supabase.auth.getUser()
    
    // Update online status before signing out
    if (user) {
      try {
        await ProfileService.updateOnlineStatus(user.id, false)
      } catch (profileError) {
        console.warn('Failed to update online status on signout:', profileError)
      }
    }

    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(error.message)
    }
  }

  static async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  static async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
  }
}