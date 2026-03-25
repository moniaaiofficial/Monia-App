'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Check, Eye, EyeOff, MapPin, FileText, Download, CornerUpLeft } from 'lucide-react';
import { formatMsgTime, formatFileSize } from '@/lib/chat';
import { supabase } from '@/lib/supabase/client';

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😢', '🙏'];
const LONG_PRESS_MS = 500;
const SWIPE_THRESHOLD = 55;

type Reaction = { emoji: string; count: number; userReacted: boolean };

type Props = {
  messageId:    string;
  chatId:       string;
  currentUserId: string;
  content:      string;
  timestamp:    string;
  isSent:       boolean;
  type?:        string;
  status?:      'sent' | 'delivered' | 'read';
  senderName?:  string;
  senderAvatar?: string;
  onReplyTo?:   (msg: { id: string; content: string; type: string; senderName: string; isSelf: boolean }) => void;
};

function MediaContent({ type, content, isSent }: { type: string; content: string; isSent: boolean }) {
  let data: any = null;
  try { data = JSON.parse(content); } catch {}

  const textColor = isSent ? '#14141f' : 'rgba(255,255,255,0.92)';
  const subColor  = isSent ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';

  if (type === 'image') {
    return (
      <div style={{ maxWidth: 240 }}>
        <img src={data?.url || content} alt="Image"
          style={{ width: '100%', borderRadius: 12, display: 'block', maxHeight: 300, objectFit: 'cover' }}
          loading="lazy"
        />
        {data?.caption && <p style={{ color: textColor, fontSize: 13, marginTop: 6, wordBreak: 'break-word' }}>{data.caption}</p>}
      </div>
    );
  }

  if (type === 'video') {
    return (
      <div style={{ maxWidth: 240 }}>
        <video src={data?.url || content} controls
          style={{ width: '100%', borderRadius: 12, display: 'block', maxHeight: 240 }}
        />
        {data?.caption && <p style={{ color: textColor, fontSize: 13, marginTop: 6 }}>{data.caption}</p>}
      </div>
    );
  }

  if (type === 'audio') {
    return (
      <div style={{ minWidth: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 20 }}>🎤</span>
          <p style={{ color: textColor, fontSize: 13, fontWeight: 600 }}>
            Voice note · {data?.duration ? formatFileSize(data.duration) : ''}
          </p>
        </div>
        <audio src={data?.url || content} controls style={{ width: '100%', height: 36 }} />
      </div>
    );
  }

  if (type === 'document') {
    const ext = (data?.fileName || '').split('.').pop()?.toUpperCase() || 'FILE';
    return (
      <a href={data?.url || content} target="_blank" rel="noopener noreferrer"
        style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', minWidth: 180 }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 10, background: isSent ? 'rgba(0,0,0,0.15)' : 'rgba(198,255,51,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <FileText size={20} style={{ color: isSent ? '#14141f' : '#ff0066' }} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: textColor, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
            {data?.fileName || 'Document'}
          </p>
          <p style={{ color: subColor, fontSize: 11, marginTop: 2 }}>
            {ext} · {data?.size ? formatFileSize(data.size) : ''}
          </p>
        </div>
        <Download size={16} style={{ color: isSent ? 'rgba(0,0,0,0.5)' : 'rgba(198,255,51,0.6)', flexShrink: 0 }} />
      </a>
    );
  }

  if (type === 'location') {
    const lat = data?.lat ?? parseFloat((content || '').split(',')[0]);
    const lng = data?.lng ?? parseFloat((content || '').split(',')[1]);
    const label = data?.address || `${lat?.toFixed(4)}, ${lng?.toFixed(4)}`;
    return (
      <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noopener noreferrer"
        style={{ display: 'block', textDecoration: 'none' }}
      >
        <div style={{ width: 220, borderRadius: 12, overflow: 'hidden' }}>
          <img
            src={`https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&size=220,120&z=14&l=map&pt=${lng},${lat},pm2rdl`}
            alt="Map"
            style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={14} style={{ color: '#ff0066', flexShrink: 0 }} />
            <p style={{ color: textColor, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</p>
          </div>
        </div>
      </a>
    );
  }

  if (type === 'poll') {
    const totalVotes = (data?.options || []).reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
    return (
      <div style={{ minWidth: 200, maxWidth: 260 }}>
        <p style={{ color: textColor, fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{data?.question || 'Poll'}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(data?.options || []).map((opt: any, i: number) => {
            const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: textColor, fontSize: 13 }}>{opt.text}</span>
                  <span style={{ color: subColor, fontSize: 12 }}>{pct}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: isSent ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: isSent ? 'rgba(0,0,0,0.4)' : '#ff0066', borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ color: subColor, fontSize: 11, marginTop: 8 }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
      </div>
    );
  }

  if (type === 'emoji') {
    return <span style={{ fontSize: 48, lineHeight: 1 }}>{content}</span>;
  }

  return (
    <p style={{ color: isSent ? '#14141f' : 'rgba(255,255,255,0.92)', fontSize: 14, lineHeight: 1.55, wordBreak: 'break-word', fontWeight: isSent ? 600 : 400 }}>
      {content}
    </p>
  );
}

export default function ChatBubble({
  messageId, chatId, currentUserId,
  content, timestamp, isSent, type = 'text', status, senderName, senderAvatar, onReplyTo,
}: Props) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const didSwipe = useRef(false);

  const isMediaType = type !== 'text' && type !== 'emoji';
  const isEmojiOnly = type === 'emoji';

  const loadReactions = useCallback(async () => {
    if (!messageId || messageId.startsWith('opt-')) return;
    const { data } = await supabase
      .from('message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId);

    if (!data) return;

    const map: Record<string, { count: number; userReacted: boolean }> = {};
    for (const row of data) {
      if (!map[row.emoji]) map[row.emoji] = { count: 0, userReacted: false };
      map[row.emoji].count++;
      if (row.user_id === currentUserId) map[row.emoji].userReacted = true;
    }
    setReactions(Object.entries(map).map(([emoji, v]) => ({ emoji, ...v })));
  }, [messageId, currentUserId]);

  useEffect(() => {
    if (!messageId || messageId.startsWith('opt-')) return;
    loadReactions();

    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions', filter: `message_id=eq.${messageId}` },
        () => loadReactions(),
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [messageId, loadReactions]);

  const toggleReaction = async (emoji: string) => {
    setShowPicker(false);
    if (!messageId || messageId.startsWith('opt-')) return;

    const existing = reactions.find((r) => r.emoji === emoji);
    if (existing?.userReacted) {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', currentUserId)
        .eq('emoji', emoji);
    } else {
      await supabase
        .from('message_reactions')
        .upsert({ message_id: messageId, user_id: currentUserId, emoji }, { onConflict: 'message_id,user_id,emoji' });
    }
    await loadReactions();
    console.log(`[Reactions] Toggled ${emoji} on message ${messageId}`);
  };

  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => {
      if ('vibrate' in navigator) navigator.vibrate(40);
      setShowPicker(true);
    }, LONG_PRESS_MS);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    didSwipe.current = false;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwiping(true);
    startLongPress();
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);

    if (dy > 10) { cancelLongPress(); setSwiping(false); setSwipeX(0); return; }

    if (dx > 10) {
      cancelLongPress();
      const clamped = Math.min(dx, 80);
      setSwipeX(clamped);
    }
  };

  const onTouchEnd = () => {
    cancelLongPress();
    if (swipeX >= SWIPE_THRESHOLD && onReplyTo) {
      didSwipe.current = true;
      if ('vibrate' in navigator) navigator.vibrate(30);
      onReplyTo({ id: messageId, content, type, senderName: senderName || 'MONiA User', isSelf: isSent });
    }
    setSwiping(false);
    setSwipeX(0);
  };

  return (
    <>
      {/* Reaction picker overlay */}
      {showPicker && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200 }}
          onClick={() => setShowPicker(false)}
        >
          <div
            style={{
              position: 'fixed',
              bottom: '50%',
              left: isSent ? 'auto' : '16px',
              right: isSent ? '16px' : 'auto',
              transform: 'translateY(50%)',
              display: 'flex', gap: 6, padding: '10px 14px',
              background: 'rgba(20,10,35,0.97)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 40,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              zIndex: 201,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {REACTION_EMOJIS.map((emoji) => {
              const reacted = reactions.find((r) => r.emoji === emoji)?.userReacted;
              return (
                <button
                  key={emoji}
                  onClick={() => toggleReaction(emoji)}
                  style={{
                    fontSize: 26, background: reacted ? 'rgba(198,255,51,0.15)' : 'none',
                    border: reacted ? '1px solid rgba(198,255,51,0.4)' : '1px solid transparent',
                    borderRadius: 20, padding: '4px 6px', cursor: 'pointer',
                    transform: reacted ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isSent ? 'flex-end' : 'flex-start',
          marginBottom: 6,
          paddingLeft:  isSent ? (isMediaType ? '5%' : '15%') : 0,
          paddingRight: isSent ? 0 : (isMediaType ? '5%' : '15%'),
          position: 'relative',
        }}
      >
        {/* Swipe-to-reply arrow indicator */}
        {swipeX > 20 && (
          <div style={{
            position: 'absolute',
            left: isSent ? 'auto' : `-${Math.min(swipeX - 10, 30)}px`,
            right: isSent ? `-${Math.min(swipeX - 10, 30)}px` : 'auto',
            top: '50%', transform: 'translateY(-50%)',
            opacity: Math.min(swipeX / SWIPE_THRESHOLD, 1),
            transition: 'opacity 0.1s',
            pointerEvents: 'none',
          }}>
            <CornerUpLeft size={18} style={{ color: '#ff0066' }} />
          </div>
        )}

        {senderName && !isSent && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#ff0066', marginBottom: 2, paddingLeft: 4 }}>
            {senderName}
          </span>
        )}

        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={startLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          style={{
            transform: `translateX(${swipeX}px)`,
            transition: swiping ? 'none' : 'transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)',
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          {isEmojiOnly ? (
            <div style={{ padding: '4px 0' }}>
              <MediaContent type={type} content={content} isSent={isSent} />
            </div>
          ) : (
            <div style={{
              maxWidth: isMediaType ? 280 : '100%',
              padding: isMediaType ? '8px 10px' : '9px 14px',
              borderRadius: isSent ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: isSent ? '#ff0066' : 'rgba(255,255,255,0.06)',
              border: isSent ? 'none' : '1px solid rgba(198,255,51,0.12)',
              overflow: 'hidden',
            }}>
              <MediaContent type={type} content={content} isSent={isSent} />
            </div>
          )}
        </div>

        {/* Emoji reactions row */}
        {reactions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => toggleReaction(r.emoji)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '2px 7px', borderRadius: 12,
                  background: r.userReacted ? 'rgba(198,255,51,0.15)' : 'rgba(255,255,255,0.06)',
                  border: r.userReacted ? '1px solid rgba(198,255,51,0.5)' : '1px solid rgba(255,255,255,0.10)',
                  cursor: 'pointer', fontSize: 13,
                }}
              >
                {r.emoji}
                <span style={{ fontSize: 11, color: r.userReacted ? '#ff0066' : 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp + read receipt */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3, paddingLeft: isSent ? 0 : 4, paddingRight: isSent ? 4 : 0 }}>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontWeight: 500 }}>
            {formatMsgTime(timestamp)}
          </span>
          {isSent && status === 'read'      && <Eye    style={{ width: 12, height: 12, color: '#ff0066' }} />}
          {isSent && status === 'delivered' && <EyeOff style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.55)' }} />}
          {isSent && status === 'sent'      && <Check  style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.30)' }} />}
        </div>
      </div>
    </>
  );
}
