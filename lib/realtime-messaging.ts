/**
 * WHATSAPP-LEVEL REALTIME MESSAGING SYSTEM
 * 10-Step Implementation Guide
 */

import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

// ════════════════════════════════════════════════════════════════════════════
// STEP 1: REALTIME MESSAGE SYSTEM
// ════════════════════════════════════════════════════════════════════════════

export function subscribeToMessagesWithDuplicateCheck(
  chatId: string,
  onNew: (msg: any) => void,
  onUpdate: (msg: any) => void,
) {
  const seenIds = new Set<string>();

  const channel = supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      (payload: any) => {
        const msg = payload.new;
        // Prevent duplicate messages (check message.id before adding)
        if (!seenIds.has(msg.id)) {
          seenIds.add(msg.id);
          onNew(msg);
        } else {
          console.log('🔄 Duplicate message prevented:', msg.id);
        }
      },
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      (payload: any) => {
        const msg = payload.new;
        seenIds.add(msg.id);
        onUpdate(msg);
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`✅ Subscribed to realtime messages for chat: ${chatId}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`❌ Realtime subscription error for chat: ${chatId}`);
      }
    });

  return () => {
    console.log(`🔌 Unsubscribed from chat: ${chatId}`);
    supabase.removeChannel(channel);
  };
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 2: SEND MESSAGE (OPTIMISTIC UI)
// ════════════════════════════════════════════════════════════════════════════

export async function sendMessageOptimistic(
  chatId: string,
  senderId: string,
  content: string,
  type: string = 'text',
): Promise<{ id: string; error?: string }> {
  try {
    // 1. Instantly show message in UI (optimistic)
    const optimisticId = `opt-${Date.now()}-${Math.random()}`;

    // 2. Then insert into Supabase
    const { data: msg, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content,
        type,
        status: 'sent',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Message send failed:', error);
      return { id: optimisticId, error: error.message };
    }

    // Update chat's last message time
    await supabase
      .from('chats')
      .update({
        last_message: type === 'text' ? content : `📎 ${type}`,
        last_message_time: new Date().toISOString(),
      })
      .eq('id', chatId);

    return { id: msg.id };
  } catch (err: any) {
    console.error('❌ sendMessageOptimistic error:', err);
    return { id: '', error: err.message };
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 3: AUTO SCROLL
// ════════════════════════════════════════════════════════════════════════════

export function scrollToBottomSmooth(ref: React.RefObject<HTMLDivElement>) {
  setTimeout(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, 50);
}

export function scrollToBottomInstant(ref: React.RefObject<HTMLDivElement>) {
  if (ref.current) {
    ref.current.scrollIntoView({ behavior: 'auto', block: 'end' });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 4: UNREAD MESSAGE SYSTEM
// ════════════════════════════════════════════════════════════════════════════

export async function getUnreadCount(chatId: string, userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('chat_id', chatId)
    .neq('sender_id', userId)
    .eq('status', 'sent');

  if (error) {
    console.error('❌ getUnreadCount error:', error);
    return 0;
  }

  return data?.length ?? 0;
}

export async function markChatMessagesAsRead(chatId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ status: 'read' })
    .eq('chat_id', chatId)
    .neq('sender_id', userId)
    .neq('status', 'read');

  if (error) {
    console.error('❌ markChatMessagesAsRead error:', error);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 5: TYPING INDICATOR WITH ERROR HANDLING
// ════════════════════════════════════════════════════════════════════════════

export async function setTypingStatus(
  presenceChannel: any,
  userId: string,
  isTyping: boolean,
): Promise<void> {
  try {
    if (presenceChannel) {
      await presenceChannel.track({ user_id: userId, is_typing: isTyping, timestamp: Date.now() });
    }
  } catch (err) {
    console.error('❌ setTypingStatus error:', err);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 6: ONLINE STATUS (LIGHTWEIGHT)
// ════════════════════════════════════════════════════════════════════════════

export function subscribeToPresence(
  chatId: string,
  userId: string,
  onPresenceChange: (typing: boolean) => void,
  onOnlineChange: (online: boolean) => void,
) {
  const channel = supabase.channel(`presence:${chatId}`);

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState() as Record<string, any[]>;
      const otherUsers = Object.values(state)
        .flat()
        .filter((p: any) => p.user_id !== userId);

      // Check typing status
      const typing = otherUsers.some((p: any) => p.is_typing);
      onPresenceChange(typing);

      // Check online status
      const online = otherUsers.length > 0;
      onOnlineChange(online);
    })
    .on('presence', { event: 'leave' }, () => {
      onPresenceChange(false);
      onOnlineChange(false);
    })
    .subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ user_id: userId, is_typing: false, online: true });
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 7: PERFORMANCE OPTIMIZATION
// ════════════════════════════════════════════════════════════════════════════

interface MessageCache {
  [chatId: string]: any[];
}

const messageCache: MessageCache = {};

export function getCachedMessages(chatId: string): any[] {
  return messageCache[chatId] ?? [];
}

export function setCachedMessages(chatId: string, messages: any[]): void {
  messageCache[chatId] = messages;
}

export function addToCache(chatId: string, message: any): void {
  if (!messageCache[chatId]) messageCache[chatId] = [];
  // Avoid duplicates
  if (!messageCache[chatId].find((m) => m.id === message.id)) {
    messageCache[chatId].push(message);
  }
}

export function clearMessageCache(chatId: string): void {
  delete messageCache[chatId];
}

// ════════════════════════════════════════════════════════════════════════════
// STEP 8: ERROR HANDLING & LOGGING
// ════════════════════════════════════════════════════════════════════════════

export interface MessageError {
  type: 'send_failed' | 'realtime_disconnect' | 'permission_denied' | 'unknown';
  message: string;
  retryable: boolean;
}

export function createErrorLog(error: any): MessageError {
  const msg = error?.message ?? '';
  const code = error?.code ?? '';

  if (msg.includes('permission')) {
    return {
      type: 'permission_denied',
      message: 'You do not have permission to send messages in this chat',
      retryable: false,
    };
  }

  if (msg.includes('RLS') || msg.includes('row level security')) {
    return {
      type: 'permission_denied',
      message: 'Message security check failed. Please try again.',
      retryable: true,
    };
  }

  if (msg.includes('Network') || msg.includes('timeout')) {
    return {
      type: 'realtime_disconnect',
      message: 'Network error. Check your connection.',
      retryable: true,
    };
  }

  return {
    type: 'send_failed',
    message: msg || 'Failed to send message',
    retryable: true,
  };
}

export function logRealtimeEvent(event: string, chatId: string, data?: any): void {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] 📡 ${event} | Chat: ${chatId}`, data ?? '');
}

