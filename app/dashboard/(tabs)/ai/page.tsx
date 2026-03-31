'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Bot, Mic, MicOff, Volume2, VolumeX, Send, Trash2, Loader2 } from 'lucide-react';
import { askMonia, type AIMode } from '@/lib/ai-brain';
import { speak, stopSpeaking, startSTT, isWebSpeechSupported } from '@/lib/ai-voice';

interface ChatMessage {
  id:     string;
  role:   'user' | 'monia';
  text:   string;
  source?: 'cache' | 'nano' | 'cloud';
}

function SourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const map: Record<string, { label: string; color: string }> = {
    cache: { label: '⚡ Cached',    color: 'rgba(168,224,0,0.85)' },
    nano:  { label: '🔬 On-Device', color: 'rgba(100,200,255,0.85)' },
    cloud: { label: '☁ Cloud',     color: 'rgba(255,100,150,0.85)' },
  };
  const info = map[source];
  if (!info) return null;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: info.color, display: 'block', marginTop: 4, opacity: 0.8 }}>
      {info.label}
    </span>
  );
}

export default function AiPage() {
  const [messages,     setMessages]     = useState<ChatMessage[]>([]);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [listening,    setListening]    = useState(false);
  const [autoSpeak,    setAutoSpeak]    = useState(false);
  const [lastResponse, setLastResponse] = useState('');
  const [mode,         setMode]         = useState<AIMode>('hybrid');
  const scrollRef = useRef<HTMLDivElement>(null);
  const stopSTTRef   = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('monia_ai_mode') as AIMode | null;
    if (stored) setMode(stored);
    const spk = localStorage.getItem('monia_auto_speak');
    if (spk === 'true') setAutoSpeak(true);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const buildHistory = useCallback(() =>
    messages.slice(-8).map(m => `${m.role === 'user' ? 'User' : 'MONiA'}: ${m.text}`),
  [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await askMonia(trimmed, buildHistory(), mode);
      const moniaMsg: ChatMessage = {
        id:     `m-${Date.now()}`,
        role:   'monia',
        text:   response.text,
        source: response.source,
      };
      setMessages(prev => [...prev, moniaMsg]);
      setLastResponse(response.text);
      if (autoSpeak) {
        const hdMode = localStorage.getItem('monia_voice_style') === 'hd';
        await speak(response.text, hdMode);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, buildHistory, mode, autoSpeak]);

  const handleMic = useCallback(() => {
    if (!isWebSpeechSupported()) {
      alert('Speech recognition is not supported in your browser.');
      return;
    }
    if (listening) {
      stopSTTRef.current?.();
      setListening(false);
      return;
    }
    setListening(true);
    const stop = startSTT(
      (text) => {
        setListening(false);
        sendMessage(text);
      },
      () => setListening(false),
    );
    stopSTTRef.current = stop;
  }, [listening, sendMessage]);

  const handleReplay = useCallback(() => {
    if (!lastResponse) return;
    const hdMode = localStorage.getItem('monia_voice_style') === 'hd';
    speak(lastResponse, hdMode);
  }, [lastResponse]);

  const handleClearChat = useCallback(() => {
    stopSpeaking();
    setMessages([]);
    setLastResponse('');
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const toggleAutoSpeak = () => {
    const next = !autoSpeak;
    setAutoSpeak(next);
    localStorage.setItem('monia_auto_speak', String(next));
    if (!next) stopSpeaking();
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#14141f', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,0,102,0.12)', border: '1px solid rgba(255,0,102,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} style={{ color: '#ff0066' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>MONiA AI</h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: 0, fontWeight: 500 }}>
              {mode === 'local' ? '🔬 Local Mode' : mode === 'cloud' ? '☁ Cloud Mode' : '⚡ Hybrid Mode'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={toggleAutoSpeak} title={autoSpeak ? 'Auto-speak ON' : 'Auto-speak OFF'}
            style={{ width: 34, height: 34, borderRadius: 10, background: autoSpeak ? 'rgba(255,0,102,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${autoSpeak ? 'rgba(255,0,102,0.4)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {autoSpeak ? <Volume2 size={15} style={{ color: '#ff0066' }} /> : <VolumeX size={15} style={{ color: 'rgba(255,255,255,0.4)' }} />}
          </button>
          <button onClick={handleClearChat} title="Clear chat"
            style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Trash2 size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: 56, color: 'rgba(255,255,255,0.25)' }}>
            <Bot size={48} style={{ color: 'rgba(255,0,102,0.25)', marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>I am MONiA</p>
            <p style={{ fontSize: 13, lineHeight: 1.5 }}>Your AI communication assistant.<br />Ask me anything or tap the mic to speak.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap', padding: '0 12px' }}>
              {['Help me reply politely', 'Summarize a conversation', 'How do I say sorry?'].map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  style={{ fontSize: 12, padding: '8px 14px', borderRadius: 20, background: 'rgba(255,0,102,0.08)', border: '1px solid rgba(255,0,102,0.2)', color: '#ff0066', cursor: 'pointer', fontWeight: 600 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #ff0066, #a8002e)'
                : 'rgba(255,255,255,0.07)',
              border: msg.role === 'monia' ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              {msg.role === 'monia' && (
                <p style={{ fontSize: 10, fontWeight: 700, color: '#ff0066', marginBottom: 4, margin: '0 0 4px' }}>MONiA</p>
              )}
              <p style={{ fontSize: 14, color: '#fff', lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</p>
              <SourceBadge source={msg.source} />
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Loader2 size={14} style={{ color: '#ff0066', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>MONiA is thinking…</span>
            </div>
          </div>
        )}

        <div style={{ height: 8 }} />
      </div>

      {/* ── Input bar ── */}
      <div style={{ padding: '10px 16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: '#14141f', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>

          {/* Mic */}
          <button onClick={handleMic}
            style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: listening ? 'rgba(255,0,102,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${listening ? 'rgba(255,0,102,0.5)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', animation: listening ? 'breathePulse 1.2s ease-in-out infinite' : 'none' }}>
            {listening ? <MicOff size={16} style={{ color: '#ff0066' }} /> : <Mic size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />}
          </button>

          {/* Text input */}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={listening ? 'Listening…' : 'Message MONiA…'}
            rows={1}
            style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4, maxHeight: 120, overflowY: 'auto' }}
          />

          {/* Replay */}
          {lastResponse && (
            <button onClick={handleReplay} title="Replay last response"
              style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Volume2 size={16} style={{ color: 'rgba(255,255,255,0.6)' }} />
            </button>
          )}

          {/* Send */}
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: input.trim() && !loading ? '#ff0066' : 'rgba(255,255,255,0.06)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'default', transition: 'background 0.2s' }}>
            <Send size={16} style={{ color: input.trim() && !loading ? '#fff' : 'rgba(255,255,255,0.3)' }} />
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
