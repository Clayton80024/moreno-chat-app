import { supabase } from './supabase'

// Simple typing service without complex state management
export class SimpleTypingService {
  private static activeTimeouts = new Map<string, NodeJS.Timeout>()

  // Simple typing handler - just send typing=true immediately, then auto-stop after delay
  static handleTyping(userId: string, chatId: string): void {    
    const key = `${userId}-${chatId}`
    
    // Clear any existing timeout
    const existingTimeout = SimpleTypingService.activeTimeouts.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    // Send typing=true immediately
    (async () => {
      try {
        await SimpleTypingService.sendTypingStatus(userId, chatId, true);
      } catch (error) {
        console.error('🔴 Error sending typing start:', error);
      }
    })();
    
    // Set timeout to stop typing after 1.5 seconds of no activity
    const stopTimeout = setTimeout(async () => {
      try {
        await SimpleTypingService.sendTypingStatus(userId, chatId, false);
      } catch (error) {
        console.error('🔴 Error sending typing stop:', error);
      }
      SimpleTypingService.activeTimeouts.delete(key)
    }, 1500)
    
    SimpleTypingService.activeTimeouts.set(key, stopTimeout)
  }
  
  // Direct database call - no complex logic
  public static async sendTypingStatus(userId: string, chatId: string, isTyping: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('typing_indicators')
        .upsert({
          user_id: userId,
          chat_id: chatId,
          is_typing: isTyping,
          timestamp: new Date().toISOString()
        }, {
          onConflict: 'user_id,chat_id'
        })

      if (error) {
        console.error('🔴 Typing indicator error:', error)
      }
    } catch (error) {
      console.error('🔴 Typing indicator exception:', error)
    }
  }
  
  // Clear all timeouts for a user (cleanup)
  static clearUserTyping(userId: string): void {
    for (const [key, timeout] of SimpleTypingService.activeTimeouts.entries()) {
      if (key.startsWith(`${userId}-`)) {
        clearTimeout(timeout)
        SimpleTypingService.activeTimeouts.delete(key)
      }
    }
  }
  
  // Complete cleanup
  static clearAll(): void {
    for (const timeout of SimpleTypingService.activeTimeouts.values()) {
      clearTimeout(timeout)
    }
    SimpleTypingService.activeTimeouts.clear()
  }
}