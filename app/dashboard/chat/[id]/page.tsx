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
} from '@/lib/chat';
import { supabase } from '@/lib/supabase/client';
import ChatBubble from '@/components/ChatBubble';
import ChatInput from '@/components/ChatInput';

export default function ChatPage() {
  const { id: chatId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState('');
  const [partnerInitials, setPartnerInitials] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  /* ── Scroll to bottom ───────────────────────────────────────── */
  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  /* ── Load chat metadata + messages ─────────────────────────── */
  useEffect(() => {
    if (!isLoaded || !user || !chatId) return;

    (async () => {
      const { data: chat } = await supabase
        .from('chats')
        .select('participants')
        .eq('id', chatId)
        .single();

      if (chat) {
        const partnerId = (chat.participants as string[]).find((id) => id !== user.id);
        if (partnerId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', partnerId)
            .single();
          const name = profile?.full_name ?? 'User';
          setPartnerName(name);
          setPartnerInitials(getInitials(name));
        }
      }

      const msgs = await getChatMessages(chatId);
      setMessages(msgs);
      setLoading(false);

      const unread = msgs.filter((m) => m.sender_id !== user.id && m.status !== 'read');
      unread.forEach((m) => updateMessageStatus(m.id, 'read'));

      setTimeout(() => scrollToBottom(false), 60);
    })();
  }, [isLoaded, user, chatId, scrollToBottom]);

  /* ── Real-time subscription ─────────────────────────────────── */
  useEffect(() => {
    if (!chatId || !user) return;

    const unsubscribe = subscribeToMessages(chatId, (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      if (newMsg.sender_id !== user.id) {
        updateMessageStatus(newMsg.id, 'read');
      }
      setTimeout(() => scrollToBottom(true), 60);
    });

    return unsubscribe;
  }, [chatId, user, scrollToBottom]);

  /* ── Send handler ───────────────────────────────────────────── */
  const handleSend = async (content: string) => {
    if (!user || !chatId || sending) return;
    setSending(true);

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      chat_id: chatId,
      sender_id: user.id,
      content,
      type: 'text',
      status: 'sent',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => scrollToBottom(true), 60);

    const sent = await sendMsg(chatId, user.id, content);
    setSending(false);

    if (sent) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? sent : m)),
      );
    }
  };

  /* ── Skeleton ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <main style={{ background: '#06000c', minHeight: '100vh' }}>
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: 'rgba(6,0,12,0.94)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 16, width: 120, marginBottom: 6 }} />
            <div className="skeleton" style={{ height: 12, width: 60 }} />
          </div>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: i % 2 ? 'flex-end' : 'flex-start' }}>
              <div className="skeleton" style={{ height: 44, width: `${50 + Math.random() * 30}%`, borderRadius: 18 }} />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main style={{ background: '#06000c', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(6,0,12,0.94)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={() => router.back()}
          style={{ color: '#c6ff33', flexShrink: 0 }}
          aria-label="Back"
        >
          <ArrowLeft style={{ width: 22, height: 22 }} />
        </button>

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(198,255,51,0.10)',
            border: '1px solid rgba(198,255,51,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 14,
            fontWeight: 700,
            color: '#c6ff33',
          }}
        >
          {partnerInitials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {partnerName}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, fontWeight: 500, marginTop: 2 }}>
            MONiA user
          </p>
        </div>

        <button style={{ color: 'rgba(255,255,255,0.4)' }} aria-label="More options">
          <MoreVertical style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* ── Messages ────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          padding: '16px 16px 160px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: 'rgba(198,255,51,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontSize: 26,
                }}
              >
                💬
              </div>
              <p style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}>Start the conversation</p>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13 }}>Say hello to {partnerName}</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              content={msg.content}
              timestamp={msg.created_at}
              isSent={msg.sender_id === user?.id}
              status={msg.status}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────── */}
      <ChatInput onSend={handleSend} disabled={sending} />
    </main>
  );
}
