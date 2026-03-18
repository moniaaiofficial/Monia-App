'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

type Props = {
  onSend: (content: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function ChatInput({ onSend, onTypingChange, disabled, placeholder = 'Type a message…' }: Props) {
  const [text, setText] = useState('');
  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef  = useRef(false);

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingChange?.(true);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      onTypingChange?.(false);
    }, 2000);
  }, [onTypingChange]);

  const stopTyping = useCallback(() => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onTypingChange?.(false);
    }
  }, [onTypingChange]);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    stopTyping();
    onSend(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 88,
        left: 0,
        right: 0,
        zIndex: 40,
        padding: '10px 16px',
        background: 'rgba(6,0,12,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onInput={onInput}
          placeholder={disabled ? '🌙 Sleep mode – messaging paused' : placeholder}
          rows={1}
          disabled={disabled}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20,
            padding: '10px 16px',
            color: disabled ? 'rgba(255,255,255,0.35)' : '#ffffff',
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.5,
            maxHeight: 120,
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { if (!disabled) (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(198,255,51,0.45)'; }}
          onBlur={(e)  => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.10)'; stopTyping(); }}
        />
        <button
          onClick={submit}
          disabled={!canSend}
          aria-label="Send message"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: canSend
              ? 'linear-gradient(135deg, #c6ff33 0%, #a8e000 100%)'
              : 'rgba(255,255,255,0.08)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'default',
            flexShrink: 0,
            transition: 'background 0.2s, transform 0.15s',
            boxShadow: canSend ? '0 0 16px rgba(198,255,51,0.35)' : 'none',
          }}
          onPointerDown={(e) => { if (canSend) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.9)'; }}
          onPointerUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          <Send
            style={{
              width: 18,
              height: 18,
              color: canSend ? '#06000c' : 'rgba(255,255,255,0.25)',
              strokeWidth: 2.5,
              marginLeft: 2,
            }}
          />
        </button>
      </div>
    </div>
  );
}
