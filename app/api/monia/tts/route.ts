import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const GOOGLE_TTS_API_KEY = process.env.GOOGLE_TTS_API_KEY;

  if (!GOOGLE_TTS_API_KEY) {
    return NextResponse.json(
      { error: 'HD voice not available' },
      { status: 503 },
    );
  }

  try {
    const { text, lang = 'en-IN' } = await req.json();
    if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          input:       { text },
          voice:       { languageCode: lang, ssmlGender: 'FEMALE' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 0.95, pitch: 2.0 },
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('[TTS]', err);
      return NextResponse.json({ error: 'TTS request failed' }, { status: 500 });
    }

    const { audioContent } = await res.json();
    return NextResponse.json({ audioBase64: audioContent });
  } catch (err: any) {
    console.error('[TTS]', err);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
