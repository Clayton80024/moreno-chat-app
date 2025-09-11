import { supabase } from './supabase'

export interface TypingIndicator {
  id: string
  user_id: string
  chat_id: string
  is_typing: boolean
  timestamp: string
  user_profile?: {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

export class TypingService {
  private static typingTimeouts = new Map<string, NodeJS.Timeout>()
  private static stopTypingTimeouts = new Map<string, NodeJS.Timeout>()
  private static typingStates = new Map<string, boolean>() // Track typing state separately

  // Test function to check if typing_indicators table is accessible
  static async testTypingTable(): Promise<boolean> {
    try {
      console.log('🧪 Testing typing_indicators table access...')
      
      const { data, error } = await supabase
        .from('typing_indicators')
        .select('id')
        .limit(1)

      if (error) {
        console.error('🔴 Typing table test failed:', error)
        console.error('🔴 Error code:', error.code)
        console.error('🔴 Error message:', error.message)
        return false
      }

      console.log('✅ Typing table test passed:', data)
      return true
    } catch (error) {
      console.error('🔴 Typing table test error:', error)
      return false
    }
  }

  // Check if user is participant in chat
  static async isUserParticipant(userId: string, chatId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking chat participation:', { userId, chatId })
      
      const { data, error } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('🔴 Chat participation check failed:', error)
        return false
      }

      console.log('✅ User is participant in chat:', data)
      return true
    } catch (error) {
      console.error('🔴 Chat participation check error:', error)
      return false
    }
  }

  // Send typing indicator
  static async startTyping(userId: string, chatId: string): Promise<void> {
    try {
      // Validate inputs
      if (!userId || !chatId) {
        console.error('🔴 Invalid parameters:', { userId, chatId });
        return;
      }

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('🔴 User not authenticated:', authError);
        return;
      }

      if (user.id !== userId) {
        console.error('🔴 User ID mismatch:', { authenticatedUserId: user.id, providedUserId: userId });
        return;
      }

      // Check if user is participant in the chat
      const isParticipant = await this.isUserParticipant(userId, chatId);
      if (!isParticipant) {
        console.error('🔴 User is not a participant in this chat:', { userId, chatId });
        return;
      }

      // Test table access before attempting to insert
      const tableAccessible = await this.testTypingTable();
      if (!tableAccessible) {
        console.error('🔴 Typing table is not accessible. Check RLS policies.');
        return;
      }

      // Clear any existing stop typing timeout
      const stopTimeout = this.stopTypingTimeouts.get(`${userId}-${chatId}`)
      if (stopTimeout) {
        clearTimeout(stopTimeout)
        this.stopTypingTimeouts.delete(`${userId}-${chatId}`)
      }

      // Mark as currently typing (this might already be set by handleTyping)
      const typingKey = `${userId}-${chatId}`
      this.typingStates.set(typingKey, true)
      
      console.log('🔵 About to send typing indicator to database:', { userId, chatId });

      // Send typing indicator to database
      console.log('🔵 Sending typing indicator to database:', { userId, chatId });
      const { data, error } = await supabase
        .from('typing_indicators')
        .upsert({
          user_id: userId,
          chat_id: chatId,
          is_typing: true,
          timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,chat_id'
        })
        .select()

      if (error) {
        console.error('🔴 Error sending typing indicator:', error)
        console.error('🔴 Error code:', error.code)
        console.error('🔴 Error message:', error.message)
        console.error('🔴 Error details:', error.details)
        console.error('🔴 Error hint:', error.hint)
        
        // Clear the typing state on error to prevent stuck indicators
        this.typingStates.set(typingKey, false)
        
        // If it's a permission/RLS error, don't spam retries
        if (error.code === '42501' || error.message?.includes('policy')) {
          console.warn('🔴 RLS policy error - typing indicators may be disabled')
          return
        }
      } else {
        console.log('🔵 Typing indicator sent successfully:', { userId, chatId, data })
      }
    } catch (error) {
      console.error('🔴 Error in startTyping:', error)
      console.error('🔴 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
      
      // Clear typing state on any error to prevent stuck indicators
      const typingKey = `${userId}-${chatId}`
      this.typingStates.set(typingKey, false)
      
      // Clear timeouts on error
      const timeout = this.typingTimeouts.get(typingKey)
      if (timeout) {
        clearTimeout(timeout)
        this.typingTimeouts.delete(typingKey)
      }
    }
  }

