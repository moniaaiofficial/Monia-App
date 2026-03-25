'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Trash2 } from 'lucide-react';

type Props = {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VoiceRecorder({ onSend, onCancel }: Props) {
  const [recording,  setRecording]  = useState(false);
  const [elapsed,    setElapsed]    = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioUrl,   setAudioUrl]   = useState<string | null>(null);

  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef     = useRef<Blob | null>(null);

  const MAX_SECONDS = 15 * 60; // 15 minutes

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      if (mediaRef.current?.state === 'recording') mediaRef.current.stop();
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' });
      mediaRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setHasRecording(true);
        stream.getTracks().forEach((t) => t.stop());
      };

      mr.start(100);
      setRecording(true);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev >= MAX_SECONDS - 1) { stopRecording(); return prev; }
          return prev + 1;
        });
      }, 1000);
    } catch {
      onCancel();
    }
  };

  const stopRecording = () => {
    stopTimer();
    if (mediaRef.current?.state === 'recording') mediaRef.current.stop();
    setRecording(false);
  };

  const handleSend = () => {
    if (blobRef.current) onSend(blobRef.current, elapsed);
  };

  const handleDelete = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    onCancel();
  };

  return (
    <div style={{ position: 'fixed', bottom: 88, left: 0, right: 0, zIndex: 50, padding: '14px 16px', background: 'rgba(6,0,12,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      {!hasRecording ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={handleDelete} style={{ color: '#ef4444', flexShrink: 0 }}><Trash2 size={20} /></button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', flexShrink: 0, animation: 'breathePulse 1s ease-in-out infinite' }} />
            <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(elapsed / MAX_SECONDS) * 100}%`, background: '#ff471a', transition: 'width 1s linear' }} />
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{formatDuration(elapsed)}</span>
          </div>

          <button
            onClick={stopRecording}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
          >
            <Square size={16} style={{ color: '#ef4444' }} />
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={handleDelete} style={{ color: '#ef4444', flexShrink: 0 }}><Trash2 size={20} /></button>

          <div style={{ flex: 1 }}>
            {audioUrl && (
              <audio src={audioUrl} controls style={{ width: '100%', height: 36, colorScheme: 'dark' }} />
            )}
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 4 }}>
              🎤 Voice note · {formatDuration(elapsed)}
            </p>
          </div>

          <button
            onClick={handleSend}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#ff471a,#a8e000)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 0 16px rgba(198,255,51,0.35)', flexShrink: 0 }}
          >
            <Send size={18} style={{ color: '#1a0d00', marginLeft: 2 }} />
          </button>
        </div>
      )}
    </div>
  );
}
