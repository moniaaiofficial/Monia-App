'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { getChatMessages, sendMessage as sendMsg, subscribeToMessages, updateMessageStatus, getInitials, type Message, type Profile } from '@/lib/chat';
import { supabase } from '@/lib/supabase/client';
import ChatBubble from '@/components/ChatBubble';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';

// Define a type for the presence state to avoid using 'any'
interface PresenceState {
  user_id: string;
  is_typing: boolean;
}

const isTimeInSleepMode = (start?: string, end?: string) => {
  if (!start || !end) return false;
  const now = new Date();
  const startTime = new Date(now.toDateString() + ' ' + start);
  const endTime = new Date(now.toDateString() + ' ' + end);
  if (endTime < startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }
  return now >= startTime && now <= endTime;
};

export default function ChatPage() {
  const { id: chatId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null); // RealtimeChannel type is complex, any is acceptable here for now

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    if (!isLoaded || !user || !chatId) return;

    const setupChat = async () => {
      const { data: chat } = await supabase.from('chats').select('participants').eq('id', chatId).single();
      if (!chat) { setLoading(false); return; }

      const partnerId = (chat.participants as string[]).find((id) => id !== user.id);
      if (partnerId) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', partnerId).single();
        setPartner(profile as Profile);
      }

      const msgs = await getChatMessages(chatId);
      setMessages(msgs);
      setLoading(false);

      const unreadMessages = msgs.filter((m) => m.sender_id !== user.id && m.status !== 'read');
      for (const m of unreadMessages) {
        await updateMessageStatus(m.id, 'read');
      }

      setTimeout(() => scrollToBottom(false), 100);
    };

    setupChat();

    const handleNewMessage = (newMsg: Message) => {
      setMessages((prev) => [...prev, newMsg]);
      if (newMsg.sender_id !== user.id) {
        updateMessageStatus(newMsg.id, 'read');
      }
      setTimeout(() => scrollToBottom(true), 100);
    };

    const handleUpdatedMessage = (updatedMsg: Message) => {
      setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
    };

    const messageSubscription = subscribeToMessages(chatId, handleNewMessage, handleUpdatedMessage);
    
    const presenceChannel = supabase.channel(`chat-presence:${chatId}`);
    channelRef.current = presenceChannel;

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState() as Record<string, PresenceState[]>;
        const partnerPresence = Object.values(newState).flat().find((p) => p.user_id !== user.id);
        setIsTyping(partnerPresence ? partnerPresence.is_typing : false);
      })
      .on('presence', { event: 'join' }, ({ newPresences }: { newPresences: PresenceState[] }) => {
         // Handle user join if needed
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: PresenceState[] }) => {
        const partnerLeft = leftPresences.find((p) => p.user_id !== user.id);
        if(partnerLeft) setIsTyping(false);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.id, is_typing: false });
        }
      });

    return () => {
      messageSubscription();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isLoaded, user, chatId, scrollToBottom]);

  const handleTyping = async (isTyping: boolean) => {
    if (channelRef.current && user) {
      await channelRef.current.track({ user_id: user.id, is_typing: isTyping });
    }
  };

  const handleSend = async (content: string) => {
    if (!user || !chatId || sending || !content.trim()) return;
    setSending(true);
    await handleTyping(false);

    const optimisticId = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      chat_id: chatId,
      sender_id: user.id,
      content,
      type: 'text',
      status: 'sent',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 100);

    const sentMsg = await sendMsg(chatId, user.id, content);
    setSending(false);

    if (sentMsg) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? sentMsg : m)));
    } else {
        setMessages(prev => prev.filter(m => m.id !== optimisticId)); // remove optimistic if failed
    }
  };

  if (loading || !partner) {
    return <div style={{ background: '#06000c', minHeight: '100vh' }} >...Loading</div>; // Basic loader
  }

  const partnerInSleep = isTimeInSleepMode(partner.sleep_start, partner.sleep_end);

  return (
    <main style={{ background: '#06000c', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(6,0,12,0.94)', backdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.back()} style={{ color: '#c6ff33' }}><ArrowLeft size={22} /></button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(198,255,51,0.10)', border: '1px solid rgba(198,255,51,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c6ff33', fontWeight: 700, fontSize: 14 }}>
          {getInitials(partner.full_name)}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#fff', fontWeight: 700 }}>{partner.full_name}</p>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>
            {partnerInSleep ? '🌙 In Sleep Mode' : (isTyping ? 'typing... 〰️' : 'Online')}
          </p>
        </div>
        <button style={{ color: 'rgba(255,255,255,0.4)' }}><MoreVertical size={20} /></button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.map((msg) => (
          <ChatBubble key={msg.id} {...msg} timestamp={msg.created_at} isSent={msg.sender_id === user?.id} />
        ))}
        {isTyping && !partnerInSleep && <TypingIndicator />} 
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} disabled={sending || partnerInSleep} />
    </main>
  );
}
