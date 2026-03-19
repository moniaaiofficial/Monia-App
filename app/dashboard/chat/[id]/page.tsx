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
  const now       = new Date();
  const startTime = new Date(`${now.toDateString()} ${start}`);
  const endTime   = new Date(`${now.toDateString()} ${end}`);
  if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);
  return now >= startTime && now <= endTime;
};

function PollCreatorModal({ onSend, onClose }: { onSend: (q: string, opts: string[]) => void; onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [options,  setOptions]  = useState(['', '']);

  const addOption = () => { if (options.length < 6) setOptions([...options, '']); };
  const setOpt    = (i: number, v: string) => setOptions(options.map((o, j) => j === i ? v : o));
  const submit    = () => {
    const q    = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (q && opts.length >= 2) { onSend(q, opts); onClose(); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', background: '#0a0412', borderRadius: '20px 20px 0 0', padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Create Poll</h3>
        <input
          type="text" placeholder="Ask a question…" value={question} onChange={(e) => setQuestion(e.target.value)}
          style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 12 }}
        />
        {options.map((opt, i) => (
          <input key={i} type="text" placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => setOpt(i, e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', marginBottom: 8 }}
          />
        ))}
        {options.length < 6 && (
          <button onClick={addOption} style={{ color: '#c6ff33', fontWeight: 600, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
            + Add option
          </button>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.55)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={submit} style={{ flex: 1, padding: '12px', borderRadius: 14, background: '#c6ff33', border: 'none', color: '#06000c', fontWeight: 700, cursor: 'pointer' }}>Send Poll</button>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { id: chatId } = useParams<{ id: string }>();
  const router          = useRouter();
  const { user, isLoaded } = useUser();

  const [messages,       setMessages]       = useState<Message[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [partner,        setPartner]        = useState<Profile | null>(null);
  const [isTyping,       setIsTyping]       = useState(false);
  const [sending,        setSending]        = useState(false);
  const [uploading,      setUploading]      = useState(false);

  const [showAttach,     setShowAttach]     = useState(false);
  const [showVoice,      setShowVoice]      = useState(false);
  const [showEmoji,      setShowEmoji]      = useState(false);
  const [showPoll,       setShowPoll]       = useState(false);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const presenceRef = useRef<any>(null);

  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    if (!isLoaded || !user || !chatId) return;

    const setupChat = async () => {
      const { data: chat } = await supabase
        .from('chats').select('participants').eq('id', chatId).single();
      if (!chat) { setLoading(false); return; }

      const partnerId = (chat.participants as string[]).find((id) => id !== user.id);
      if (partnerId) {
        const { data: prof } = await supabase
          .from('profiles').select('*').eq('id', partnerId).single();
        setPartner(prof as Profile);
      }

      const msgs = await getChatMessages(chatId);
      setMessages(msgs);
      setLoading(false);

      const unread = msgs.filter((m) => m.sender_id !== user.id && m.status !== 'read');
      for (const m of unread) await updateMessageStatus(m.id, 'read');
      setTimeout(() => scrollToBottom(false), 100);
    };

    setupChat();

    const unsub = subscribeToMessages(
      chatId,
      (newMsg) => {
        setMessages((prev) => {
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
      unsub();
      if (presenceRef.current) { supabase.removeChannel(presenceRef.current); presenceRef.current = null; }
    };
  }, [isLoaded, user, chatId, scrollToBottom]);

  const handleTypingChange = useCallback(async (typing: boolean) => {
    if (presenceRef.current && user) {
      await presenceRef.current.track({ user_id: user.id, is_typing: typing });
    }
  }, [user]);

  const addOptimistic = (content: string, type: string): string => {
    const optId = `opt-${Date.now()}`;
    const opt: Message = { id: optId, chat_id: chatId, sender_id: user!.id, content, type, status: 'sent', created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, opt]);
    setTimeout(() => scrollToBottom(true), 100);
    return optId;
  };

  const handleSend = async (content: string, type = 'text') => {
    if (!user || !chatId || sending) return;
    setSending(true);

    const optId = addOptimistic(content, type);
    const sentMsg = await sendMsg(chatId, user.id, content, type);
    setSending(false);

    if (sentMsg) {
      setMessages((prev) => prev.map((m) => (m.id === optId ? sentMsg : m)));
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optId));
    }
  };

  // ── File upload handler (images, videos, documents) ──────────────
  const handleFiles = async (files: FileList, type?: string) => {
    if (!user || !chatId || uploading) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const msgType = type || (file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document');
      const previewContent = JSON.stringify({ fileName: file.name, size: file.size, uploading: true });
      const optId = addOptimistic(previewContent, msgType);

      const result = await uploadChatFile(file, chatId);
      if (result) {
        let content: string;
        if (msgType === 'image' || msgType === 'video') {
          content = JSON.stringify({ url: result.url, fileName: result.fileName, size: result.size });
        } else {
          content = JSON.stringify({ url: result.url, fileName: result.fileName, size: result.size, mimeType: result.mimeType });
        }

        const sentMsg = await sendMsg(chatId, user.id, content, msgType);
        if (sentMsg) {
          setMessages((prev) => prev.map((m) => (m.id === optId ? sentMsg : m)));
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== optId));
        }
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optId));
      }
    }
    setUploading(false);
  };

  // ── Location ─────────────────────────────────────────────────────
  const handleLocation = () => {
    if (!navigator.geolocation) { alert('Geolocation is not supported by your browser'); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const content = JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        await handleSend(content, 'location');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          alert('Please allow location access in your browser settings to share your location.');
        }
      },
    );
  };

  // ── Voice note ───────────────────────────────────────────────────
  const handleVoiceSend = async (blob: Blob, duration: number) => {
    setShowVoice(false);
    if (!user || !chatId) return;
    setUploading(true);

    const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
    const optId = addOptimistic(JSON.stringify({ duration }), 'audio');
    const result = await uploadChatFile(file, chatId);

    if (result) {
      const content = JSON.stringify({ url: result.url, duration });
      const sentMsg = await sendMsg(chatId, user.id, content, 'audio');
      if (sentMsg) {
        setMessages((prev) => prev.map((m) => (m.id === optId ? sentMsg : m)));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optId));
      }
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== optId));
    }
    setUploading(false);
  };

  // ── Poll ─────────────────────────────────────────────────────────
  const handlePoll = async (question: string, options: string[]) => {
    const content = JSON.stringify({ question, options: options.map((text) => ({ text, votes: 0 })) });
    await handleSend(content, 'poll');
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
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Chat not found</p>
        <button onClick={() => router.push('/dashboard')} style={{ color: '#c6ff33', fontWeight: 700 }}>← Back to Chats</button>
      </div>
    );
  }

  const partnerInSleep = partner.sleep_mode_enabled && isTimeInSleepMode(partner.sleep_start, partner.sleep_end);

  return (
    <main style={{ background: '#06000c', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
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
          <p style={{ color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{partner.full_name}</p>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 12 }}>
            {partnerInSleep ? '🌙 In Sleep Mode' : isTyping ? '〰️〰️〰️ typing…' : `@${partner.username || ''}`}
          </p>
        </div>
        <button style={{ color: 'rgba(255,255,255,0.4)' }}><MoreVertical size={20} /></button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 8px' }}>
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            content={msg.content}
            timestamp={msg.created_at}
            isSent={msg.sender_id === user?.id}
            type={msg.type}
            status={msg.status}
          />
        ))}
        {isTyping && !partnerInSleep && <TypingIndicator />}
        {uploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 4 }}>
            <div className="skeleton" style={{ width: 120, height: 80, borderRadius: 12 }} />
          </div>
        )}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {/* Overlays */}
      {showAttach && (
        <AttachmentMenu
          onClose={() => setShowAttach(false)}
          onCamera={  () => {}}
          onGallery={ (files) => handleFiles(files) }
          onDocument={(files) => handleFiles(files, 'document')}
          onLocation={() => { setShowAttach(false); handleLocation(); }}
          onVoice={   () => { setShowAttach(false); setShowVoice(true); }}
          onPoll={    () => { setShowAttach(false); setShowPoll(true);  }}
          onEmoji={   () => { setShowAttach(false); setShowEmoji(true); }}
        />
      )}
      {showEmoji && (
        <EmojiPicker
          onClose={() => setShowEmoji(false)}
          onSelect={(emoji) => { setShowEmoji(false); handleSend(emoji, 'emoji'); }}
        />
      )}
      {showPoll && <PollCreatorModal onSend={handlePoll} onClose={() => setShowPoll(false)} />}

      {/* Input or Voice recorder */}
      {showVoice ? (
        <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setShowVoice(false)} />
      ) : (
        <ChatInput
          onSend={handleSend}
          onTypingChange={handleTypingChange}
          onAttachment={() => { setShowEmoji(false); setShowAttach((v) => !v); }}
          onEmojiToggle={() => { setShowAttach(false); setShowEmoji((v) => !v); }}
          disabled={sending || uploading || partnerInSleep}
        />
      )}

      <div style={{ height: 70, flexShrink: 0 }} />
    </main>
  );
}
