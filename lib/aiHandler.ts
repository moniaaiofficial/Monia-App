const GEMINI_KEY = 'AIzaSyBcg7MWZI0yahCLf0kz3x9pRYb0VHXSyTQ';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

export async function translateText(input: string, targetLangName: string): Promise<string> {
  const prompt = `Identify the language of this text and translate it into ${targetLangName}: ${input}. Output ONLY the translation.`;
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? input;
}

export async function analyzeContext(messages: string[]): Promise<string> {
  const context = messages.slice(-10).join('\n');
  const prompt = `You are MONiA, a professional Indian AI assistant. Analyze this conversation and give a brief, helpful insight or suggestion in 1-2 sentences:\n\n${context}`;
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? 'No insight available.';
}

export function speakWithIndianFemaleVoice(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();

  const PRIORITY = [
    'Google हिन्दी',
    'Google Hindi Female',
    'Google English India Female',
    'Microsoft Hemlata',
    'Microsoft Kalpana',
    'Lekha',
    'Veena',
  ];

  let chosen: SpeechSynthesisVoice | null = null;
  for (const name of PRIORITY) {
    const v = voices.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
    if (v) { chosen = v; break; }
  }
  if (!chosen) {
    chosen = voices.find(v =>
      (v.lang.startsWith('hi') || v.lang.includes('IN')) && !v.name.toLowerCase().includes('male')
    ) ?? voices.find(v => v.lang.includes('IN')) ?? null;
  }
  if (!chosen) {
    chosen = voices.find(v => v.name.toLowerCase().includes('female')) ?? null;
  }

  if (chosen) utter.voice = chosen;
  utter.rate = 0.95;
  utter.pitch = 1.1;
  window.speechSynthesis.speak(utter);
}
