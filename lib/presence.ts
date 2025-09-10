import { supabase } from './supabase'

export interface UserPresence {
  id: string
  user_id: string
  status: 'online' | 'away' | 'offline'
  last_seen: string
  updated_at: string
}

export interface OnlineUser {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  is_online: boolean
  last_seen: string | null
  status: 'online' | 'away' | 'offline'
}

export class PresenceService {
  // Test function to check if user_presence table is accessible
  static async testPresenceTable(): Promise<boolean> {
    try {
      console.log('🔵 Testing user_presence table accessibility...')
      
      // Test basic select
      const { data, error } = await supabase
        .from('user_presence')
        .select('id')
        .limit(1)

      if (error) {
        console.error('🔴 user_presence table test failed:', error)
        console.error('🔴 Error code:', error.code)
        console.error('🔴 Error message:', error.message)
        console.error('🔴 Error details:', error.details)
        console.error('🔴 Error hint:', error.hint)
        return false
      }

      console.log('✅ user_presence table is accessible')
      console.log('🔵 Test data:', data)
      return true
    } catch (error) {
      console.error('🔴 user_presence table test error:', error)
      return false
    }
  }

  // Update user's online status
  static async updateStatus(userId: string, status: 'online' | 'away' | 'offline'): Promise<UserPresence> {
    try {
      console.log('🔵 Updating user status:', userId, 'to:', status)
      
      // First, test if the user_presence table is accessible
      const isPresenceTableAccessible = await this.testPresenceTable()
      if (!isPresenceTableAccessible) {
        throw new Error('User presence table is not accessible. Please check RLS policies.')
      }
      
      const { data, error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: userId,
          status,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('🔴 Error updating user status:', error)
        console.error('🔴 Error code:', error.code)
        console.error('🔴 Error message:', error.message)
        console.error('🔴 Error details:', error.details)
        console.error('🔴 Error hint:', error.hint)
        console.error('🔴 Full error object:', JSON.stringify(error, null, 2))
        
        // If there's an RLS issue, provide helpful error message
        if (error.message?.includes('row-level security') || 
            error.message?.includes('policy') ||
            error.code === '42501') {
          throw new Error('Permission denied: Unable to update presence status. Please check RLS policies.')
        }
        
        throw new Error(error.message || 'Failed to update user status')
      }

      console.log('✅ Successfully updated user status:', data)

      // Also update the user_profiles table for consistency
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            is_online: status === 'online',
            last_seen: new Date().toISOString()
          })
          .eq('id', userId)

