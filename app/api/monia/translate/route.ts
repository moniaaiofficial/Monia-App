import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const LANG_MAP: Record<string, string> = {
  hi: 'Hindi', en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  ja: 'Japanese', zh: 'Chinese', ar: 'Arabic', ru: 'Russian', pt: 'Portuguese',
  it: 'Italian', ko: 'Korean', tr: 'Turkish', vi: 'Vietnamese', nl: 'Dutch',
  bn: 'Bengali', ta: 'Tamil', te: 'Telugu', mr: 'Marathi', gu: 'Gujarati',
  ml: 'Malayalam', pa: 'Punjabi', ur: 'Urdu', kn: 'Kannada', or: 'Odia',
  sv: 'Swedish', pl: 'Polish', uk: 'Ukrainian', he: 'Hebrew', th: 'Thai',
  ms: 'Malay', fa: 'Persian', ro: 'Romanian', cs: 'Czech', el: 'Greek',
  hu: 'Hungarian', fi: 'Finnish', no: 'Norwegian', da: 'Danish', sw: 'Swahili',
  ne: 'Nepali', si: 'Sinhala', tl: 'Filipino', id: 'Indonesian',
};

function getGemini() {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error('AI key not configured');
  return new GoogleGenerativeAI(key);
}

export async function POST(req: Request) {
  try {
    const { text, targetLang } = await req.json();
    if (!text || !targetLang) {
      return NextResponse.json({ error: 'Missing text or targetLang' }, { status: 400 });
    }

    const langName = LANG_MAP[targetLang] ?? targetLang;
    const genAI    = getGemini();
    const model    = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Detect the language of this text and translate it into ${langName}. Output ONLY the translation, nothing else:\n\n${text}`;
    const result = await model.generateContent(prompt);
    const translated = result.response.text().trim();

    return NextResponse.json({ text: translated, targetLang, langName });
  } catch (err: any) {
    console.error('[MONiA Translate]', err);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
