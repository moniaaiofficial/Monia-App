import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

function getGemini() {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error('AI key not configured');
  return new GoogleGenerativeAI(key);
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
    }

    const genAI   = getGemini();
    const model   = getGemini().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const context = (messages as string[]).slice(-5).join('\n');

    const prompt =
      `You are MONiA, an AI communication assistant. ` +
      `Analyze this conversation and provide 2-3 short, context-aware suggested replies the user could send. ` +
      `Format as a numbered list. Keep each suggestion under 15 words. ` +
      `Be natural and conversational:\n\n${context}`;

    const result = await model.generateContent(prompt);
    const text   = result.response.text().trim();

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error('[MONiA Analyze]', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
