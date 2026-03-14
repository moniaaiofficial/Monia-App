'use client';

import { createContext, useContext, useRef, useCallback, useEffect } from 'react';

type UICtx = {
  playClick:   () => void;
  playSuccess: () => void;
  playError:   () => void;
  playStartup: () => void;
  haptic:      (type?: 'click' | 'error' | 'success') => void;
};

const UIContext = createContext<UICtx>({
  playClick:   () => {},
  playSuccess: () => {},
  playError:   () => {},
  playStartup: () => {},
  haptic:      () => {},
});

export const useUI = () => useContext(UIContext);

function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function ramp(
  gain: GainNode,
  ctx: AudioContext,
  from: number,
  to: number,
  duration: number
) {
  gain.gain.setValueAtTime(from, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    Math.max(to, 0.0001),
    ctx.currentTime + duration
  );
}

export default function UIProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<AudioContext | null>(null);
  const startedRef = useRef(false);

  const getCtx = useCallback((): AudioContext | null => {
    if (!audioRef.current) {
      audioRef.current = createAudioContext();
    }
    if (audioRef.current?.state === 'suspended') {
      audioRef.current.resume().catch(() => {});
    }
    return audioRef.current;
  }, []);

  /* ── Soft liquid pop (click) ─────────────────────────────────── */
  const playClick = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }, [getCtx]);

  /* ── Smooth slide up (success) ───────────────────────────────── */
  const playSuccess = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const freqs = [440, 550, 660];
    freqs.forEach((f, i) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = f;
      const start = ctx.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }, [getCtx]);

  /* ── Double electric pulse (error) ──────────────────────────── */
  const playError = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    [0, 0.14].forEach((delay) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.value = 180;
      const start = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.1);
      osc.start(start);
      osc.stop(start + 0.12);
    });
  }, [getCtx]);

  /* ── Sub-bass swoosh + crystal ping (startup) ────────────────── */
  const playStartup = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;

    /* Swoosh — swept noise-ish */
    const swoosh = ctx.createOscillator();
    const swooshGain = ctx.createGain();
    swoosh.connect(swooshGain);
    swooshGain.connect(ctx.destination);
    swoosh.type = 'sawtooth';
    swoosh.frequency.setValueAtTime(60, ctx.currentTime);
    swoosh.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.6);
    swooshGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    swooshGain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.2);
    swooshGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.65);
    swoosh.start(ctx.currentTime);
    swoosh.stop(ctx.currentTime + 0.7);

    /* Crystal ping */
    const ping = ctx.createOscillator();
    const pingGain = ctx.createGain();
    ping.connect(pingGain);
    pingGain.connect(ctx.destination);
    ping.type = 'sine';
    ping.frequency.value = 1480;
    pingGain.gain.setValueAtTime(0.32, ctx.currentTime + 0.5);
    pingGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.3);
    ping.start(ctx.currentTime + 0.5);
    ping.stop(ctx.currentTime + 1.4);
  }, [getCtx]);

  /* ── Haptics ─────────────────────────────────────────────────── */
  const haptic = useCallback((type: 'click' | 'error' | 'success' = 'click') => {
    if (!('vibrate' in navigator)) return;
    if (type === 'click')   navigator.vibrate(8);
    if (type === 'error')   navigator.vibrate([25, 40, 25]);
    if (type === 'success') navigator.vibrate([10, 20, 10]);
  }, []);

  /* ── Global click listener for auto-feedback ─────────────────── */
  useEffect(() => {
    const onInteract = () => {
      haptic('click');
      playClick();
    };

    document.addEventListener('pointerdown', onInteract, { passive: true });
    return () => document.removeEventListener('pointerdown', onInteract);
  }, [haptic, playClick]);

  return (
    <UIContext.Provider value={{ playClick, playSuccess, playError, playStartup, haptic }}>
      {children}
    </UIContext.Provider>
  );
}
