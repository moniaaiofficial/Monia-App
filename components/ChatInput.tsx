'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send, Paperclip, Smile, X, CornerUpLeft } from 'lucide-react';

type ReplyTo = {
  id: string;
  content: string;
  type: string;
  senderName: string;
  isSelf: boolean;
};

type Props = {
  onSend:           (content: string, type?: string, replyToId?: string) => void;
  onTypingChange?:  (isTyping: boolean) => void;
  onAttachment?:    () => void;
  onEmojiToggle?:   () => void;
  disabled?:        boolean;
  placeholder?:     string;
  replyTo?:         ReplyTo | null;
  onCancelReply?:   () => void;
};

export default function ChatInput({
  onSend, onTypingChange, onAttachment, onEmojiToggle, disabled,
  placeholder = 'Type a message…', replyTo, onCancelReply,
}: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) { isTypingRef.current = true; onTypingChange?.(true); }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false; onTypingChange?.(false);
    }, 2000);
  }, [onTypingChange]);

  const stopTyping = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isTypingRef.current) { isTypingRef.current = false; onTypingChange?.(false); }
  }, [onTypingChange]);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    stopTyping();
    onSend(trimmed, 'text', replyTo?.id);
    setText('');
    onCancelReply?.();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const onInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (e.target.value.trim()) startTyping(); else stopTyping();
  };

  const canSend = text.trim().length > 0 && !disabled;

  const previewText = (content: string, type: string) => {
    if (type === 'image') return '📷 Photo';
    if (type === 'video') return '🎥 Video';
    if (type === 'audio') return '🎤 Voice note';
    if (type === 'document') return '📎 Document';
    if (type === 'location') return '📍 Location';
    if (type === 'poll') {
      try { return `📊 ${JSON.parse(content).question}`; } catch { return '📊 Poll'; }
    }
    return content.length > 60 ? content.slice(0, 60) + '…' : content;
  };

  const btnStyle = {
    width: 34, height: 34, borderRadius: '50%', background: 'none', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0, transition: 'opacity 0.15s',
  };

  return (
    <div
      style={{
        position: 'fixed', bottom: '64px', left: 0, right: 0, zIndex: 50,
        background: '#14141f',
      }}
    >
      {/* Reply preview bar */}
      {replyTo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px 4px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <CornerUpLeft size={14} style={{ color: '#ff0066', flexShrink: 0 }} />
          <div style={{
            flex: 1, borderLeft: '2px solid #ff0066', paddingLeft: 8,
            minWidth: 0,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#ff0066', marginBottom: 1 }}>
              {replyTo.isSelf ? 'You' : replyTo.senderName}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {previewText(replyTo.content, replyTo.type)}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, padding: '8px 12px' }}>
        <button
          onClick={onAttachment}
          disabled={disabled}
          style={{ ...btnStyle, opacity: disabled ? 0.3 : 1 }}
          aria-label="Attachments"
        >
          <Paperclip size={20} style={{ color: 'rgba(255,255,255,0.45)' }} />
        </button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onInput={onInput}
          placeholder={disabled ? '🌙 Sleep mode — messaging paused' : placeholder}
          rows={1}
          disabled={disabled}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20,
            padding: '10px 14px',
            color: disabled ? 'rgba(255,255,255,0.35)' : '#ffffff',
            fontSize: 14, fontFamily: 'inherit',
            resize: 'none', outline: 'none',
            lineHeight: 1.5, maxHeight: 120,
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { if (!disabled) (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,71,26,0.45)'; }}
          onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.10)'; stopTyping(); }}
        />

        <button
          onClick={onEmojiToggle}
          disabled={disabled}
          style={{ ...btnStyle, opacity: disabled ? 0.3 : 1 }}
          aria-label="Emoji"
        >
          <Smile size={20} style={{ color: 'rgba(255,255,255,0.45)' }} />
        </button>

        <button
          onClick={submit}
          disabled={!canSend}
          aria-label="Send"
          style={{
            width: 42, height: 42, borderRadius: '50%', border: 'none',
            background: canSend ? 'linear-gradient(135deg,#ff0066,#a8e000)' : 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'default', flexShrink: 0,
            transition: 'background 0.2s, transform 0.15s',
          }}
          onPointerDown={(e) => { if (canSend) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; }}
          onPointerUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          <Send size={18} style={{ color: canSend ? '#14141f' : 'rgba(255,255,255,0.25)', strokeWidth: 2.5, marginLeft: 2 }} />
        </button>
      </div>
    </div>
  );
}
