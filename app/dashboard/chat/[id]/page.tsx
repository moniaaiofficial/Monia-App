'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, MoreVertical, X, User, BellOff, Trash2, ShieldOff } from 'lucide-react';
import { getInitials, type Message, type Profile } from '@/lib/chat';
import { uploadChatFile } from '@/lib/upload';
import { supabase } from '@/lib/supabase/client';
import ChatBubble from '@/components/ChatBubble';
import ChatInput from '@/components/ChatInput';
import TypingIndicator from '@/components/TypingIndicator';
import AttachmentMenu from '@/components/AttachmentMenu';
import VoiceRecorder from '@/components/VoiceRecorder';
import EmojiPicker from '@/components/EmojiPicker';

const isTimeInSleepMode = (start?: string, end?: string) => {
  if (!start || !end) return false;
  const now = new Date();
  const startTime = new Date(`${now.toDateString()} ${start}`);
  const endTime   = new Date(`${now.toDateString()} ${end}`);
  if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
  return now >= startTime && now <= endTime;
};

type ReplyTo = { id: string; content: string; type: string; senderName: string; isSelf: boolean };

async function apiGetMessages(chatId: string): Promise<Message[]> {
  const res = await fetch(`/api/messages?chatId=${chatId}&limit=100`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data ?? [];
}

async function apiSendMessage(chatId: string, content: string, type: string, replyToId?: string): Promise<Message | null> {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, content, type, replyToId }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

async function apiMarkRead(messageId: string) {
  await fetch('/api/messages', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageId, status: 'read' }),
  });
}

async function apiGetChatPartner(chatId: string): Promise<{ chat: any; partner: Profile | null }> {
  const res = await fetch('/api/chats');
  if (!res.ok) return { chat: null, partner: null };
  const json = await res.json();
  const chat = (json.data ?? []).find((c: any) => c.id === chatId);
  if (!chat) return { chat: null, partner: null };
  return { chat, partner: chat.partner ?? null };
}

