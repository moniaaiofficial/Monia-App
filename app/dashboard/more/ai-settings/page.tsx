'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Volume2, Cpu, Cloud, Zap, Trash2, SlidersHorizontal } from 'lucide-react';
import { cacheClear } from '@/lib/ai-cache';
import { isGoogleTTSEnabled } from '@/lib/ai-voice';

type AIMode      = 'local' | 'hybrid' | 'cloud';
type VoiceStyle  = 'standard' | 'hd';
type Personality = 'friendly' | 'professional';

export default function AISettingsPage() {
  const router = useRouter();

  const [aiMode,       setAiMode]       = useState<AIMode>('hybrid');
  const [voiceStyle,   setVoiceStyle]   = useState<VoiceStyle>('standard');
  const [autoSpeak,    setAutoSpeak]    = useState(false);
  const [personality,  setPersonality]  = useState<Personality>('friendly');
  const [hdAvailable,  setHdAvailable]  = useState(false);
  const [cleared,      setCleared]      = useState(false);

  useEffect(() => {
    setAiMode((localStorage.getItem('monia_ai_mode') as AIMode) || 'hybrid');
    setVoiceStyle((localStorage.getItem('monia_voice_style') as VoiceStyle) || 'standard');
    setAutoSpeak(localStorage.getItem('monia_auto_speak') === 'true');
    setPersonality((localStorage.getItem('monia_personality') as Personality) || 'friendly');
    setHdAvailable(isGoogleTTSEnabled());
  }, []);

  const save = (key: string, value: string) => localStorage.setItem(key, value);

  const handleAiMode = (m: AIMode) => { setAiMode(m); save('monia_ai_mode', m); };
  const handleVoice  = (v: VoiceStyle) => { setVoiceStyle(v); save('monia_voice_style', v); };
  const handleSpeak  = (v: boolean) => { setAutoSpeak(v); save('monia_auto_speak', String(v)); };
  const handlePers   = (v: Personality) => { setPersonality(v); save('monia_personality', v); };

  const handleClearCache = async () => {
    await cacheClear();
    setCleared(true);
    setTimeout(() => setCleared(false), 2500);
  };

  return (
    <main style={{ minHeight: '100dvh', background: '#14141f', paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={20} style={{ color: '#fff' }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={18} style={{ color: '#ff0066' }} />
          <h1 style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0 }}>MONiA AI Settings</h1>
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* AI Mode */}
        <Section icon={<Cpu size={16} />} title="AI Mode" subtitle="How MONiA processes your requests">
          {[
            { key: 'local',  icon: <Cpu size={14} />,   label: 'Local',  desc: 'On-device only (fastest, offline)' },
            { key: 'hybrid', icon: <Zap size={14} />,   label: 'Hybrid', desc: 'Cache → Device → Cloud (recommended)' },
            { key: 'cloud',  icon: <Cloud size={14} />, label: 'Cloud',  desc: 'Always use cloud AI' },
          ].map(opt => (
            <RadioRow
              key={opt.key}
              icon={opt.icon}
              label={opt.label}
              desc={opt.desc}
              active={aiMode === opt.key}
              onSelect={() => handleAiMode(opt.key as AIMode)}
            />
          ))}
        </Section>

        {/* Voice Style */}
        <Section icon={<Volume2 size={16} />} title="Voice Style" subtitle="Choose your preferred TTS engine">
          <RadioRow
            icon={<Volume2 size={14} />}
            label="Standard (Free)"
            desc="Web Speech API · Indian Female voice · Zero cost"
            active={voiceStyle === 'standard'}
            onSelect={() => handleVoice('standard')}
          />
          <RadioRow
            icon={<Volume2 size={14} />}
            label="HD Premium"
            desc={hdAvailable ? 'Google Cloud TTS · High-quality female voice' : 'Not available — GOOGLE_TTS_API_KEY not configured'}
            active={voiceStyle === 'hd'}
            onSelect={() => hdAvailable && handleVoice('hd')}
            disabled={!hdAvailable}
          />
        </Section>

        {/* Auto-speak */}
        <Section icon={<Volume2 size={16} />} title="Voice Playback" subtitle="Auto-speak MONiA's responses">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div>
              <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>Auto-Speak</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '3px 0 0' }}>Read MONiA replies aloud automatically</p>
            </div>
            <button
              onClick={() => handleSpeak(!autoSpeak)}
              style={{ width: 48, height: 28, borderRadius: 14, background: autoSpeak ? '#ff0066' : 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: 3, left: autoSpeak ? 22 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
            </button>
          </div>
        </Section>

        {/* Personality */}
        <Section icon={<SlidersHorizontal size={16} />} title="Personality" subtitle="MONiA's tone and response style">
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#ff0066', fontWeight: 700 }}>Friendly</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Professional</span>
            </div>
            <input
              type="range" min={0} max={1} step={1}
              value={personality === 'friendly' ? 0 : 1}
              onChange={e => handlePers(Number(e.target.value) === 0 ? 'friendly' : 'professional')}
              style={{ width: '100%', accentColor: '#ff0066', height: 4, cursor: 'pointer' }}
            />
            <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
              Currently: <strong style={{ color: '#fff' }}>{personality === 'friendly' ? 'Friendly & Warm' : 'Professional & Concise'}</strong>
            </p>
          </div>
        </Section>

        {/* Cache Management */}
        <Section icon={<Trash2 size={16} />} title="Cache Management" subtitle="Manage stored AI responses">
          <button
            onClick={handleClearCache}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: cleared ? 'rgba(168,224,0,0.1)' : 'rgba(255,59,48,0.08)', border: `1px solid ${cleared ? 'rgba(168,224,0,0.3)' : 'rgba(255,59,48,0.25)'}`, color: cleared ? 'rgba(168,224,0,0.9)' : '#ff3b30', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Trash2 size={15} />
            {cleared ? '✓ Cache Cleared!' : 'Clear AI Response Cache'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
            Removes all locally cached responses from IndexedDB
          </p>
        </Section>

      </div>
    </main>
  );
}

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ color: '#ff0066' }}>{icon}</span>
        <div>
          <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>{title}</p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function RadioRow({ icon, label, desc, active, onSelect, disabled }: {
  icon: React.ReactNode; label: string; desc: string; active: boolean; onSelect: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12, background: active ? 'rgba(255,0,102,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? 'rgba(255,0,102,0.35)' : 'rgba(255,255,255,0.06)'}`, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, textAlign: 'left', transition: 'all 0.15s' }}>
      <span style={{ color: active ? '#ff0066' : 'rgba(255,255,255,0.4)' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: active ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 700, margin: 0 }}>{label}</p>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{desc}</p>
      </div>
      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${active ? '#ff0066' : 'rgba(255,255,255,0.2)'}`, background: active ? '#ff0066' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {active && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
      </div>
    </button>
  );
}
