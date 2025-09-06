import { supabase } from './supabase'

export interface Chat {
  id: string
  name: string | null
  type: 'direct' | 'group'
  created_by: string | null
  created_at: string
  updated_at: string
  last_message_at: string
  // Joined data
  participants?: ChatParticipant[]
  last_message?: Message
  unread_count?: number
}

export interface ChatParticipant {
  id: string
  chat_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  last_read_at: string
  // Joined profile data
  user_profile?: {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    bio: string | null
    location: string | null
    is_online: boolean
    last_seen: string | null
  }
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'file' | 'system'
  reply_to_id: string | null
  edited_at: string | null
  created_at: string
  updated_at: string
  // Joined data
  sender_profile?: {
    id: string
    full_name: string | null
    username: string | null
    avatar_url: string | null
    location: string | null
  }
  reply_to_message?: Message
  status?: MessageStatus[]
}

export interface MessageStatus {
  id: string
  message_id: string
  user_id: string
  status: 'sent' | 'delivered' | 'read'
  timestamp: string
}

export interface CreateChatData {
  type: 'direct' | 'group'
  name?: string
  participant_ids: string[]
}

export class ChatsService {
  // Get all chats for a user
  static async getUserChats(userId: string): Promise<Chat[]> {
    try {
      console.log('🔵 Getting user chats for:', userId);
      
      // Simple approach: get user's own participation records first
      console.log('🔵 Fetching user participation records...');
      
      const { data: userParticipants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('chat_id, last_read_at')
        .eq('user_id', userId);

      if (participantsError) {
        console.error('🔴 Error fetching user participants:', participantsError);
        console.error('🔴 Error code:', participantsError.code);
        console.error('🔴 Error message:', participantsError.message);
        console.error('🔴 Error details:', participantsError.details);
        console.error('🔴 Error hint:', participantsError.hint);
        console.error('🔴 Full error object:', JSON.stringify(participantsError, null, 2));
        
        // If there's an RLS issue, return empty array instead of throwing
        if (participantsError.message?.includes('infinite recursion') || 
            participantsError.message?.includes('policy') ||
            participantsError.message?.includes('permission') ||
            participantsError.code === '42501' ||
            participantsError.code === '2BP01' ||
            participantsError.code === '42710') {
          console.warn('⚠️ RLS policy issue detected, returning empty chats');
          return [];
        }
        throw new Error(participantsError.message || 'Unknown error');
      }

      if (!userParticipants || userParticipants.length === 0) {
        console.log('🔵 No chat participants found for user');
        return [];
      }

      const chatIds = userParticipants.map(p => p.chat_id);
      console.log('🔵 Found chat IDs:', chatIds);

      // Get the chat details
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds)
        .order('last_message_at', { ascending: false });

      if (chatsError) {
        console.error('🔴 Error fetching chats:', chatsError);
        throw new Error(chatsError.message);
      }

      // For each chat, get basic info without trying to fetch all participants
      // (since RLS might block that)
      const chatsWithDetails = await Promise.all(
        (chats || []).map(async (chat) => {
          const participant = userParticipants.find(p => p.chat_id === chat.id);
          
          // Try to get participants, but don't fail if it doesn't work
          let participants: any[] = [];
          try {
            const { data: participantsData } = await supabase
              .from('chat_participants')
              .select('*')
              .eq('chat_id', chat.id);
            
            if (participantsData && participantsData.length > 0) {
              const userIds = participantsData.map(p => p.user_id);
              const { data: profiles } = await supabase
                .from('user_profiles')
                .select('id, full_name, username, avatar_url, bio, is_online, last_seen, location')
                .in('id', userIds);

              participants = participantsData.map(participant => ({
                ...participant,
                user_profile: profiles?.find(p => p.id === participant.user_id)
              }));
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch participants for chat:', chat.id, error);
            // Continue without participants
          }

          // Get last message
          let lastMessage = null;
          try {
            const { data: lastMessagesData } = await supabase
              .from('messages')
              .select('*')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1);
            
            if (lastMessagesData && lastMessagesData.length > 0) {
              const message = lastMessagesData[0];
              const { data: senderProfile } = await supabase
                .from('user_profiles')
                .select('id, full_name, username, avatar_url, location')
                .eq('id', message.sender_id)
                .single();

              lastMessage = {
                ...message,
                sender_profile: senderProfile
              };
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch last message for chat:', chat.id, error);
          }

          // Get unread count
          let unreadCount = 0;
          try {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .gt('created_at', participant?.last_read_at || '1970-01-01');
            unreadCount = count || 0;
          } catch (error) {
            console.warn('⚠️ Could not fetch unread count for chat:', chat.id, error);
          }

          return {
            ...chat,
            participants,
            last_message: lastMessage,
            unread_count: unreadCount
          };
        })
      );

      console.log('✅ Successfully fetched user chats:', chatsWithDetails.length);
      return chatsWithDetails;
    } catch (error) {
      console.error('🔴 Error in getUserChats:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  // Get a specific chat with all details
  static async getChat(chatId: string, userId: string): Promise<Chat | null> {
    // Verify user is participant
    const { data: participant, error: participantError } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single()

    if (participantError || !participant) {
      throw new Error('Chat not found or access denied')
    }

    // Get chat details
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single()

    if (chatError) {
      console.error('🔴 Error fetching chat:', chatError)
      throw new Error(chatError.message)
    }

    // Get participants
    const { data: participantsData } = await supabase
      .from('chat_participants')
      .select('*')
      .eq('chat_id', chatId)

    let participants = []
    if (participantsData && participantsData.length > 0) {
      // Get user profiles separately
      const userIds = participantsData.map(p => p.user_id)
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, username, avatar_url, bio, is_online, last_seen, location')
        .in('id', userIds)

      // Combine participants with their profiles
      participants = participantsData.map(participant => ({
        ...participant,
        user_profile: profiles?.find(p => p.id === participant.user_id)
      }))
    }

    // Get last message
    const { data: lastMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(1)

    let lastMessage = null
    if (lastMessages && lastMessages.length > 0) {
      const message = lastMessages[0]
      // Get sender profile separately
      const { data: senderProfile } = await supabase
        .from('user_profiles')
        .select('id, full_name, username, avatar_url, location')
        .eq('id', message.sender_id)
        .single()

      lastMessage = {
        ...message,
        sender_profile: senderProfile
      }
    }

    return {
      ...chat,
      participants: participants || [],
      last_message: lastMessage || null
    }
  }

  // Create a new chat
  static async createChat(creatorId: string, chatData: CreateChatData): Promise<Chat> {
    try {
      console.log('🔵 Creating chat with creator:', creatorId, 'participants:', chatData.participant_ids);
      
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          name: chatData.name || null,
          type: chatData.type,
          created_by: creatorId
        })
        .select()
        .single()

      if (chatError) {
        console.error('🔴 Error creating chat:', chatError);
        console.error('🔴 Chat error details:', {
          code: chatError.code,
          message: chatError.message,
          details: chatError.details,
          hint: chatError.hint,
          status: chatError.status
        });
        throw new Error(chatError.message);
      }

      console.log('✅ Chat created successfully:', chat);

    // Add participants (including the creator)
    const participants = [
      // Add the creator as admin
      {
        chat_id: chat.id,
        user_id: creatorId,
        role: 'admin'
      },
      // Add other participants as members
      ...chatData.participant_ids.map(userId => ({
        chat_id: chat.id,
        user_id: userId,
        role: 'member'
      }))
    ]

      console.log('🔵 Adding participants:', participants);
      
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants)

      if (participantsError) {
        console.error('🔴 Error adding participants:', participantsError);
        console.error('🔴 Participants error details:', {
          code: participantsError.code,
          message: participantsError.message,
          details: participantsError.details,
          hint: participantsError.hint,
          status: participantsError.status
        });
        throw new Error(participantsError.message);
      }

      console.log('✅ Participants added successfully');

      // Return chat with participants
      const fullChat = await this.getChat(chat.id, creatorId) as Chat;
      console.log('✅ Chat creation completed:', fullChat);
      return fullChat;
      
    } catch (error) {
      console.error('🔴 Error in createChat:', error);
      throw error;
    }
  }

  // Add participant to chat
  static async addParticipant(chatId: string, userId: string, addedBy: string): Promise<void> {
    // Verify adder is admin
    const { data: adderParticipant, error: adderError } = await supabase
      .from('chat_participants')
      .select('role')
      .eq('chat_id', chatId)
      .eq('user_id', addedBy)
      .single()

    if (adderError || adderParticipant?.role !== 'admin') {
      throw new Error('Only admins can add participants')
    }

    const { error } = await supabase
      .from('chat_participants')
      .insert({
        chat_id: chatId,
        user_id: userId,
        role: 'member'
      })

    if (error) {
      console.error('🔴 Error adding participant:', error)
      throw new Error(error.message)
    }
  }

  // Remove participant from chat
  static async removeParticipant(chatId: string, userId: string, removedBy: string): Promise<void> {
    // Verify remover is admin or removing themselves
    if (userId !== removedBy) {
      const { data: removerParticipant, error: removerError } = await supabase
        .from('chat_participants')
        .select('role')
        .eq('chat_id', chatId)
        .eq('user_id', removedBy)
        .single()

      if (removerError || removerParticipant?.role !== 'admin') {
        throw new Error('Only admins can remove participants')
      }
    }

    const { error } = await supabase
      .from('chat_participants')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', userId)

    if (error) {
      console.error('🔴 Error removing participant:', error)
      throw new Error(error.message)
    }
  }

  // Get messages for a chat
  static async getChatMessages(chatId: string, userId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      console.log('🔵 Getting messages for chat:', chatId, 'user:', userId);
      
      // Verify user is participant
      const { data: participant, error: participantError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single()

      if (participantError || !participant) {
        console.error('🔴 User not participant in chat:', participantError);
        throw new Error('Chat not found or access denied');
      }

      console.log('✅ User is participant in chat');

      // Get messages without foreign key relationships
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('🔴 Error fetching messages:', error);
        console.error('🔴 Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        throw new Error(error.message);
      }

      console.log('✅ Messages fetched:', messages?.length || 0);

      if (!messages || messages.length === 0) {
        return [];
      }

      // Get sender profiles separately to avoid foreign key issues
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      console.log('🔵 Getting profiles for senders:', senderIds);

      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, username, avatar_url, location')
        .in('id', senderIds);

      if (profilesError) {
        console.error('🔴 Error fetching profiles:', profilesError);
        // Don't throw error, just continue without profiles
      }

      console.log('✅ Profiles fetched:', profiles?.length || 0);

      // Create a map of profiles for quick lookup
      const profileMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.id, profile);
        });
      }