  // Stop typing indicator
  static async stopTyping(userId: string, chatId: string): Promise<void> {
    try {
      const typingKey = `${userId}-${chatId}`

      // Clear typing state
      this.typingStates.delete(typingKey) // Use delete instead of setting to false
      
      // Clear any active typing timeout
      const typingTimeout = this.typingTimeouts.get(typingKey)
      if (typingTimeout) {
        clearTimeout(typingTimeout)
        this.typingTimeouts.delete(typingKey)
      }

      // Clear stop typing timeout
      const stopTimeout = this.stopTypingTimeouts.get(typingKey)
      if (stopTimeout) {
        clearTimeout(stopTimeout)
        this.stopTypingTimeouts.delete(typingKey)
      }

      // Send stop typing indicator
      console.log('🔵 Sending stop typing indicator to database:', { userId, chatId });
      const { data, error } = await supabase
        .from('typing_indicators')
        .upsert({
          user_id: userId,
          chat_id: chatId,
          is_typing: false,
          timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,chat_id'
        })
        .select()

      if (error) {
        console.error('🔴 Error stopping typing indicator:', error)
        console.error('🔴 Error details:', error)
        // Don't throw error for stop typing - it's not critical
      } else {
        console.log('🔵 Typing indicator stopped successfully:', { userId, chatId, data })
      }
    } catch (error) {
      console.error('🔴 Error in stopTyping:', error)
    }
  }

  // Debounced typing handler
  static handleTyping(userId: string, chatId: string): void {
    console.log('🔵 TypingService.handleTyping called:', { userId, chatId });
    console.log('🔵 Current typing states:', Array.from(this.typingStates.entries()));
    console.log('🔵 Current typing timeouts:', this.typingTimeouts.size);
    console.log('🔵 Current stop timeouts:', this.stopTypingTimeouts.size);
    
    const typingKey = `${userId}-${chatId}`;
    
    // FORCE RESET if we're stuck in a bad state
    if (this.typingStates.get(typingKey) && !this.typingTimeouts.has(typingKey)) {
      console.log('🔧 FORCE RESET: Found stale typing state without timeout, clearing...');
      this.typingStates.delete(typingKey);
    }

    // Clear existing stop typing timeout
    const stopTimeout = this.stopTypingTimeouts.get(typingKey)
    if (stopTimeout) {
      clearTimeout(stopTimeout)
      this.stopTypingTimeouts.delete(typingKey)
    }

    // Start typing with debounce if not already typing
    if (!this.typingStates.get(typingKey)) {
      console.log('🔵 Starting typing with debounce:', { userId, chatId });
      
      // Set typing state immediately to prevent multiple calls
      this.typingStates.set(typingKey, true)
      
      // Set a small delay to prevent spam, then call startTyping
      const startTimeout = setTimeout(() => {
        console.log('🔵 Debounce timeout reached, calling startTyping:', { userId, chatId });
        this.startTyping(userId, chatId)
      }, 300) // 300ms debounce before starting
      
      this.typingTimeouts.set(typingKey, startTimeout)
    } else {
      console.log('🔵 Already typing, extending timeout:', { userId, chatId });
    }

    // Set new stop typing timeout (1 second after last keystroke)
    const newStopTimeout = setTimeout(() => {
      console.log('🔵 Stop typing timeout triggered:', { userId, chatId });
      this.stopTyping(userId, chatId)
    }, 1000)

    this.stopTypingTimeouts.set(typingKey, newStopTimeout)
  }

