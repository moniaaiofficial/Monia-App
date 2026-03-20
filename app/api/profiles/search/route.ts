import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') ?? '').trim();

    if (!q) {
      return NextResponse.json({ data: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, username, mobile, city, avatar_url, sleep_mode_enabled, sleep_start, sleep_end')
      .neq('id', userId)
      .or(
        `full_name.ilike.%${q}%,username.ilike.%${q}%,email.ilike.%${q}%,mobile.ilike.%${q}%,city.ilike.%${q}%`,
      )
      .limit(25);

    if (error) {
      console.error('[Profiles Search] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error('[Profiles Search] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
