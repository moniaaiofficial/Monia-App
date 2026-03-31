'use client';

// ── Priority voice names for Indian Female ─────────────────────────────────
const INDIAN_FEMALE_KEYWORDS = [
  'google हिन्दी',
  'google hindi',
  'lekha',
  'veena',
  'hemlata',
  'kalpana',
  'google english india',
  'microsoft hemlata',
  'microsoft kalpana',
  'raveena',
];

function pickFemaleVoice(voices: SpeechSynthesisVoice[], langCode?: string): SpeechSynthesisVoice | null {
  // 1. If a specific lang code is provided, find the best female for that language
  if (langCode) {
    const exact = voices.find(
      v => v.lang.toLowerCase().startsWith(langCode.toLowerCase()) &&
           !v.name.toLowerCase().includes('male'),
    );
    if (exact) return exact;
  }

  // 2. Prioritise Indian female voices
  for (const kw of INDIAN_FEMALE_KEYWORDS) {
    const match = voices.find(v => v.name.toLowerCase().includes(kw));
    if (match) return match;
  }

  // 3. Any India-locale voice that isn't explicitly male
  const indiaVoice = voices.find(
    v => (v.lang === 'hi-IN' || v.lang === 'en-IN') &&
         !v.name.toLowerCase().includes('male'),
  );
  if (indiaVoice) return indiaVoice;

  // 4. Any IN-locale
  const anyIndia = voices.find(v => v.lang.endsWith('-IN'));
  if (anyIndia) return anyIndia;

  // 5. Any voice with 'female' in name
  return voices.find(v => v.name.toLowerCase().includes('female')) ?? null;
}

export function isWebSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isGoogleTTSEnabled(): boolean {
  // HD mode is only available when the key is configured on the server
  // We expose a public flag via env (set manually if key is present)
  return !!(process.env.NEXT_PUBLIC_GOOGLE_TTS_ENABLED === 'true');
}

// ── Get available voices (async-safe) ─────────────────────────────────────
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    // Fallback timeout
    setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1500);
  });
}

// ── Detect language from text (simple heuristic) ──────────────────────────
function detectLangCode(text: string): string | undefined {
  // Hindi characters (Devanagari range)
  if (/[\u0900-\u097F]/.test(text)) return 'hi';
  // Arabic
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  // Chinese
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  // Japanese
  if (/[\u3040-\u30FF]/.test(text)) return 'ja';
  // Korean
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  return undefined;
}

// ── Primary: Web Speech API (FREE) ────────────────────────────────────────
export async function speakWebSpeech(text: string): Promise<void> {
  if (!isWebSpeechSupported()) return;
  window.speechSynthesis.cancel();

  const voices  = await getVoices();
  const langCode = detectLangCode(text);
  const chosen   = pickFemaleVoice(voices, langCode);

  const utter = new SpeechSynthesisUtterance(text);
  if (chosen) {
    utter.voice = chosen;
    utter.lang  = chosen.lang;
  } else {
    utter.lang = 'en-IN';
  }
  utter.rate  = 0.95;
  utter.pitch = 1.1;

  return new Promise((resolve) => {
    utter.onend   = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}

// ── Secondary: Google Cloud TTS (HD — requires GOOGLE_TTS_API_KEY on server) ─
export async function speakGoogleTTS(text: string, langCode = 'en-IN'): Promise<void> {
  try {
    const res = await fetch('/api/monia/tts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ text, lang: langCode }),
    });
    if (!res.ok) throw new Error('TTS request failed');
    const { audioBase64 } = await res.json();
    const binary  = atob(audioBase64);
    const bytes   = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'audio/mp3' });
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    await audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
  } catch {
    await speakWebSpeech(text);
  }
}

// ── Smart speak: Auto-selects engine ─────────────────────────────────────
export async function speak(text: string, hdMode = false): Promise<void> {
  if (hdMode && isGoogleTTSEnabled()) {
    await speakGoogleTTS(text);
  } else {
    await speakWebSpeech(text);
  }
}

export function stopSpeaking(): void {
  if (isWebSpeechSupported()) window.speechSynthesis.cancel();
}

// ── Speech-to-Text ────────────────────────────────────────────────────────
export function startSTT(
  onResult: (text: string) => void,
  onEnd:    () => void,
): (() => void) | null {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) return null;

  const rec = new SpeechRecognition();
  rec.continuous    = false;
  rec.interimResults = false;
  rec.lang = 'hi-IN';

  rec.onresult = (e: any) => {
    const transcript = e.results[0][0].transcript;
    onResult(transcript);
  };
  rec.onend = onEnd;
  rec.start();

  return () => rec.stop();
}