      // Get message status for each message
      const messagesWithStatus = await Promise.all(
        messages.map(async (message) => {
          try {
            const { data: status } = await supabase
              .from('message_status')
              .select('*')
              .eq('message_id', message.id);

            return {
              ...message,
              sender_profile: profileMap.get(message.sender_id) || null,
              status: status || []
            };
          } catch (statusError) {
            console.warn('⚠️ Error fetching message status:', statusError);
            return {
              ...message,
              sender_profile: profileMap.get(message.sender_id) || null,
              status: []
            };
          }
        })
      );

      console.log('✅ Messages processed with profiles and status');
      return messagesWithStatus.reverse(); // Return in chronological order

    } catch (error) {
      console.error('🔴 Error in getChatMessages:', error);
      throw error;
    }
  }

  // Send a message
  static async sendMessage(chatId: string, senderId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text', replyToId?: string): Promise<Message> {
    try {
      console.log('🔵 Sending message to chat:', chatId, 'from:', senderId);
      
      // Verify user is participant
      const { data: participant, error: participantError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('chat_id', chatId)
        .eq('user_id', senderId)
        .single()

      if (participantError || !participant) {
        console.error('🔴 User not participant in chat:', participantError);
        throw new Error('Chat not found or access denied');
      }

      console.log('✅ User is participant in chat');

      // Create message without foreign key relationships
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content,
          message_type: messageType,
          reply_to_id: replyToId || null
        })
        .select('*')
        .single()

      if (messageError) {
        console.error('🔴 Error sending message:', messageError);
        console.error('🔴 Message error details:', {
          code: messageError.code,
          message: messageError.message,
          details: messageError.details,
          hint: messageError.hint,
          status: messageError.status
        });
        throw new Error(messageError.message);
      }

      console.log('✅ Message created successfully:', message.id);

      // Get sender profile separately
      const { data: senderProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, full_name, username, avatar_url, location')
        .eq('id', senderId)
        .single();

      if (profileError) {
        console.warn('⚠️ Error fetching sender profile:', profileError);
        // Don't throw error, just continue without profile
      }

      console.log('✅ Sender profile fetched:', senderProfile?.full_name || 'Unknown');

      // Create initial message status for sender
      try {
        const { error: statusError } = await supabase
          .from('message_status')
          .insert({
            message_id: message.id,
            user_id: senderId,
            status: 'sent',
            timestamp: new Date().toISOString()
          });

        if (statusError) {
          console.warn('⚠️ Error creating message status:', statusError);
          // Don't throw error, just continue
        } else {
          console.log('✅ Message status created');
        }
      } catch (statusError) {
        console.warn('⚠️ Error creating message status:', statusError);
        // Don't throw error, just continue
      }

      // Return message with sender profile
      const messageWithProfile = {
        ...message,
        sender_profile: senderProfile || null
      };

      console.log('✅ Message sent successfully with profile');
      return messageWithProfile;

    } catch (error) {
      console.error('🔴 Error in sendMessage:', error);
      throw error;
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
    // Update participant's last_read_at
    const { error: participantError } = await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('user_id', userId)

    if (participantError) {
      console.error('🔴 Error updating last_read_at:', participantError)
      throw new Error(participantError.message)
    }

    // Update message status for unread messages
    const { data: unreadMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', chatId)
      .gt('created_at', new Date().toISOString()) // This should be the previous last_read_at, simplified for now

    if (messagesError) {
      console.error('🔴 Error fetching unread messages:', messagesError)
      return
    }

    if (unreadMessages && unreadMessages.length > 0) {
      const messageStatuses = unreadMessages.map(msg => ({
        message_id: msg.id,
        user_id: userId,
        status: 'read' as const
      }))

      await supabase
        .from('message_status')
        .upsert(messageStatuses, { onConflict: 'message_id,user_id' })
    }
  }

  // Edit a message
  static async editMessage(messageId: string, userId: string, newContent: string): Promise<Message> {
    const { data: message, error } = await supabase
      .from('messages')
      .update({
        content: newContent,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .eq('sender_id', userId)
      .select('*')
      .single()

    if (error) {
      console.error('🔴 Error editing message:', error)
      throw new Error(error.message)
    }

    // Get sender profile separately
    const { data: senderProfile } = await supabase
      .from('user_profiles')
      .select('id, full_name, username, avatar_url, location')
      .eq('id', message.sender_id)
      .single()

    return {
      ...message,
      sender_profile: senderProfile
    }
  }

  // Delete a message
  static async deleteMessage(messageId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userId)

    if (error) {
      console.error('🔴 Error deleting message:', error)
      throw new Error(error.message)
    }
  }

  // Get or create direct chat between two users
  static async getOrCreateDirectChat(userId1: string, userId2: string): Promise<Chat> {
    // Check if direct chat already exists between these two users
    const { data: existingChats, error: checkError } = await supabase
      .from('chats')
      .select(`
        id,
        name,
        type,
        created_by,
        created_at,
        updated_at,
        last_message_at
      `)
      .eq('type', 'direct')
      .in('created_by', [userId1, userId2])

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('🔴 Error checking for existing chat:', checkError)
      throw new Error(checkError.message)
    }

    // Check each existing chat to see if both users are participants
    if (existingChats && existingChats.length > 0) {
      for (const chat of existingChats) {
        const { data: participants, error: participantsError } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', chat.id)
          .in('user_id', [userId1, userId2])

        if (participantsError) {
          console.error('🔴 Error checking participants:', participantsError)
          continue
        }

        if (participants && participants.length === 2) {
          return await this.getChat(chat.id, userId1) as Chat
        }
      }
    }

    // Create new direct chat
    return await this.createChat(userId1, {
      type: 'direct',
      participant_ids: [userId2]
    })
  }
}