        if (profileError) {
          console.warn('⚠️ Error updating user profile:', profileError)
          // Don't throw here, as the main presence update succeeded
        } else {
          console.log('✅ Successfully updated user profile')
        }
      } catch (profileError) {
        console.warn('⚠️ Error updating user profile:', profileError)
        // Don't throw here, as the main presence update succeeded
      }

      return data
    } catch (error) {
      console.error('🔴 Error in updateStatus:', error)
      throw error
    }
  }

  // Get user's current status
  static async getUserStatus(userId: string): Promise<UserPresence | null> {
    const { data, error } = await supabase
      .from('user_presence')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('🔴 Error fetching user status:', error)
      throw new Error(error.message)
    }

    return data
  }

  // Get online friends for a user
  static async getOnlineFriends(userId: string): Promise<OnlineUser[]> {
    try {
      console.log('🔵 Getting online friends for user:', userId);
      
      // First, get all accepted friends
      const { data: friends, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

      if (friendsError) {
        console.error('🔴 Error fetching friends:', friendsError);
        console.error('🔴 Error details:', friendsError);
        throw new Error(`Failed to fetch friends: ${friendsError.message}`);
      }

      if (!friends || friends.length === 0) {
        console.log('🔵 No friends found for user');
        return [];
      }

      const friendIds = friends.map(f => f.friend_id);
      console.log('🔵 Found friends:', friendIds.length, 'friend IDs:', friendIds);
      console.log('🔵 Friends details:', friends.map(f => ({ id: f.friend_id })));

      // Get presence data for all friends
      const { data: presenceData, error: presenceError } = await supabase
        .from('user_presence')
        .select('user_id, status, last_seen')
        .in('user_id', friendIds)
        .eq('status', 'online');

      if (presenceError) {
        console.error('🔴 Error fetching presence data:', presenceError);
        throw new Error(presenceError.message);
      }

      if (!presenceData || presenceData.length === 0) {
        console.log('🔵 No online friends found');
        return [];
      }

      const onlineFriendIds = presenceData.map(p => p.user_id);
      console.log('🔵 Online friend IDs:', onlineFriendIds);

      // Get profile data for online friends
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, username, avatar_url, is_online, last_seen')
        .in('id', onlineFriendIds);

      if (profilesError) {
        console.error('🔴 Error fetching profiles:', profilesError);
        throw new Error(profilesError.message);
      }

      // Combine presence and profile data
      const onlineFriends = (profiles || []).map(profile => {
        const presence = presenceData.find(p => p.user_id === profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name,
          username: profile.username,
          avatar_url: profile.avatar_url,
          is_online: true,
          last_seen: presence?.last_seen || profile.last_seen,
          status: presence?.status as 'online' | 'away' | 'offline' || 'online'
        };
      });

      console.log('✅ Successfully loaded online friends:', onlineFriends.length);
      return onlineFriends;
    } catch (error) {
      console.error('🔴 Error in getOnlineFriends:', error);
      throw error;
    }
  }

  // Get all online users (for admin purposes or public directory)
  static async getOnlineUsers(limit: number = 50): Promise<OnlineUser[]> {
    const { data, error } = await supabase
      .from('user_presence')
      .select(`
        *,
        user_profile:user_profiles!user_presence_user_id_fkey(
          id,
          full_name,
          username,
          avatar_url,
          is_online,
          last_seen
        )
      `)
      .eq('status', 'online')
      .order('last_seen', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('🔴 Error fetching online users:', error)
      throw new Error(error.message)
    }

    return (data || []).map(presence => ({
      id: presence.user_profile.id,
      full_name: presence.user_profile.full_name,
      username: presence.user_profile.username,
      avatar_url: presence.user_profile.avatar_url,
      is_online: true,
      last_seen: presence.last_seen,
      status: presence.status
    }))
  }

  // Set user as away (called when user is inactive)
  static async setAway(userId: string): Promise<void> {
    await this.updateStatus(userId, 'away')
  }

  // Set user as offline (called when user logs out)
  static async setOffline(userId: string): Promise<void> {
    await this.updateStatus(userId, 'offline')
  }

  // Set user as online (called when user logs in)
  static async setOnline(userId: string): Promise<void> {
    await this.updateStatus(userId, 'online')
  }

  // Get users who were recently active (within last 24 hours)
  static async getRecentlyActiveUsers(userId: string, limit: number = 20): Promise<OnlineUser[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('user_presence')
      .select(`
        *,
        user_profile:user_profiles!user_presence_user_id_fkey(
          id,
          full_name,
          username,
          avatar_url,
          is_online,
          last_seen
        )
      `)
      .neq('user_id', userId)
      .gte('last_seen', twentyFourHoursAgo)
      .order('last_seen', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('🔴 Error fetching recently active users:', error)
      throw new Error(error.message)
    }

    return (data || []).map(presence => ({
      id: presence.user_profile.id,
      full_name: presence.user_profile.full_name,
      username: presence.user_profile.username,
      avatar_url: presence.user_profile.avatar_url,
      is_online: presence.status === 'online',
      last_seen: presence.last_seen,
      status: presence.status
    }))
  }

  // Subscribe to presence changes for real-time updates
  static subscribeToPresenceChanges(userId: string, callback: (presence: UserPresence) => void) {
    const subscription = supabase
      .channel('presence_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_presence',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        callback(payload.new as UserPresence)
      })
      .subscribe()

    return subscription
  }

  // Subscribe to friends' presence changes
  static subscribeToFriendsPresence(userId: string, callback: (presence: UserPresence) => void) {
    // First get friend IDs
    return supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .then(({ data: friends }) => {
        if (!friends || friends.length === 0) {
          return null
        }

        const friendIds = friends.map(f => f.friend_id)
        
        const subscription = supabase
          .channel('friends_presence')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'user_presence',
            filter: `user_id=in.(${friendIds.join(',')})`
          }, (payload) => {
            callback(payload.new as UserPresence)
          })
          .subscribe()

        return subscription
      })
  }
}