function PollCreatorModal({ onSend, onClose }: { onSend: (q: string, opts: string[]) => void; onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [options,  setOptions]  = useState(['', '']);

  const addOption = () => { if (options.length < 6) setOptions([...options, '']); };
  const setOpt    = (i: number, v: string) => setOptions(options.map((o, j) => j === i ? v : o));
  const submit    = () => {
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (q && opts.length >= 2) { onSend(q, opts); onClose(); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', background: '#0a0412', borderRadius: '20px 20px 0 0', padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Create Poll</h3>
        <input type="text" placeholder="Ask a question…" value={question} onChange={(e) => setQuestion(e.target.value)}
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 12 }}
        />
        {options.map((opt, i) => (
          <input key={i} type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => setOpt(i, e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 8 }}
          />
        ))}
        {options.length < 6 && (
          <button onClick={addOption} style={{ color: '#ff0066', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>+ Add option</button>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.55)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} style={{ flex: 1, padding: '12px', borderRadius: 14, background: '#ff0066', border: 'none', color: '#14141f', fontWeight: 700, cursor: 'pointer' }}>Send Poll</button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { id: chatId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [messages,    setMessages]    = useState<Message[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [partner,     setPartner]     = useState<Profile | null>(null);
  const [isTyping,    setIsTyping]    = useState(false);
  const [sending,     setSending]     = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [notFound,    setNotFound]    = useState(false);
  const [replyTo,     setReplyTo]     = useState<ReplyTo | null>(null);

  const [showAttach,  setShowAttach]  = useState(false);
  const [showVoice,   setShowVoice]   = useState(false);
  const [showEmoji,   setShowEmoji]   = useState(false);
  const [showPoll,    setShowPoll]    = useState(false);

  const [menuOpen,       setMenuOpen]       = useState(false);
  const [showProfile,    setShowProfile]    = useState(false);
  const [clearConfirm,   setClearConfirm]   = useState(false);
  const [actionMsg,      setActionMsg]      = useState('');

  const bottomRef   = useRef<HTMLDivElement>(null);
  const presenceRef = useRef<any>(null);

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const loadMessages = useCallback(async () => {
    if (!chatId) return;
    const msgs = await apiGetMessages(chatId);
    setMessages(msgs);
    setTimeout(() => scrollToBottom(false), 80);

    if (user) {
      const unread = msgs.filter((m) => m.sender_id !== user.id && m.status !== 'read');
      for (const m of unread) await apiMarkRead(m.id);
    }
  }, [chatId, user, scrollToBottom]);

  useEffect(() => {
    if (!isLoaded || !user || !chatId) return;

    const init = async () => {
      const { chat, partner: p } = await apiGetChatPartner(chatId);
      if (!chat) { setNotFound(true); setLoading(false); return; }
      setPartner(p);
      await loadMessages();
      setLoading(false);
    };
    init();

    const msgChannel = supabase
      .channel(`messages-rt-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload: any) => {
          const newMsg = payload.new as Message;
          if (!newMsg?.id) { loadMessages(); return; }
          setMessages((prev) => {
            // Already in state (optimistic update replaced by apiSendMessage)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            // Remove any optimistic placeholder from the same sender (race-condition safety)
            const clean = prev.filter(
              (m) => !(m.id.startsWith('opt-') && m.sender_id === newMsg.sender_id),
            );
            return [...clean, newMsg];
          });
          if (newMsg.sender_id !== user!.id) {
            apiMarkRead(newMsg.id);
          }
          setTimeout(() => scrollToBottom(true), 80);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload: any) => {
          const updatedMsg = payload.new as Message;
          if (!updatedMsg?.id) { loadMessages(); return; }
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m)),
          );
        },
      )
      .subscribe();

    const presence = supabase.channel(`presence:${chatId}`);
    presenceRef.current = presence;
    presence
      .on('presence', { event: 'sync' }, () => {
        const state = presence.presenceState() as Record<string, any[]>;
        const typing = Object.values(state).flat().filter((p: any) => p.user_id !== user.id).some((p: any) => p.is_typing);
        setIsTyping(typing);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
        if (leftPresences.some((p: any) => p.user_id !== user.id)) setIsTyping(false);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') await presence.track({ user_id: user.id, is_typing: false });
      });

    return () => {
      supabase.removeChannel(msgChannel);
      if (presenceRef.current) { supabase.removeChannel(presenceRef.current); presenceRef.current = null; }
    };
  }, [isLoaded, user, chatId, loadMessages]);

  // Realtime partner profile subscription — avatar updates instantly
  useEffect(() => {
    if (!partner?.id) return;
    const ch = supabase
      .channel(`partner-profile-${partner.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${partner.id}` }, (payload: { new: Partial<Profile> }) => {
        console.log('[Chat] Partner avatar updated in realtime:', payload.new.avatar_url);
        setPartner((prev) => prev ? { ...prev, ...payload.new } : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [partner?.id]);

  const handleTypingChange = useCallback(async (typing: boolean) => {
    if (presenceRef.current && user) {
      await presenceRef.current.track({ user_id: user.id, is_typing: typing });
    }
  }, [user]);

  const addOptimistic = (content: string, type: string): string => {
    const optId = `opt-${Date.now()}`;
    const opt: Message = { id: optId, chat_id: chatId, sender_id: user!.id, content, type, status: 'sent', created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, opt]);
    setTimeout(() => scrollToBottom(true), 80);
    return optId;
  };

  const handleSend = async (content: string, type = 'text', replyToId?: string) => {
    if (!user || !chatId || sending) return;
    setSending(true);
    setReplyTo(null);
    const optId = addOptimistic(content, type);
    const sentMsg = await apiSendMessage(chatId, content, type, replyToId);
    setSending(false);
    if (sentMsg) {
      setMessages((prev) => prev.map((m) => (m.id === optId ? sentMsg : m)));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optId));
    }
  };

  const handleFiles = async (files: FileList, type?: string) => {
    if (!user || !chatId || uploading) return;
    setUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const msgType = type || (file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document');
      const optId = addOptimistic(JSON.stringify({ fileName: file.name, size: file.size, uploading: true }), msgType);
      const result = await uploadChatFile(file, chatId);
      if (result) {
        const content = JSON.stringify({ url: result.url, fileName: result.fileName, size: result.size, ...(msgType === 'document' ? { mimeType: result.mimeType } : {}) });
        const sentMsg = await apiSendMessage(chatId, content, msgType);
        if (sentMsg) { setMessages((prev) => prev.map((m) => (m.id === optId ? sentMsg : m))); }
        else { setMessages((prev) => prev.filter((m) => m.id !== optId)); }
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optId));
      }
    }
    setUploading(false);
  };

  const handleLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => { await handleSend(JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }), 'location'); },
      (err) => { if (err.code === err.PERMISSION_DENIED) alert('Please allow location access.'); },
    );
  };

  const handleVoiceSend = async (blob: Blob, duration: number) => {
    setShowVoice(false);
    if (!user || !chatId) return;
    setUploading(true);
    const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
    const optId = addOptimistic(JSON.stringify({ duration }), 'audio');
    const result = await uploadChatFile(file, chatId);
    if (result) {
      const sentMsg = await apiSendMessage(chatId, JSON.stringify({ url: result.url, duration }), 'audio');
      if (sentMsg) { setMessages((prev) => prev.map((m) => (m.id === optId ? sentMsg : m))); }
      else { setMessages((prev) => prev.filter((m) => m.id !== optId)); }
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optId));
    }
    setUploading(false);
  };

  const handlePoll = async (question: string, options: string[]) => {
    await handleSend(JSON.stringify({ question, options: options.map((text) => ({ text, votes: 0 })) }), 'poll');
  };

  const handleClearChat = async () => {
    if (!chatId) return;
    const res = await fetch(`/api/chats/${chatId}/clear`, { method: 'DELETE' });
    if (res.ok) { setMessages([]); setClearConfirm(false); setMenuOpen(false); setActionMsg('Chat cleared'); setTimeout(() => setActionMsg(''), 2500); }
    else { setClearConfirm(false); setActionMsg('Failed to clear'); setTimeout(() => setActionMsg(''), 2500); }
  };

  const handleBlock = async () => {
    if (!user || !partner) return;
    await supabase.from('blocked_users').upsert({ blocker_id: user.id, blocked_id: partner.id }, { onConflict: 'blocker_id,blocked_id' });
    setMenuOpen(false);
    setActionMsg(`${partner.full_name || 'User'} blocked`);
    setTimeout(() => setActionMsg(''), 2500);
  };

  const handleMute = async () => {
    if (!user || !partner) return;
    await supabase.from('user_chat_settings').upsert({ user_id: user.id, chat_id: chatId, partner_id: partner.id, is_muted: true }, { onConflict: 'user_id,chat_id' });
    setMenuOpen(false);
    setActionMsg('Notifications muted');
    setTimeout(() => setActionMsg(''), 2500);
  };

  if (loading) {
    return (
      <div style={{ background: '#14141f', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff0066', opacity: 0.6, animation: 'typingDot 1.2s ease-in-out infinite', animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (notFound || !partner) {
    return (
      <div style={{ background: '#14141f', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Chat not found</p>
        <button onClick={() => router.push('/dashboard')} style={{ color: '#ff0066', fontWeight: 700 }}>← Back to Chats</button>
      </div>
    );
  }

  const partnerInSleep = partner.sleep_mode_enabled && isTimeInSleepMode(partner.sleep_start, partner.sleep_end);

  return (
    <main style={{ background: '#14141f', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#14141f', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => router.push('/dashboard')} style={{ color: '#ffffff', flexShrink: 0 }}>
          <ArrowLeft size={22} />
        </button>
        <button onClick={() => setShowProfile(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
          {partner.avatar_url ? (
            <img src={partner.avatar_url} alt={partner.full_name ?? ''} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(255,0,102,0.30)', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,0,102,0.10)', border: '1px solid rgba(255,0,102,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff0066', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {getInitials(partner.full_name)}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{partner.full_name}</p>
            <p style={{ color: partnerInSleep ? '#ff0066' : 'rgba(255,255,255,0.38)', fontSize: 12 }}>
              {partnerInSleep ? '🌙 In Sleep Mode — messages stored' : isTyping ? '〰️〰️〰️ typing…' : `@${partner.username || ''}`}
            </p>
          </div>
        </button>
        <button onClick={() => setMenuOpen(true)} style={{ color: 'rgba(255,255,255,0.55)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
          <MoreVertical size={20} />
        </button>
      </div>

      {/* Action toast */}
      {actionMsg && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 300, background: 'rgba(255,0,102,0.15)', border: '1px solid rgba(255,0,102,0.35)', borderRadius: 20, padding: '8px 18px', color: '#ff0066', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
          {actionMsg}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '180px', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            messageId={msg.id}
            chatId={chatId}
            currentUserId={user?.id ?? ''}
            content={msg.content}
            timestamp={msg.created_at}
            isSent={msg.sender_id === user?.id}
            type={msg.type}
            status={msg.status}
            senderName={partner.full_name ?? undefined}
            senderAvatar={msg.sender_id === user?.id 
  ? undefined 
  : partner.avatar_url}
            onReplyTo={setReplyTo}
          />
        ))}
        {isTyping && !partnerInSleep && <TypingIndicator />}
        {uploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 4 }}>
            <div style={{ width: 120, height: 80, borderRadius: 12 }} />
          </div>
        )}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* Overlays */}
      {showAttach && (
        <AttachmentMenu
          onClose={() => setShowAttach(false)}
          onCamera={() => {}}
          onGallery={(files) => handleFiles(files)}
          onDocument={(files) => handleFiles(files, 'document')}
          onLocation={() => { setShowAttach(false); handleLocation(); }}
          onVoice={() => { setShowAttach(false); setShowVoice(true); }}
          onPoll={() => { setShowAttach(false); setShowPoll(true); }}
          onEmoji={() => { setShowAttach(false); setShowEmoji(true); }}
        />
      )}
      {showEmoji && (
        <EmojiPicker
          onClose={() => setShowEmoji(false)}
          onSelect={(emoji) => { setShowEmoji(false); handleSend(emoji, 'emoji'); }}
        />
      )}
      {showPoll && <PollCreatorModal onSend={handlePoll} onClose={() => setShowPoll(false)} />}

      {/* Chat input */}
      {showVoice ? (
        <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setShowVoice(false)} />
      ) : (
        <ChatInput
          onSend={handleSend}
          onTypingChange={handleTypingChange}
          onAttachment={() => { setShowEmoji(false); setShowAttach((v) => !v); }}
          onEmojiToggle={() => { setShowAttach(false); setShowEmoji((v) => !v); }}
          disabled={sending || uploading || partnerInSleep}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      )}

      {/* ── 3-Dots Action Menu ── */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setMenuOpen(false)}>
          <div
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0a0412', borderRadius: '20px 20px 0 0', padding: '20px 0 36px', boxShadow: '0 -4px 40px rgba(0,0,0,0.7)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
            {[
              { icon: User, label: 'View Profile', action: () => { setMenuOpen(false); setShowProfile(true); }, color: '#fff' },
              { icon: BellOff, label: 'Mute Notifications', action: handleMute, color: '#fff' },
              { icon: Trash2, label: 'Clear Chat', action: () => { setClearConfirm(true); }, color: '#ff6b6b' },
              { icon: ShieldOff, label: 'Block User', action: handleBlock, color: '#ff6b6b' },
            ].map(({ icon: Icon, label, action, color }) => (
              <button
                key={label}
                onClick={action}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '14px 24px', background: 'none', border: 'none', cursor: 'pointer', color }}
              >
                <Icon size={20} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear chat confirm */}
      {clearConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 160, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#0a0412', borderRadius: 20, padding: 24, width: '100%', maxWidth: 320 }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Clear Chat?</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>All messages in this chat will be permanently deleted for you.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setClearConfirm(false)} style={{ flex: 1, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.55)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleClearChat} style={{ flex: 1, padding: 12, borderRadius: 14, background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.4)', color: '#ff3b30', fontWeight: 700, cursor: 'pointer' }}>Clear</button>
            </div>
          </div>
        </div>
      )}

      {/* Partner Profile Bottom Sheet */}
      {showProfile && partner && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setShowProfile(false)}>
          <div
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0a0412', borderRadius: '20px 20px 0 0', padding: '24px 24px 48px', boxShadow: '0 -4px 40px rgba(0,0,0,0.7)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 20px' }} />
            <button onClick={() => setShowProfile(false)} style={{ position: 'absolute', top: 20, right: 20, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              {partner.avatar_url ? (
                <img src={partner.avatar_url} alt={partner.full_name ?? ''} style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,0,102,0.35)' }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,0,102,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#ff0066' }}>
                  {getInitials(partner.full_name)}
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{partner.full_name || 'MONiA User'}</p>
                <p style={{ color: '#ff0066', fontSize: 14, fontWeight: 600, marginTop: 2 }}>@{partner.username || '—'}</p>
              </div>
              <div style={{ width: '100%', marginTop: 8 }}>
                {partner.email && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', marginBottom: 4 }}>{partner.email}</p>}
                {partner.mobile && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', marginBottom: 4 }}>{partner.mobile}</p>}
                {partner.city && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center' }}>{partner.city}</p>}
                {partnerInSleep && <p style={{ color: '#ff0066', fontSize: 13, textAlign: 'center', marginTop: 8 }}>🌙 Currently in Sleep Mode</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
