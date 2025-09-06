import { supabase } from './supabase'

export interface UserProfile {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  phone: string | null
  location: string | null
  website: string | null
  is_online: boolean
  last_seen: string | null
  created_at: string
  updated_at: string
}

export interface ProfileUpdate {
  full_name?: string
  username?: string
  avatar_url?: string
  bio?: string
  phone?: string
  location?: string
  website?: string
}

export class ProfileService {
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, return null
        return null
      }
      throw new Error(error.message)
    }

    return data
  }

  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<UserProfile> {
    // Update the user_profiles table
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('🔴 Profile update error:', error)
      if (error.code === '42501') {
        throw new Error('Permission denied. Please make sure you are logged in and have permission to update your profile.')
      }
      throw new Error(error.message)
    }

    // Also update the auth user account with relevant fields
    try {
      const authUpdates: any = {}
      
      // Update metadata fields
      if (updates.full_name) {
        authUpdates.full_name = updates.full_name
      }
      
      if (updates.avatar_url) {
        authUpdates.avatar_url = updates.avatar_url
      }

      // Update metadata if we have metadata fields to update
      if (Object.keys(authUpdates).length > 0) {
        console.log('🔵 Updating auth user metadata:', authUpdates)
        
        const { error: authError } = await supabase.auth.updateUser({
          data: authUpdates
        })

        if (authError) {
          console.warn('⚠️ Failed to update auth metadata:', authError.message)
          // Don't throw error - profile update succeeded, metadata sync failed
        } else {
          console.log('🟢 Auth metadata updated successfully')
        }
      }
    } catch (syncError) {
      console.warn('⚠️ Profile-auth sync warning:', syncError)
      // Don't throw error - main profile update succeeded
    }

    return data
  }

  static async createProfile(userId: string, profileData: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        ...profileData
      })
      .select()
      .single()

    if (error) {
      console.error('🔴 Profile creation error:', error)
      if (error.code === '42501') {
        throw new Error('Permission denied. Please make sure you are logged in and have permission to create your profile.')
      }
      throw new Error(error.message)
    }

    return data
  }

  static async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      throw new Error(error.message)
    }
  }

  static async searchProfiles(searchTerm: string, limit: number = 10): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
      .limit(limit)

    if (error) {
      throw new Error(error.message)
    }

    return data || []
  }

  static async checkUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    let query = supabase
      .from('user_profiles')
      .select('id')
      .eq('username', username)

    if (excludeUserId) {
      query = query.neq('id', excludeUserId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return !data || data.length === 0
  }
}