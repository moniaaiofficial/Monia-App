'use client';

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { Send, Paperclip, Smile, X, CornerUpLeft, Mic, MicOff, Sparkles, Plus, Globe, Volume2 } from 'lucide-react';
import { translateText, analyzeContext, speakWithIndianFemaleVoice } from '@/lib/aiHandler';

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
  recentMessages?:  string[];
};

const LANGUAGES = [
  { group: '🇮🇳 Indian Languages', langs: [
    { code: 'hi',  name: 'Hindi' },
    { code: 'kn',  name: 'Kannada' },
    { code: 'ta',  name: 'Tamil' },
    { code: 'te',  name: 'Telugu' },
    { code: 'bn',  name: 'Bengali' },
    { code: 'mr',  name: 'Marathi' },
    { code: 'gu',  name: 'Gujarati' },
    { code: 'ml',  name: 'Malayalam' },
    { code: 'pa',  name: 'Punjabi' },
    { code: 'sa',  name: 'Sanskrit' },
    { code: 'ur',  name: 'Urdu' },
    { code: 'bho', name: 'Bhojpuri' },
    { code: 'raj', name: 'Rajasthani' },
    { code: 'har', name: 'Haryanvi' },
    { code: 'tlu', name: 'Tulu' },
    { code: 'or',  name: 'Odia' },
    { code: 'mai', name: 'Maithili' },
    { code: 'ks',  name: 'Kashmiri' },
    { code: 'kok', name: 'Konkani' },
    { code: 'sd',  name: 'Sindhi' },
  ]},
  { group: '🌍 Global Languages', langs: [
    { code: 'en',  name: 'English' },
    { code: 'es',  name: 'Spanish' },
    { code: 'fr',  name: 'French' },
    { code: 'de',  name: 'German' },
    { code: 'ja',  name: 'Japanese' },
    { code: 'zh',  name: 'Chinese' },
    { code: 'ar',  name: 'Arabic' },
    { code: 'ru',  name: 'Russian' },
    { code: 'pt',  name: 'Portuguese' },
    { code: 'it',  name: 'Italian' },
    { code: 'ko',  name: 'Korean' },
    { code: 'tr',  name: 'Turkish' },
    { code: 'vi',  name: 'Vietnamese' },
    { code: 'nl',  name: 'Dutch' },
    { code: 'sv',  name: 'Swedish' },
    { code: 'id',  name: 'Indonesian' },
    { code: 'pl',  name: 'Polish' },
    { code: 'uk',  name: 'Ukrainian' },
    { code: 'he',  name: 'Hebrew' },
    { code: 'th',  name: 'Thai' },
    { code: 'ms',  name: 'Malay' },
    { code: 'fa',  name: 'Persian' },
    { code: 'ro',  name: 'Romanian' },
    { code: 'cs',  name: 'Czech' },
    { code: 'hu',  name: 'Hungarian' },
    { code: 'fi',  name: 'Finnish' },
    { code: 'no',  name: 'Norwegian' },
    { code: 'da',  name: 'Danish' },
  ]},
];

const ALL_LANGS = LANGUAGES.flatMap(g => g.langs);

