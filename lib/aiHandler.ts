'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

// ── ISO Language Map (60+ languages) ─────────────────────────────────────────
export const LANGUAGE_MAP: Record<string, string> = {
  // Indian Languages
  hi:  'Hindi',
  kn:  'Kannada',
  ta:  'Tamil',
  te:  'Telugu',
  bn:  'Bengali',
  mr:  'Marathi',
  gu:  'Gujarati',
  ml:  'Malayalam',
  pa:  'Punjabi',
  sa:  'Sanskrit',
  ur:  'Urdu',
  bho: 'Bhojpuri',
  raj: 'Rajasthani',
  har: 'Haryanvi',
  tlu: 'Tulu',
  or:  'Odia',
  mai: 'Maithili',
  ks:  'Kashmiri',
  kok: 'Konkani',
  sd:  'Sindhi',
  // Global Languages
  en:  'English',
  es:  'Spanish',
  fr:  'French',
  de:  'German',
  ja:  'Japanese',
  zh:  'Chinese',
  ar:  'Arabic',
  ru:  'Russian',
  pt:  'Portuguese',
  it:  'Italian',
  ko:  'Korean',
  tr:  'Turkish',
  vi:  'Vietnamese',
  nl:  'Dutch',
  sv:  'Swedish',
  id:  'Indonesian',
  pl:  'Polish',
  uk:  'Ukrainian',
  he:  'Hebrew',
  th:  'Thai',
  ms:  'Malay',
  fa:  'Persian',
  ro:  'Romanian',
  cs:  'Czech',
  hu:  'Hungarian',
  fi:  'Finnish',
  no:  'Norwegian',
  da:  'Danish',
  el:  'Greek',
  sk:  'Slovak',
  bg:  'Bulgarian',
  hr:  'Croatian',
  lt:  'Lithuanian',
  lv:  'Latvian',
  et:  'Estonian',
  sl:  'Slovenian',
  sr:  'Serbian',
  ca:  'Catalan',
  sq:  'Albanian',
  az:  'Azerbaijani',
  ka:  'Georgian',
  hy:  'Armenian',
  sw:  'Swahili',
  am:  'Amharic',
  yo:  'Yoruba',
  ig:  'Igbo',
  ha:  'Hausa',
  zu:  'Zulu',
  af:  'Afrikaans',
  ne:  'Nepali',
  si:  'Sinhala',
  my:  'Burmese',
  km:  'Khmer',
  lo:  'Lao',
  mn:  'Mongolian',
  tl:  'Filipino',
  jv:  'Javanese',
  su:  'Sundanese',
};

// ── Gemini SDK Initialization ─────────────────────────────────────────────────
function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set');
  return new GoogleGenerativeAI(apiKey);
}

// ── Any-to-Any Translation (Auto-detect source → target) ─────────────────────
export async function translateText(
  input: string,
  targetLangCode: string,
): Promise<string> {
  const targetLangName = LANGUAGE_MAP[targetLangCode] ?? targetLangCode;
  const client = getGeminiClient();
  const model  = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt =
    `Identify the language of this text and translate it into ${targetLangName}: ${input}. Output ONLY the translation.`;

  const result = await model.generateContent(prompt);
  const text   = result.response.text().trim();
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

// ── AI Context Analysis ───────────────────────────────────────────────────────
export async function analyzeContext(messages: string[]): Promise<string> {
  const client  = getGeminiClient();
  const model   = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const context = messages.slice(-10).join('\n');

  const prompt =
    `You are MONiA, a professional Indian AI assistant. ` +
    `Analyze this conversation and give a brief, helpful insight or suggestion in 1-2 sentences:\n\n${context}`;

  const result = await model.generateContent(prompt);
  return result.response.text().trim() || 'No insight available.';
}

// ── Indian Female TTS ─────────────────────────────────────────────────────────
// Priority list: Indian Female voices in order of preference.
const INDIAN_FEMALE_PRIORITY = [
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

function pickIndianFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // 1. Match by priority keyword (case-insensitive)
  for (const keyword of INDIAN_FEMALE_PRIORITY) {
    const match = voices.find(v => v.name.toLowerCase().includes(keyword));
    if (match) return match;
  }

  // 2. Any India-locale voice that isn't explicitly male
  const indiaVoice = voices.find(
    v => (v.lang === 'hi-IN' || v.lang === 'en-IN') &&
         !v.name.toLowerCase().includes('male'),
  );
  if (indiaVoice) return indiaVoice;

  // 3. Any IN-locale voice
  const anyIndia = voices.find(v => v.lang.endsWith('-IN'));
  if (anyIndia) return anyIndia;

  // 4. Any voice with 'female' in name as final fallback
  return voices.find(v => v.name.toLowerCase().includes('female')) ?? null;
}

export function speakWithIndianFemaleVoice(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utter  = new SpeechSynthesisUtterance(text);
  const voices  = window.speechSynthesis.getVoices();
  const chosen  = pickIndianFemaleVoice(voices);

  if (chosen) {
    utter.voice = chosen;
  } else {
    // Force en-IN lang so the browser picks an India voice automatically
    utter.lang = 'en-IN';
  }

  utter.rate  = 0.95;
  utter.pitch = 1.1;
  window.speechSynthesis.speak(utter);
}
