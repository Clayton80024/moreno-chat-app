import { supabase } from './supabase'

export interface Friend {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  updated_at: string
  // Joined profile data
  friend_profile?: {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    bio: string | null
    is_online: boolean
    last_seen: string | null
  }
}

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'declined'
  message?: string
  created_at: string
  updated_at: string
  // Joined profile data
  sender_profile?: {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    bio: string | null
    is_online: boolean
  }
  receiver_profile?: {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    bio: string | null
    is_online: boolean
  }
}

export interface SearchUser {
  id: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  is_online: boolean
  last_seen: string | null
  mutual_friends?: number
}

export class FriendsService {
  // Test function to check if friend_requests table is accessible
  static async testFriendRequestsTable(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('id')
        .limit(1)

      if (error) {
        console.error('🔴 friend_requests table test failed:', error)
        return false
      }

      console.log('✅ friend_requests table is accessible')
      return true
    } catch (error) {
      console.error('🔴 friend_requests table test error:', error)
      return false
    }
  }

  // Test function to check if friends table is accessible
  static async testFriendsTable(): Promise<boolean> {
    try {
      console.log('🔵 Testing friends table accessibility...')
      
      // Test 1: Basic select without any filters
      console.log('🔵 Test 1: Basic select...')
      const { data: test1, error: error1 } = await supabase
        .from('friends')
        .select('id')
        .limit(1)

      if (error1) {
        console.error('🔴 Test 1 failed:', error1)
        console.error('🔴 Error code:', error1.code)
        console.error('🔴 Error message:', error1.message)
        console.error('🔴 Error details:', error1.details)
        console.error('🔴 Error hint:', error1.hint)
        console.error('🔴 Full error object:', JSON.stringify(error1, null, 2))
        
        // Test 2: Try with user filter
        console.log('🔵 Test 2: Select with user filter...')
        const { data: test2, error: error2 } = await supabase
          .from('friends')
          .select('id')
          .eq('user_id', '00000000-0000-0000-0000-000000000000') // Dummy UUID
          .limit(1)

        if (error2) {
          console.error('🔴 Test 2 also failed:', error2)
          console.error('🔴 Error code:', error2.code)
          console.error('🔴 Error message:', error2.message)
        } else {
          console.log('✅ Test 2 succeeded - issue might be with RLS policies')
        }
        
        return false
      }

      console.log('✅ friends table is accessible')
      console.log('🔵 Test 1 data:', test1)
      return true
    } catch (error) {
      console.error('🔴 friends table test error:', error)
      return false
    }
  }
  // Get all friends for a user
  static async getFriends(userId: string, status: 'accepted' | 'pending' | 'blocked' = 'accepted'): Promise<Friend[]> {
    try {
      console.log('🔵 Getting friends for user:', userId, 'with status:', status)
      
      // First, test if the friends table is accessible
      const isFriendsTableAccessible = await this.testFriendsTable()
      if (!isFriendsTableAccessible) {
        console.warn('⚠️ Friends table is not accessible, returning empty array')
        return []
      }

      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('🔴 Error fetching friends:', error)
        console.error('🔴 Error code:', error.code)
        console.error('🔴 Error message:', error.message)
        console.error('🔴 Error details:', error.details)
        console.error('🔴 Error hint:', error.hint)
        console.error('🔴 Full error object:', JSON.stringify(error, null, 2))
        
        // If there's an RLS issue, return empty array instead of throwing
        if (error.message?.includes('permission') || 
            error.message?.includes('policy') ||
            error.code === '42501' ||
            error.code === '2BP01' ||
            error.code === '42710') {
          console.warn('⚠️ RLS policy issue detected, returning empty friends array')
          return []
        }
        throw new Error(error.message || 'Failed to fetch friends')
      }

      // Get friend profiles separately to avoid foreign key issues
      const friendsWithProfiles = await Promise.all(
        (data || []).map(async (friend) => {
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('id, full_name, username, avatar_url, bio, is_online, last_seen')
              .eq('id', friend.friend_id)
              .single()

            return {
              ...friend,
              friend_profile: profile
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch friend profile for:', friend.friend_id, error)
            return {
              ...friend,
              friend_profile: null
            }
          }
        })
      )

      console.log('✅ Successfully fetched friends:', friendsWithProfiles.length)
      return friendsWithProfiles
    } catch (error) {
      console.error('🔴 Error in getFriends:', error)
      // Return empty array instead of throwing to prevent app crashes
      return []
    }
  }

  // Get friend requests (sent and received)
  static async getFriendRequests(userId: string): Promise<{
    sent: FriendRequest[]
    received: FriendRequest[]
  }> {
    try {
      console.log('🔵 Getting friend requests for user:', userId)
      console.log('🔵 User ID type:', typeof userId, 'Length:', userId.length)
      
      // First, let's check if the friend_requests table exists and is accessible
      const { data: testData, error: testError } = await supabase
        .from('friend_requests')
        .select('id')
        .limit(1)

      if (testError) {
        console.error('🔴 Error accessing friend_requests table:', testError)
        console.error('🔴 Test error details:', {
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint
        })
        // If the table doesn't exist or we don't have access, return empty arrays
        return {
          sent: [],
          received: []
        }
      }

      console.log('✅ friend_requests table is accessible')
      console.log('🔵 Test data:', testData)

      // Check if there are ANY friend requests in the table
      const { data: allRequests, error: allRequestsError } = await supabase
        .from('friend_requests')
        .select('*')
        .limit(10)

      console.log('🔵 All friend requests in table:', allRequests)
      console.log('🔵 All requests error:', allRequestsError)

      // Now get the actual friend requests
      const [sentResult, receivedResult] = await Promise.all([
        // Sent requests
        supabase
          .from('friend_requests')
          .select('*')
          .eq('sender_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),

        // Received requests
        supabase
          .from('friend_requests')
          .select('*')
          .eq('receiver_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
      ])

      console.log('🔵 Sent requests result:', sentResult)
      console.log('🔵 Received requests result:', receivedResult)
      console.log('🔵 Sent requests count:', sentResult.data?.length || 0)
      console.log('🔵 Received requests count:', receivedResult.data?.length || 0)

      if (sentResult.error) {
        console.error('🔴 Error fetching sent requests:', sentResult.error)
        console.error('🔴 Sent error details:', {
          code: sentResult.error.code,
          message: sentResult.error.message,
          details: sentResult.error.details,
          hint: sentResult.error.hint
        })
        // Don't throw error, just log it and continue
      }

      if (receivedResult.error) {
        console.error('🔴 Error fetching received requests:', receivedResult.error)
        console.error('🔴 Received error details:', {
          code: receivedResult.error.code,
          message: receivedResult.error.message,
          details: receivedResult.error.details,
          hint: receivedResult.error.hint
        })
        // Don't throw error, just log it and continue
      }

      // Get profile data for sent requests
      const sentRequests = await Promise.all(
        (sentResult.data || []).map(async (request) => {
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('id, full_name, username, avatar_url, bio, is_online')
              .eq('id', request.receiver_id)
              .single()

            return {
              ...request,
              receiver_profile: profile
            }
          } catch (error) {
            console.error('🔴 Error fetching receiver profile:', error)
            return {
              ...request,
              receiver_profile: null
            }
          }
        })
      )

      // Get profile data for received requests
      const receivedRequests = await Promise.all(
        (receivedResult.data || []).map(async (request) => {
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('id, full_name, username, avatar_url, bio, is_online')
              .eq('id', request.sender_id)
              .single()

            return {
              ...request,
              sender_profile: profile
            }
          } catch (error) {
            console.error('🔴 Error fetching sender profile:', error)
            return {
              ...request,
              sender_profile: null
            }
          }
        })
      )

      console.log('✅ Successfully fetched friend requests:', { sent: sentRequests.length, received: receivedRequests.length })

      return {
        sent: sentRequests,
        received: receivedRequests
      }
    } catch (error) {
      console.error('🔴 Error in getFriendRequests:', error)
      // Return empty arrays if there's an error
      return {
        sent: [],
        received: []
      }
    }
  }

  // Send a friend request
  static async sendFriendRequest(senderId: string, receiverId: string, message?: string): Promise<FriendRequest> {
    try {
      console.log('🔵 Sending friend request from:', senderId, 'to:', receiverId)
      
      // First, debug the current state of the data
      const debugData = await this.debugFriendshipData(senderId, receiverId)
      if (debugData.inconsistencies.length > 0) {
        console.warn('⚠️ Data inconsistencies found:', debugData.inconsistencies)
        console.warn('⚠️ Friends data:', debugData.friendsData)
        console.warn('⚠️ Friend requests data:', debugData.friendRequestsData)
      }
      
      // Check if users are already friends - simplified approach
      console.log('🔵 Checking for existing friendship...')
      
      // Check friendship in both directions separately to avoid complex OR queries
      const [friendship1, friendship2] = await Promise.all([
        supabase
          .from('friends')
          .select('id, status, user_id, friend_id')
          .eq('user_id', senderId)
          .eq('friend_id', receiverId)
          .single(),
        supabase
          .from('friends')
          .select('id, status, user_id, friend_id')
          .eq('user_id', receiverId)
          .eq('friend_id', senderId)
          .single()
      ])

      // Check if either friendship exists
      const existingFriendship = friendship1.data || friendship2.data
      if (existingFriendship) {
        console.log('🔴 Existing friendship found:', existingFriendship)
        console.log('🔴 Friendship status:', existingFriendship.status)
        console.log('🔴 Friendship user_id:', existingFriendship.user_id)
        console.log('🔴 Friendship friend_id:', existingFriendship.friend_id)
        
        // Provide more specific error message based on friendship status
        if (existingFriendship.status === 'accepted') {
          throw new Error('You are already friends with this user')
        } else if (existingFriendship.status === 'pending') {
          throw new Error('A friendship request is already pending between you and this user')
        } else if (existingFriendship.status === 'blocked') {
          throw new Error('This user has been blocked')
        } else {
          throw new Error('A friendship relationship already exists between you and this user')
        }
      }

      console.log('✅ No existing friendship found')

      // Check for existing friend request - simplified approach
      console.log('🔵 Checking for existing friend request...')
      
      const [request1, request2] = await Promise.all([
        supabase
          .from('friend_requests')
          .select('id, status, sender_id, receiver_id')
          .eq('sender_id', senderId)
          .eq('receiver_id', receiverId)
          .single(),
        supabase
          .from('friend_requests')
          .select('id, status, sender_id, receiver_id')
          .eq('sender_id', receiverId)
          .eq('receiver_id', senderId)
          .single()
      ])

      // Check if either request exists
      const existingRequest = request1.data || request2.data
      if (existingRequest) {
        console.log('🔴 Friend request already exists:', existingRequest)
        console.log('🔴 Request status:', existingRequest.status)
        console.log('🔴 Request sender:', existingRequest.sender_id)
        console.log('🔴 Request receiver:', existingRequest.receiver_id)
        
        // Provide more helpful error message based on the request status
        if (existingRequest.status === 'pending') {
          if (existingRequest.sender_id === senderId) {
            throw new Error('You have already sent a friend request to this user')
          } else {
            throw new Error('This user has already sent you a friend request. Please check your received requests.')
          }
        } else if (existingRequest.status === 'accepted') {
          throw new Error('You are already friends with this user')
        } else if (existingRequest.status === 'declined') {
          throw new Error('Your previous friend request was declined. Please wait before sending another request.')
        } else {
          throw new Error('A friend request already exists between you and this user')
        }
      }

      console.log('✅ No existing friend request found')

      // Create friend request
      console.log('🔵 Creating friend request...')
      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          message: message || null,
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('🔴 Error sending friend request:', error)
        console.error('🔴 Error code:', error.code)
        console.error('🔴 Error message:', error.message)
        console.error('🔴 Error details:', error.details)
        console.error('🔴 Error hint:', error.hint)
        throw new Error(error.message || 'Failed to send friend request')
      }

      console.log('✅ Successfully sent friend request:', data)
      return data
    } catch (error) {
      console.error('🔴 Error in sendFriendRequest:', error)
      throw error
    }
  }

  // Accept a friend request
  static async acceptFriendRequest(requestId: string, userId: string): Promise<Friend> {
    try {
      console.log('🔵 Accepting friend request:', requestId, 'for user:', userId)
      
      // First, test if the friends table is accessible
      const isFriendsTableAccessible = await this.testFriendsTable()
      if (!isFriendsTableAccessible) {
        throw new Error('Friends table is not accessible. Please check RLS policies.')
      }

      // Get the friend request
      const { data: request, error: fetchError } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('id', requestId)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .single()

      if (fetchError) {
        console.error('🔴 Error fetching friend request:', fetchError)
        console.error('🔴 Error code:', fetchError.code)
        console.error('🔴 Error message:', fetchError.message)
        throw new Error('Friend request not found')
      }

      console.log('🔵 Found friend request:', request)

      // Update the request status
      const { error: updateRequestError } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (updateRequestError) {
        console.error('🔴 Error updating friend request:', updateRequestError)
        console.error('🔴 Error code:', updateRequestError.code)
        console.error('🔴 Error message:', updateRequestError.message)
        throw new Error(updateRequestError.message)
      }

      console.log('🔵 Updated friend request status to accepted')

      // Create friendship in both directions
      console.log('🔵 Creating friendship records...')
      const { data: friendships, error: createError } = await supabase
        .from('friends')
        .insert([
          {
            user_id: request.sender_id,
            friend_id: request.receiver_id,
            status: 'accepted'
          },
          {
            user_id: request.receiver_id,
            friend_id: request.sender_id,
            status: 'accepted'
          }
        ])
        .select()

      if (createError) {
        console.error('🔴 Error creating friendship:', createError)
        console.error('🔴 Error code:', createError.code)
        console.error('🔴 Error message:', createError.message)
        console.error('🔴 Error details:', createError.details)
        console.error('🔴 Error hint:', createError.hint)
        console.error('🔴 Full error object:', JSON.stringify(createError, null, 2))
        throw new Error(createError.message || 'Failed to create friendship')
      }

      console.log('✅ Successfully created friendships:', friendships)
      return friendships[0] // Return the first friendship record
    } catch (error) {
      console.error('🔴 Error in acceptFriendRequest:', error)
      throw error
    }
  }

  // Decline a friend request
  static async declineFriendRequest(requestId: string, userId: string): Promise<void> {
    try {
      console.log('🔵 Declining friend request:', requestId, 'for user:', userId)
      
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'declined' })
        .eq('id', requestId)
        .eq('receiver_id', userId)

      if (error) {
        console.error('🔴 Error declining friend request:', error)
        console.error('🔴 Error code:', error.code)
        console.error('🔴 Error message:', error.message)
        throw new Error(error.message || 'Failed to decline friend request')
      }

      console.log('✅ Successfully declined friend request')
    } catch (error) {
      console.error('🔴 Error in declineFriendRequest:', error)
      throw error
    }
  }

  // Cancel/withdraw a friend request (for the sender)
  static async cancelFriendRequest(requestId: string, userId: string): Promise<void> {
    try {
      console.log('🔵 Canceling friend request:', requestId, 'for user:', userId)
      
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('sender_id', userId)
        .eq('status', 'pending')

      if (error) {
        console.error('🔴 Error canceling friend request:', error)
        console.error('🔴 Error code:', error.code)
        console.error('🔴 Error message:', error.message)
        throw new Error(error.message || 'Failed to cancel friend request')
      }

      console.log('✅ Successfully canceled friend request')
    } catch (error) {
      console.error('🔴 Error in cancelFriendRequest:', error)
      throw error
    }
  }

  // Remove a friend
  static async removeFriend(userId: string, friendId: string): Promise<void> {
    try {
      console.log('🔵 Removing friend:', userId, friendId)
      
      // Delete friendship in both directions separately to avoid complex OR queries
      const [delete1, delete2] = await Promise.all([
        supabase
          .from('friends')
          .delete()
          .eq('user_id', userId)
          .eq('friend_id', friendId),
        supabase
          .from('friends')
          .delete()
          .eq('user_id', friendId)
          .eq('friend_id', userId)
      ])

      if (delete1.error) {
        console.error('🔴 Error removing friend (direction 1):', delete1.error)
        throw new Error(delete1.error.message)
      }

      if (delete2.error) {
        console.error('🔴 Error removing friend (direction 2):', delete2.error)
        throw new Error(delete2.error.message)
      }

      console.log('✅ Successfully removed friend')
    } catch (error) {
      console.error('🔴 Error in removeFriend:', error)
      throw error
    }
  }

  // Block a user
  static async blockUser(userId: string, targetUserId: string): Promise<void> {
    // Remove existing friendship if exists
    await this.removeFriend(userId, targetUserId)

    // Create block relationship
    const { error } = await supabase
      .from('friends')
      .insert({
        user_id: userId,
        friend_id: targetUserId,
        status: 'blocked'
      })

    if (error) {
      console.error('🔴 Error blocking user:', error)
      throw new Error(error.message)
    }
  }

  // Unblock a user
  static async unblockUser(userId: string, targetUserId: string): Promise<void> {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('user_id', userId)
      .eq('friend_id', targetUserId)
      .eq('status', 'blocked')

    if (error) {
      console.error('🔴 Error unblocking user:', error)
      throw new Error(error.message)
    }
  }

  // Search for users to add as friends
  static async searchUsers(query: string, currentUserId: string, limit: number = 20): Promise<SearchUser[]> {
    if (!query.trim()) {
      return []
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        username,
        avatar_url,
        bio,
        location,
        is_online,
        last_seen
      `)
      .neq('id', currentUserId)
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      console.error('🔴 Error searching users:', error)
      throw new Error(error.message)
    }

    // Get mutual friends count for each user
    const usersWithMutualFriends = await Promise.all(
      (data || []).map(async (user) => {
        const { count } = await supabase
          .from('friends')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', currentUserId)
          .eq('status', 'accepted')
          .in('friend_id', [
            // Get friends of the searched user
            ...(await supabase
              .from('friends')
              .select('friend_id')
              .eq('user_id', user.id)
              .eq('status', 'accepted')
              .then(result => result.data?.map(f => f.friend_id) || []))
          ])

        return {
          ...user,
          mutual_friends: count || 0
        }
      })
    )

    return usersWithMutualFriends
  }

  // Debug method to check data consistency between friends and friend_requests tables
  static async debugFriendshipData(userId1: string, userId2: string): Promise<{
    friendsData: any[]
    friendRequestsData: any[]
    inconsistencies: string[]
  }> {
    try {
      console.log('🔵 Debugging friendship data between:', userId1, userId2)
      
      // Get all friendship records
      const [friends1, friends2] = await Promise.all([
        supabase
          .from('friends')
          .select('*')
          .eq('user_id', userId1)
          .eq('friend_id', userId2),
        supabase
          .from('friends')
          .select('*')
          .eq('user_id', userId2)
          .eq('friend_id', userId1)
      ])

      // Get all friend request records
      const [requests1, requests2] = await Promise.all([
        supabase
          .from('friend_requests')
          .select('*')
          .eq('sender_id', userId1)
          .eq('receiver_id', userId2),
        supabase
          .from('friend_requests')
          .select('*')
          .eq('sender_id', userId2)
          .eq('receiver_id', userId1)
      ])

      const friendsData = [...(friends1.data || []), ...(friends2.data || [])]
      const friendRequestsData = [...(requests1.data || []), ...(requests2.data || [])]
      const inconsistencies: string[] = []

      console.log('🔵 Friends data:', friendsData)
      console.log('🔵 Friend requests data:', friendRequestsData)

      // Check for inconsistencies
      if (friendsData.length > 2) {
        inconsistencies.push('More than 2 friendship records found (should be max 2 - one in each direction)')
      }

      if (friendRequestsData.length > 2) {
        inconsistencies.push('More than 2 friend request records found (should be max 2 - one in each direction)')
      }

      const acceptedFriendships = friendsData.filter(f => f.status === 'accepted')
      if (acceptedFriendships.length > 0 && friendRequestsData.length > 0) {
        inconsistencies.push('Found accepted friendships AND friend requests - this should not happen')
      }

      return {
        friendsData,
        friendRequestsData,
        inconsistencies
      }
    } catch (error) {
      console.error('🔴 Error debugging friendship data:', error)
      return {
        friendsData: [],
        friendRequestsData: [],
        inconsistencies: ['Error occurred while debugging']
      }
    }
  }

  // Check the status of friend request between two users
  static async getFriendRequestStatus(userId1: string, userId2: string): Promise<{
    status: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined'
    request?: FriendRequest
  }> {
    try {
      console.log('🔵 Checking friend request status between:', userId1, userId2)
      
      // Check for existing friend request in both directions
      const [request1, request2] = await Promise.all([
        supabase
          .from('friend_requests')
          .select('*')
          .eq('sender_id', userId1)
          .eq('receiver_id', userId2)
          .single(),
        supabase
          .from('friend_requests')
          .select('*')
          .eq('sender_id', userId2)
          .eq('receiver_id', userId1)
          .single()
      ])

      const existingRequest = request1.data || request2.data
      
      if (!existingRequest) {
        // Check if they're already friends
        const areFriends = await this.areFriends(userId1, userId2)
        if (areFriends) {
          return { status: 'accepted' }
        }
        return { status: 'none' }
      }

      // Determine the status based on who sent the request
      if (existingRequest.sender_id === userId1) {
        return {
          status: existingRequest.status === 'pending' ? 'pending_sent' : existingRequest.status,
          request: existingRequest
        }
      } else {
        return {
          status: existingRequest.status === 'pending' ? 'pending_received' : existingRequest.status,
          request: existingRequest
        }
      }
    } catch (error) {
      console.error('🔴 Error checking friend request status:', error)
      return { status: 'none' }
    }
  }

  // Check if two users are friends
  static async areFriends(userId1: string, userId2: string): Promise<boolean> {
    try {
      console.log('🔵 Checking if users are friends:', userId1, userId2)
      
      // Check friendship in both directions separately to avoid complex OR queries
      const [friendship1, friendship2] = await Promise.all([
        supabase
          .from('friends')
          .select('id')
          .eq('user_id', userId1)
          .eq('friend_id', userId2)
          .eq('status', 'accepted')
          .single(),
        supabase
          .from('friends')
          .select('id')
          .eq('user_id', userId2)
          .eq('friend_id', userId1)
          .eq('status', 'accepted')
          .single()
      ])

      // Check if either friendship exists
      const isFriends = !!(friendship1.data || friendship2.data)
      console.log('🔵 Are friends result:', isFriends)
      return isFriends
    } catch (error) {
      console.error('🔴 Error checking friendship:', error)
      // Return false instead of throwing to prevent app crashes
      return false
    }
  }

  // Get mutual friends between two users
  static async getMutualFriends(userId1: string, userId2: string): Promise<SearchUser[]> {
    // Get friends of user1
    const { data: user1Friends, error: user1Error } = await supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', userId1)
      .eq('status', 'accepted')

    if (user1Error) {
      console.error('🔴 Error fetching user1 friends:', user1Error)
      throw new Error(user1Error.message)
    }

    // Get friends of user2
    const { data: user2Friends, error: user2Error } = await supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', userId2)
      .eq('status', 'accepted')

    if (user2Error) {
      console.error('🔴 Error fetching user2 friends:', user2Error)
      throw new Error(user2Error.message)
    }

    // Find mutual friends
    const user1FriendIds = user1Friends?.map(f => f.friend_id) || []
    const user2FriendIds = user2Friends?.map(f => f.friend_id) || []
    const mutualFriendIds = user1FriendIds.filter(id => user2FriendIds.includes(id))

    if (mutualFriendIds.length === 0) {
      return []
    }

    // Get profiles of mutual friends
    const { data: mutualFriends, error: profilesError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        username,
        avatar_url,
        bio,
        location,
        is_online,
        last_seen
      `)
      .in('id', mutualFriendIds)

    if (profilesError) {
      console.error('🔴 Error fetching mutual friends profiles:', profilesError)
      throw new Error(profilesError.message)
    }

    return mutualFriends || []
  }
}