export default function ChatInput({
  onSend, onTypingChange, onAttachment, onEmojiToggle, disabled,
  placeholder = 'Type a message…', replyTo, onCancelReply, recentMessages = [],
}: Props) {
  const [text, setText]           = useState('');
  const [targetLang, setTargetLang] = useState<{ code: string; name: string }>({ code: 'en', name: 'English' });
  const [langSearch, setLangSearch] = useState('');
  const [langOpen, setLangOpen]   = useState(false);
  const [plusOpen, setPlusOpen]   = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAnalyzing, setIsAnalyzing]   = useState(false);
  const [aiInsight, setAiInsight]       = useState('');
  const [statusMsg, setStatusMsg]       = useState('');

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef  = useRef(false);
  const recognizerRef = useRef<any>(null);
  const langDropRef  = useRef<HTMLDivElement>(null);

  // ── Typing helpers ────────────────────────────────────────────────
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

  // ── Submit ────────────────────────────────────────────────────────
  const submit = async (overrideText?: string) => {
    const raw = (overrideText ?? text).trim();
    if (!raw || disabled) return;
    stopTyping();

    if (targetLang.code !== 'en' || raw.startsWith('@monia ')) {
      const toTranslate = raw.startsWith('@monia ') ? raw.slice(7).trim() : raw;
      setIsTranslating(true);
      setStatusMsg(`Translating to ${targetLang.name}…`);
      try {
        const translated = await translateText(toTranslate, targetLang.name);
        onSend(translated, 'text', replyTo?.id);
        speakWithIndianFemaleVoice(translated);
        setStatusMsg('');
      } catch {
        setStatusMsg('Translation failed — sending original');
        onSend(toTranslate, 'text', replyTo?.id);
      } finally {
        setIsTranslating(false);
      }
    } else {
      onSend(raw, 'text', replyTo?.id);
    }

    setText('');
    onCancelReply?.();
    setAiInsight('');
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

  // ── Voice Recognition ─────────────────────────────────────────────
  const toggleListening = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { setStatusMsg('Voice not supported in this browser'); return; }

    if (isListening) {
      recognizerRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SR();
    rec.continuous      = false;
    rec.interimResults  = false;
    rec.lang            = targetLang.code === 'bho' || targetLang.code === 'raj' || targetLang.code === 'har' || targetLang.code === 'tlu'
      ? 'hi-IN'
      : `${targetLang.code}-IN`.replace(/^(en|es|fr|de|ja|zh|ar|ru|pt|it|ko|tr|vi|nl|sv|id|pl|uk|he|th|ms|fa|ro|cs|hu|fi|no|da)-IN$/, `${targetLang.code}`);

    rec.onstart  = () => { setIsListening(true); setStatusMsg('Listening…'); };
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setText(prev => (prev + ' ' + transcript).trim());
      setStatusMsg('');
    };
    rec.onerror  = () => { setStatusMsg('Voice error — try again'); setIsListening(false); };
    rec.onend    = () => { setIsListening(false); setStatusMsg(''); };

    recognizerRef.current = rec;
    rec.start();
  };

  // ── AI Analysis ───────────────────────────────────────────────────
  const runAnalysis = async () => {
    if (!recentMessages.length && !text.trim()) {
      setAiInsight('Send a message first for MONiA to analyse!');
      return;
    }
    setIsAnalyzing(true);
    setStatusMsg('MONiA is thinking…');
    try {
      const msgs = [...recentMessages, ...(text.trim() ? [text.trim()] : [])];
      const insight = await analyzeContext(msgs);
      setAiInsight(insight);
      speakWithIndianFemaleVoice(insight);
    } catch {
      setAiInsight('Could not analyse — please try again.');
    } finally {
      setIsAnalyzing(false);
      setStatusMsg('');
    }
    setPlusOpen(false);
  };

  // ── MONiA shortcut ────────────────────────────────────────────────
  const focusWithMonia = () => {
    if (!textareaRef.current) return;
    if (!text.startsWith('@monia ')) setText('@monia ');
    textareaRef.current.focus();
    setTimeout(() => { if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = textareaRef.current.value.length; }, 0);
  };

  // ── Close dropdown on outside click ──────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langDropRef.current && !langDropRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Preload voices ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  const canSend = (text.trim().length > 0 || isTranslating) && !disabled;

  const filteredLangs = langSearch.trim()
    ? ALL_LANGS.filter(l => l.name.toLowerCase().includes(langSearch.toLowerCase()))
    : null;

  const previewText = (content: string, type: string) => {
    if (type === 'image')    return '📷 Photo';
    if (type === 'video')    return '🎥 Video';
    if (type === 'audio')    return '🎤 Voice note';
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
    <>
      {/* Keyframe injections */}
      <style>{`
        @keyframes monia-glow {
          0%, 100% { text-shadow: 0 0 4px #ff0066, 0 0 8px #ff0066; opacity: 0.85; }
          50%       { text-shadow: 0 0 12px #ff0066, 0 0 24px #ff0066, 0 0 36px #ff0066aa; opacity: 1; }
        }
        @keyframes monia-pulse-bg {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,0,102,0.0); }
          50%       { box-shadow: 0 0 0 6px rgba(255,0,102,0.15); }
        }
        @keyframes slide-up {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
        @keyframes mic-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,0,102,0.5); }
          50%       { box-shadow: 0 0 0 8px rgba(255,0,102,0); }
        }
      `}</style>

      {/* ═══ SOLID PARENT WRAPPER — fixed flush above BottomNav ═══ */}
      <div style={{
        position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 50,
        background: '#14141f',
        borderTop: '1px solid #2d2d3d',
      }}>
        {/* ── AI Insight strip (conditional, slides in above) ──────── */}
        {aiInsight && (
          <div style={{
            margin: '6px 12px 0',
            background: 'linear-gradient(135deg, rgba(255,0,102,0.12), rgba(168,224,0,0.08))',
            border: '1px solid rgba(255,0,102,0.25)',
            borderRadius: 12,
            padding: '7px 12px',
            display: 'flex', alignItems: 'flex-start', gap: 8,
            animation: 'slide-up 0.25s ease',
          }}>
            <Sparkles size={14} style={{ color: '#ff0066', flexShrink: 0, marginTop: 1 }} />
            <p style={{ flex: 1, fontSize: 12.5, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>{aiInsight}</p>
            <button onClick={() => setAiInsight('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 0, flexShrink: 0 }}>
              <X size={13} />
            </button>
          </div>
        )}

        {/* ── Status message (conditional) ─────────────────────────── */}
        {statusMsg && (
          <p style={{ textAlign: 'center', fontSize: 11, color: '#ff0066', margin: '4px 12px 0', opacity: 0.9 }}>
            {statusMsg}
          </p>
        )}

        {/* ══ SINGLE AI BAR ROW: MONiA + Translate on same line ═══ */}
        <div
          ref={langDropRef}
          style={{
            display: 'flex', alignItems: 'center',
            padding: '6px 12px 0',
            gap: 6, position: 'relative',
          }}
        >
          {/* MONiA shortcut — left */}
          <button
            onClick={focusWithMonia}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700, color: '#ff0066',
              padding: '2px 0', flexShrink: 0,
              animation: 'monia-glow 2.5s ease-in-out infinite',
              letterSpacing: 0.2, whiteSpace: 'nowrap',
            }}
          >
            ✦ Need MONiA's help?
          </button>

          {/* Spacer pushes dropdown to right */}
          <div style={{ flex: 1 }} />

          {/* Translate label + dropdown — right */}
          <Globe size={11} style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>Translate:</span>
          <button
            onClick={() => setLangOpen(o => !o)}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid #2d2d3d',
              borderRadius: 8, padding: '2px 7px', cursor: 'pointer',
              color: '#fff', fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 3,
              flexShrink: 0,
            }}
          >
            {targetLang.name} <span style={{ opacity: 0.4, fontSize: 9 }}>▾</span>
          </button>

          {/* Language dropdown — opens upward */}
          {langOpen && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 4px)', right: 12, left: 12,
              background: '#1a1a2e', border: '1px solid #2d2d3d',
              borderRadius: 14, zIndex: 200, overflow: 'hidden',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
              animation: 'slide-up 0.2s ease',
              maxHeight: 260, display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #2d2d3d' }}>
                <input
                  autoFocus
                  value={langSearch}
                  onChange={e => setLangSearch(e.target.value)}
                  placeholder="Search language…"
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid #2d2d3d',
                    borderRadius: 8, padding: '5px 10px', color: '#fff', fontSize: 12.5, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {filteredLangs ? (
                  filteredLangs.map(l => (
                    <button key={l.code} onClick={() => { setTargetLang(l); setLangOpen(false); setLangSearch(''); }}
                      style={{ width: '100%', textAlign: 'left', background: targetLang.code === l.code ? 'rgba(255,0,102,0.12)' : 'none', border: 'none', padding: '8px 14px', color: targetLang.code === l.code ? '#ff0066' : 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 13 }}>
                      {l.name} <span style={{ opacity: 0.35, fontSize: 10 }}>({l.code})</span>
                    </button>
                  ))
                ) : LANGUAGES.map(grp => (
                  <div key={grp.group}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', padding: '6px 14px 2px', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {grp.group}
                    </p>
                    {grp.langs.map(l => (
                      <button key={l.code} onClick={() => { setTargetLang(l); setLangOpen(false); setLangSearch(''); }}
                        style={{ width: '100%', textAlign: 'left', background: targetLang.code === l.code ? 'rgba(255,0,102,0.12)' : 'none', border: 'none', padding: '7px 14px', color: targetLang.code === l.code ? '#ff0066' : 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 13 }}>
                        {l.name} <span style={{ opacity: 0.35, fontSize: 10 }}>({l.code})</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── (+) Slide-up menu ──────────────────────────────────────── */}
        {plusOpen && (
          <div style={{
            position: 'absolute', bottom: '100%', left: 12,
            background: '#1a1a2e', border: '1px solid #2d2d3d',
            borderRadius: 14, padding: 6, display: 'flex', flexDirection: 'column', gap: 2,
            animation: 'slide-up 0.2s ease', zIndex: 100,
            boxShadow: '0 -8px 24px rgba(0,0,0,0.5)',
            minWidth: 170,
          }}>
            <button onClick={() => { toggleListening(); setPlusOpen(false); }} style={{ ...menuItemStyle }}>
              <Mic size={15} style={{ color: isListening ? '#ff0066' : '#a8e000' }} />
              <span>Voice AI (Local)</span>
            </button>
            <button onClick={() => { onAttachment?.(); setPlusOpen(false); }} style={{ ...menuItemStyle }}>
              <Paperclip size={15} style={{ color: '#a8e000' }} />
              <span>Media Attach</span>
            </button>
            <button onClick={runAnalysis} disabled={isAnalyzing} style={{ ...menuItemStyle, opacity: isAnalyzing ? 0.6 : 1 }}>
              <Sparkles size={15} style={{ color: '#a8e000' }} />
              <span>{isAnalyzing ? 'Analysing…' : 'AI Analysis'}</span>
            </button>
          </div>
        )}

        {/* ── Reply preview bar (conditional) ───────────────────────── */}
        {replyTo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 14px 0',
            borderBottom: '1px solid #2d2d3d',
          }}>
            <CornerUpLeft size={14} style={{ color: '#ff0066', flexShrink: 0 }} />
            <div style={{ flex: 1, borderLeft: '2px solid #ff0066', paddingLeft: 8, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#ff0066', marginBottom: 1 }}>
                {replyTo.isSelf ? 'You' : replyTo.senderName}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {previewText(replyTo.content, replyTo.type)}
              </p>
            </div>
            <button onClick={onCancelReply} style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ══ INPUT ROW — directly below AI bar, ZERO gap ══════════ */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, padding: '4px 12px 8px' }}>

          {/* (+) button */}
          <button
            onClick={() => setPlusOpen(o => !o)}
            disabled={disabled}
            style={{
              ...btnStyle, opacity: disabled ? 0.3 : 1,
              background: plusOpen ? 'rgba(255,0,102,0.15)' : 'none',
              transform: plusOpen ? 'rotate(45deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s, background 0.2s',
            }}
            aria-label="More options"
          >
            <Plus size={20} style={{ color: plusOpen ? '#ff0066' : 'rgba(255,255,255,0.45)' }} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={onKeyDown}
            onInput={onInput}
            placeholder={disabled ? '🌙 Sleep mode — messaging paused' : placeholder}
            rows={1}
            disabled={disabled || isTranslating}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${isTranslating ? 'rgba(255,0,102,0.4)' : 'rgba(255,255,255,0.10)'}`,
              borderRadius: 20, padding: '10px 14px',
              color: disabled ? 'rgba(255,255,255,0.35)' : '#ffffff',
              fontSize: 14, fontFamily: 'inherit',
              resize: 'none', outline: 'none',
              lineHeight: 1.5, maxHeight: 120,
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => { if (!disabled) e.target.style.borderColor = 'rgba(255,71,26,0.45)'; }}
            onBlur={(e)  => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; stopTyping(); }}
          />

          {/* Mic button */}
          <button
            onClick={toggleListening}
            disabled={disabled}
            style={{
              ...btnStyle, opacity: disabled ? 0.3 : 1,
              background: isListening ? 'rgba(255,0,102,0.2)' : 'none',
              animation: isListening ? 'mic-pulse 1s ease-in-out infinite' : 'none',
              borderRadius: '50%',
            }}
            aria-label={isListening ? 'Stop listening' : 'Voice input'}
          >
            {isListening
              ? <MicOff size={18} style={{ color: '#ff0066' }} />
              : <Mic size={18} style={{ color: 'rgba(255,255,255,0.45)' }} />}
          </button>

          {/* Emoji */}
          <button
            onClick={onEmojiToggle}
            disabled={disabled}
            style={{ ...btnStyle, opacity: disabled ? 0.3 : 1 }}
            aria-label="Emoji"
          >
            <Smile size={20} style={{ color: 'rgba(255,255,255,0.45)' }} />
          </button>

          {/* Send / TTS */}
          <button
            onClick={() => canSend ? submit() : undefined}
            disabled={!canSend}
            aria-label="Send"
            style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none',
              background: canSend
                ? (isTranslating ? 'linear-gradient(135deg,#ff0066,#ff6600)' : 'linear-gradient(135deg,#ff0066,#a8e000)')
                : 'rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canSend ? 'pointer' : 'default', flexShrink: 0,
              transition: 'background 0.2s, transform 0.15s',
            }}
            onPointerDown={(e) => { if (canSend) e.currentTarget.style.transform = 'scale(0.9)'; }}
            onPointerUp={(e)   => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            {isTranslating
              ? <Globe size={16} style={{ color: '#14141f' }} />
              : <Send size={18} style={{ color: canSend ? '#14141f' : 'rgba(255,255,255,0.25)', strokeWidth: 2.5, marginLeft: 2 }} />}
          </button>
        </div>
      </div>
    </>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  background: 'none', border: 'none', width: '100%', textAlign: 'left',
  padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
  color: 'rgba(255,255,255,0.85)', fontSize: 13,
  transition: 'background 0.15s',
};