  // Get typing indicators for a chat
  static async getTypingIndicators(chatId: string): Promise<TypingIndicator[]> {
    try {
      const { data, error } = await supabase
        .from('typing_indicators')
        .select(`
          *,
          user_profile:user_profiles!typing_indicators_user_id_fkey(
            id,
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('chat_id', chatId)
        .eq('is_typing', true)
        .gte('timestamp', new Date(Date.now() - 5000).toISOString()) // Only recent indicators

      if (error) {
        console.error('🔴 Error fetching typing indicators:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('🔴 Error in getTypingIndicators:', error)
      return []
    }
  }

  // Cleanup old typing indicators
  static async cleanupOldIndicators(): Promise<void> {
    try {
      const { error } = await supabase
        .from('typing_indicators')
        .delete()
        .lt('timestamp', new Date(Date.now() - 10000).toISOString()) // Delete indicators older than 10 seconds

      if (error) {
        console.error('🔴 Error cleaning up typing indicators:', error)
      }
    } catch (error) {
      console.error('🔴 Error in cleanupOldIndicators:', error)
    }
  }

  // Clear all typing indicators for a user (when they leave)
  static async clearUserTyping(userId: string): Promise<void> {
    try {
      console.log('🔵 Clearing typing indicators for user:', userId);
      
      // Clear local timeouts and states
      for (const [key, timeout] of this.typingTimeouts.entries()) {
        if (key.startsWith(`${userId}-`)) {
          clearTimeout(timeout)
          this.typingTimeouts.delete(key)
        }
      }

      for (const [key, timeout] of this.stopTypingTimeouts.entries()) {
        if (key.startsWith(`${userId}-`)) {
          clearTimeout(timeout)
          this.stopTypingTimeouts.delete(key)
        }
      }

      // Clear typing states
      for (const key of this.typingStates.keys()) {
        if (key.startsWith(`${userId}-`)) {
          this.typingStates.delete(key)
        }
      }

      // Clear database indicators - use upsert with is_typing: false instead of delete
      // This is more reliable with RLS policies
      console.log('🔵 Setting typing indicators to false for user:', userId);
      
      // First, get all typing indicators for this user
      const { data: existingIndicators, error: fetchError } = await supabase
        .from('typing_indicators')
        .select('chat_id')
        .eq('user_id', userId)
        .eq('is_typing', true)

      if (fetchError) {
        console.error('🔴 Error fetching user typing indicators:', fetchError)
        return
      }

      // Set all typing indicators to false
      if (existingIndicators && existingIndicators.length > 0) {
        const updates = existingIndicators.map(indicator => ({
          user_id: userId,
          chat_id: indicator.chat_id,
          is_typing: false,
          timestamp: new Date().toISOString()
        }))

        const { data, error } = await supabase
          .from('typing_indicators')
          .upsert(updates, {
            onConflict: 'user_id,chat_id'
          })
          .select()

        if (error) {
          console.error('🔴 Error clearing user typing indicators:', error)
          console.error('🔴 Error details:', error)
        } else {
          console.log('🔵 Successfully cleared typing indicators:', { userId, updatedCount: data?.length || 0 })
        }
      } else {
        console.log('🔵 No active typing indicators found for user:', userId)
      }
    } catch (error) {
      console.error('🔴 Error in clearUserTyping:', error)
      console.error('🔴 Error details:', error)
    }
  }

  // Add a method to completely reset typing state for debugging
  static resetTypingState(userId: string, chatId: string): void {
    const typingKey = `${userId}-${chatId}`
    console.log('🔧 Resetting typing state for:', { userId, chatId })
    
    // Clear all local state
    this.typingStates.delete(typingKey)
    
    const typingTimeout = this.typingTimeouts.get(typingKey)
    if (typingTimeout) {
      clearTimeout(typingTimeout)
      this.typingTimeouts.delete(typingKey)
    }
    
    const stopTimeout = this.stopTypingTimeouts.get(typingKey)
    if (stopTimeout) {
      clearTimeout(stopTimeout)
      this.stopTypingTimeouts.delete(typingKey)
    }
    
    console.log('🔧 Reset complete:', {
      typingStates: Array.from(this.typingStates.entries()),
      timeouts: this.typingTimeouts.size,
      stopTimeouts: this.stopTypingTimeouts.size
    })
  }

  // Complete cleanup - clears all static maps (useful for app reset/logout)
  static clearAllTypingData(): void {
    console.log('🔵 Clearing all typing service data...');
    
    // Clear all typing timeouts
    for (const [key, timeout] of this.typingTimeouts.entries()) {
      clearTimeout(timeout)
    }
    this.typingTimeouts.clear()
    
    // Clear all stop typing timeouts
    for (const [key, timeout] of this.stopTypingTimeouts.entries()) {
      clearTimeout(timeout)
    }
    this.stopTypingTimeouts.clear()
    
    // Clear all typing states
    this.typingStates.clear()
    
    console.log('✅ All typing service data cleared');
  }

  // Cleanup for specific chat (when leaving a chat)
  static clearChatTyping(chatId: string): void {
    console.log('🔵 Clearing typing data for chat:', chatId);
    
    // Find and clear all entries for this chat
    for (const [key, timeout] of this.typingTimeouts.entries()) {
      if (key.endsWith(`-${chatId}`)) {
        clearTimeout(timeout)
        this.typingTimeouts.delete(key)
      }
    }
    
    for (const [key, timeout] of this.stopTypingTimeouts.entries()) {
      if (key.endsWith(`-${chatId}`)) {
        clearTimeout(timeout)
        this.stopTypingTimeouts.delete(key)
      }
    }
    
    for (const key of this.typingStates.keys()) {
      if (key.endsWith(`-${chatId}`)) {
        this.typingStates.delete(key)
      }
    }
    
    console.log('✅ Chat typing data cleared');
  }

  // Simple test function for debugging
  static async testTypingManually(userId: string, chatId: string): Promise<void> {
    console.log('🧪 Manual Typing Test:', { userId, chatId });
    
    try {
      // Test 1: Check if user is participant
      const isParticipant = await this.isUserParticipant(userId, chatId);
      console.log('🧪 Is participant:', isParticipant);
      
      // Test 2: Check table access
      const tableAccessible = await this.testTypingTable();
      console.log('🧪 Table accessible:', tableAccessible);
      
      // Test 3: Manually insert typing indicator
      console.log('🧪 Manually inserting typing indicator...');
      const { data, error } = await supabase
        .from('typing_indicators')
        .upsert({
          user_id: userId,
          chat_id: chatId,
          is_typing: true,
          timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,chat_id'
        })
        .select();
      
      if (error) {
        console.error('🧪 Manual insert error:', error);
      } else {
        console.log('🧪 Manual insert success:', data);
      }
      
      // Test 4: Check what's in database
      const { data: allIndicators, error: selectError } = await supabase
        .from('typing_indicators')
        .select('*')
        .eq('chat_id', chatId);
      
      if (selectError) {
        console.error('🧪 Select error:', selectError);
      } else {
        console.log('🧪 All indicators in database:', allIndicators);
      }
      
    } catch (error) {
      console.error('🧪 Manual test error:', error);
    }
  }
}
