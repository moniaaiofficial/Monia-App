import { supabase } from '@/lib/supabase/client';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'poll' | 'emoji';

export type Message = {
  id:         string;
  chat_id:    string;
  sender_id:  string;
  content:    string;
  type:       string;
  status:     'sent' | 'delivered' | 'read';
  created_at: string;
};

export type Profile = {
  id:                  string;
  full_name:           string;
  email:               string;
  username:            string;
  mobile?:             string;
  city?:               string;
  avatar_url?:         string;
  sleep_mode_enabled?: boolean;
  sleep_start?:        string;
  sleep_end?:          string;
};

export type Chat = {
  id:                string;
  participants:      string[];
  last_message:      string | null;
  last_message_time: string;
  created_at:        string;
  partner:           Profile | null;
};

export async function getUserChats(userId: string): Promise<Chat[]> {
  const { data: chats, error } = await supabase
    .from('chats')
    .select('*')
    .contains('participants', [userId])
    .order('last_message_time', { ascending: false });

  if (error || !chats) return [];

  const partnerIds = [
    ...new Set(
      chats.flatMap((c: any) =>
        (c.participants as string[]).filter((id: string) => id !== userId),
      ),
    ),
  ];

  let profileMap: Record<string, Profile> = {};
  if (partnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, username, mobile, city, avatar_url, sleep_mode_enabled, sleep_start, sleep_end')
      .in('id', partnerIds);
    profileMap = Object.fromEntries((profiles ?? []).map((p: Profile) => [p.id, p]));
  }

  return chats.map((chat: any) => {
    const partnerId = (chat.participants as string[]).find((id) => id !== userId);
    return { ...chat, partner: partnerId ? (profileMap[partnerId] ?? null) : null };
  });
}

export async function getChatMessages(chatId: string, limit = 100): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as Message[];
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  content: string,
  type: string = 'text',
): Promise<Message | null> {
  const { data: msg, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: senderId, content, type, status: 'sent' })
    .select()
    .single();

  if (error) {
    console.error('sendMessage error:', error);
    return null;
  }

  // Update chat list preview
  const preview = type === 'text' ? content : `📎 ${type.charAt(0).toUpperCase() + type.slice(1)}`;
  await supabase
    .from('chats')
    .update({ last_message: preview, last_message_time: new Date().toISOString() })
    .eq('id', chatId);

  return msg as Message;
}

export async function createOrGetChat(userId1: string, userId2: string): Promise<Chat | null> {
  const { data: existing } = await supabase
    .from('chats')
    .select('*')
    .contains('participants', [userId1])
    .contains('participants', [userId2]);

  const match = (existing ?? []).find(
    (c: any) => (c.participants as string[]).length === 2,
  );
  if (match) return match as Chat;

  const { data: created, error } = await supabase
    .from('chats')
    .insert({ participants: [userId1, userId2] })
    .select()
    .single();

  if (error) {
    console.error('createOrGetChat error:', error);
    return null;
  }
  return created as Chat;
}

export function subscribeToMessages(
  chatId: string,
  onNew:    (msg: Message) => void,
  onUpdate: (msg: Message) => void,
) {
  const channel = supabase
    .channel(`messages:${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      (payload: any) => onNew(payload.new as Message),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      (payload: any) => onUpdate(payload.new as Message),
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export async function updateMessageStatus(messageId: string, status: 'delivered' | 'read') {
  const { error } = await supabase
    .from('messages')
    .update({ status })
    .eq('id', messageId);

  if (error) console.error('updateMessageStatus error:', error);
}

export async function searchProfiles(query: string, excludeId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, username, mobile, city, avatar_url')
    .neq('id', excludeId)
    .or(`full_name.ilike.%${query}%,username.ilike.%${query}%,city.ilike.%${query}%`)
    .limit(20);

  if (error) {
    console.error('searchProfiles error:', error);
    return [];
  }
  return (data ?? []) as Profile[];
}

export function formatMsgTime(iso: string): string {
  if (!iso) return '';
  const d   = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate()     === now.getDate() &&
    d.getMonth()    === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  return sameDay
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)          return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getInitials(name: string | undefined | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