export const MessageSystemLog = {
  subscriptionStart: (chatId: string) => logRealtimeEvent('✅ Subscription START', chatId),
  subscriptionEnd: (chatId: string) => logRealtimeEvent('🔌 Subscription END', chatId),
  messageReceived: (chatId: string, msgId: string) => logRealtimeEvent('📨 Message RECEIVED', chatId, msgId),
  messageSent: (chatId: string, msgId: string) => logRealtimeEvent('📤 Message SENT', chatId, msgId),
  messageSendFailed: (chatId: string, error: string) => logRealtimeEvent('❌ Message SEND FAILED', chatId, error),
  realtimeDisconnect: (chatId: string) => logRealtimeEvent('❌ Realtime DISCONNECT', chatId),
  realtimeReconnect: (chatId: string) => logRealtimeEvent('🔌 Realtime RECONNECT', chatId),
};

// ════════════════════════════════════════════════════════════════════════════
// STEP 9: CHAT LIST ENHANCEMENTS (UNREAD COUNT, LAST MESSAGE, ETC)
// ════════════════════════════════════════════════════════════════════════════

export async function getChatWithUnreadCount(
  chatId: string,
  currentUserId: string,
): Promise<{
  chat: any;
  unreadCount: number;
  preview: string;
} | null> {
  const { data: chat } = await supabase.from('chats').select('*').eq('id', chatId).single();

  if (!chat) return null;

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('chat_id', chatId)
    .neq('sender_id', currentUserId)
    .eq('status', 'sent');

  const preview = chat.last_message
    ? chat.last_message.length > 50
      ? chat.last_message.substring(0, 50) + '...'
      : chat.last_message
    : 'Start a conversation';

  return {
    chat,
    unreadCount: count ?? 0,
    preview,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// REALTIME CHAT LIST UPDATES
// ════════════════════════════════════════════════════════════════════════════

export function subscribeToChatsRealtime(
  userId: string,
  onChatUpdate: (chat: any) => void,
  onNewMessage: (chatId: string) => void,
) {
  const chatsChannel = supabase
    .channel(`chat-list:${userId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'chats', filter: `participants.cs.[${userId}]` },
      (payload: any) => {
        console.log('📱 Chat updated via realtime:', payload.new);
        onChatUpdate(payload.new);
      },
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload: any) => {
        console.log('💬 New message via realtime:', payload.new);
        onNewMessage(payload.new.chat_id);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(chatsChannel);
  };
}
