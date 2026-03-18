'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import {
  getChatMessages,
  sendMessage as sendMsg,
  subscribeToMessages,
  updateMessageStatus,
  getInitials,
  type Message,
  type Profile,
} from '@/lib/chat';
import { supabase } from '@/lib/supabase/client';
import ChatBubble from '@/components/ChatBubble';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';

const isTimeInSleepMode = (start?: string, end?: string) => {
  if (!start || !end) return false;
  const now       = new Date();
  const startTime = new Date(`${now.toDateString()} ${start}`);
  const endTime   = new Date(`${now.toDateString()} ${end}`);
  if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
  return now >= startTime && now <= endTime;
};

export default function ChatPage() {
  const { id: chatId } = useParams<{ id: string }>();
  const router          = useRouter();
  const { user, isLoaded } = useUser();

  const [messages,  setMessages]  = useState<Message[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [partner,   setPartner]   = useState<Profile | null>(null);
  const [isTyping,  setIsTyping]  = useState(false);
  const [sending,   setSending]   = useState(false);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const presenceRef  = useRef<any>(null);

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    if (!isLoaded || !user || !chatId) return;

    const setupChat = async () => {
      // Load chat + partner
      const { data: chat } = await supabase
        .from('chats').select('participants').eq('id', chatId).single();
      if (!chat) { setLoading(false); return; }

      const partnerId = (chat.participants as string[]).find((id) => id !== user.id);
      if (partnerId) {
        const { data: prof } = await supabase
          .from('profiles').select('*').eq('id', partnerId).single();
        setPartner(prof as Profile);
      }

      // Load messages
      const msgs = await getChatMessages(chatId);
      setMessages(msgs);
      setLoading(false);

      // Mark received messages as read
      const unread = msgs.filter((m) => m.sender_id !== user.id && m.status !== 'read');
      for (const m of unread) await updateMessageStatus(m.id, 'read');

      setTimeout(() => scrollToBottom(false), 100);
    };

    setupChat();

    // Real-time message subscription
    const unsub = subscribeToMessages(
      chatId,
      (newMsg) => {
        setMessages((prev) => {
          // Avoid duplicates (optimistic msg already there)
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.sender_id !== user.id) updateMessageStatus(newMsg.id, 'read');
        setTimeout(() => scrollToBottom(true), 100);
      },
      (updatedMsg) => {
        setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
      },
    );

    // Presence channel for typing indicator
    const presence = supabase.channel(`presence:${chatId}`);
    presenceRef.current = presence;

    presence
      .on('presence', { event: 'sync' }, () => {
        const state = presence.presenceState() as Record<string, any[]>;
        const partnerPresences = Object.values(state).flat().filter((p: any) => p.user_id !== user.id);
        const typing = partnerPresences.some((p: any) => p.is_typing === true);
        setIsTyping(typing);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
        if (leftPresences.some((p: any) => p.user_id !== user.id)) setIsTyping(false);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await presence.track({ user_id: user.id, is_typing: false });
        }
      });

    return () => {
      unsub();
      if (presenceRef.current) {
        supabase.removeChannel(presenceRef.current);
        presenceRef.current = null;
      }
    };
  }, [isLoaded, user, chatId, scrollToBottom]);

  // Called by ChatInput when typing state changes
  const handleTypingChange = useCallback(async (typing: boolean) => {
    if (presenceRef.current && user) {
      await presenceRef.current.track({ user_id: user.id, is_typing: typing });
    }
  }, [user]);

  const handleSend = async (content: string) => {
    if (!user || !chatId || sending || !content.trim()) return;
    setSending(true);

    // Optimistic message
    const optimisticId  = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id:         optimisticId,
      chat_id:    chatId,
      sender_id:  user.id,
      content,
      type:       'text',
      status:     'sent',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 100);

    const sentMsg = await sendMsg(chatId, user.id, content);
    setSending(false);

    if (sentMsg) {
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? sentMsg : m)));
    } else {
      // Roll back optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#06000c', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#c6ff33', opacity: 0.6, animation: 'typingDot 1.2s ease-in-out infinite', animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div style={{ background: '#06000c', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Chat not found</p>
        <button onClick={() => router.push('/dashboard')} style={{ color: '#c6ff33', fontWeight: 700 }}>← Back to Chats</button>
      </div>
    );
  }

  const partnerInSleep = partner.sleep_mode_enabled && isTimeInSleepMode(partner.sleep_start, partner.sleep_end);

  return (
    <main style={{ background: '#06000c', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Chat Header ─────────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(6,0,12,0.94)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => router.push('/dashboard')} style={{ color: '#c6ff33', flexShrink: 0 }}>
          <ArrowLeft size={22} />
        </button>

        {partner.avatar_url ? (
          <img src={partner.avatar_url} alt={partner.full_name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(198,255,51,0.30)', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(198,255,51,0.10)', border: '1px solid rgba(198,255,51,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c6ff33', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
            {getInitials(partner.full_name)}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {partner.full_name}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12, marginTop: 1 }}>
            {partnerInSleep
              ? '🌙 In Sleep Mode'
              : isTyping
              ? '〰️〰️〰️ typing…'
              : `@${partner.username || ''}`}
          </p>
        </div>

        <button style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
          <MoreVertical size={20} />
        </button>
      </div>

      {/* ── Messages ────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 8px' }}>
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            content={msg.content}
            timestamp={msg.created_at}
            isSent={msg.sender_id === user?.id}
            status={msg.status}
          />
        ))}

        {isTyping && !partnerInSleep && <TypingIndicator />}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────── */}
      <ChatInput
        onSend={handleSend}
        onTypingChange={handleTypingChange}
        disabled={sending || partnerInSleep}
      />

      {/* bottom padding so input doesn't cover last message */}
      <div style={{ height: 70, flexShrink: 0 }} />
    </main>
  );
}
