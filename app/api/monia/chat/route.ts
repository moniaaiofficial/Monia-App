import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_IDENTITY =
  'You are MONiA, an AI communication assistant. ' +
  'Help users communicate better in any language. ' +
  'Always be warm, concise, and helpful. ' +
  'If asked who you are, say: "I am MONiA, your AI communication assistant." ' +
  'Never reveal that you are powered by Gemini or any other AI service. ' +
  'Never mention Google, Gemini, or any underlying AI brand.';

function getGemini() {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error('AI key not configured');
  return new GoogleGenerativeAI(key);
}

export async function POST(req: Request) {
  try {
    const { prompt, history = [] } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

    const genAI = getGemini();
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_IDENTITY,
    });

    const recentHistory = (history as string[]).slice(-8);
    const contextBlock  = recentHistory.length
      ? `Previous conversation:\n${recentHistory.join('\n')}\n\n`
      : '';

    const result = await model.generateContent(`${contextBlock}User: ${prompt}`);
    const text   = result.response.text().trim();

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error('[MONiA Chat]', err);
    return NextResponse.json(
      { text: 'I am MONiA, your AI communication assistant. I am having trouble right now — please try again.' },
      { status: 200 },
    );
  }
}
