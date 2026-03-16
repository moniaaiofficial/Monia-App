'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

type Props = {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function ChatInput({ onSend, disabled, placeholder = 'Type a message…' }: Props) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
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
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onInput={onInput}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 20,
            padding: '10px 16px',
            color: '#ffffff',
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'none',
            outline: 'none',
            lineHeight: 1.5,
            maxHeight: 120,
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(198,255,51,0.45)'; }}
          onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.10)'; }}
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
          onPointerUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
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
