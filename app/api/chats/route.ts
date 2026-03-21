import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function applyPrivacyMask(profile: any, viewerId: string) {
  if (!profile || profile.id === viewerId) return profile;
  return {
    ...profile,
    full_name: profile.hide_full_name ? null : profile.full_name,
    mobile:    profile.hide_phone     ? null : profile.mobile,
    city:      profile.hide_city      ? null : profile.city,
  };
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: chats, error } = await supabaseAdmin
      .from('chats')
      .select('*')
      .contains('participants', [userId])
      .order('last_message_time', { ascending: false });

    if (error) {
      console.error('[Chats GET] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!chats || chats.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const partnerIds = [
      ...new Set(
        chats.flatMap((c: any) =>
          (c.participants as string[]).filter((id: string) => id !== userId),
        ),
      ),
    ];

    let profileMap: Record<string, any> = {};
    if (partnerIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, username, mobile, city, avatar_url, sleep_mode_enabled, sleep_start, sleep_end, hide_phone, hide_city, hide_full_name')
        .in('id', partnerIds);
      profileMap = Object.fromEntries(
        (profiles ?? []).map((p: any) => [p.id, applyPrivacyMask(p, userId)]),
      );
    }

    const enriched = chats.map((chat: any) => {
      const partnerId = (chat.participants as string[]).find((id) => id !== userId);
      return { ...chat, partner: partnerId ? (profileMap[partnerId] ?? null) : null };
    });

    return NextResponse.json({ data: enriched });
  } catch (err) {
    console.error('[Chats GET] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partnerId } = await request.json();
    if (!partnerId) {
      return NextResponse.json({ error: 'Missing partnerId' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('chats')
      .select('*')
      .contains('participants', [userId])
      .contains('participants', [partnerId]);

    const match = (existing ?? []).find(
      (c: any) => (c.participants as string[]).length === 2,
    );
    if (match) return NextResponse.json({ data: match });

    const { data: created, error } = await supabaseAdmin
      .from('chats')
      .insert({ participants: [userId, partnerId] })
      .select()
      .single();

    if (error) {
      console.error('[Chats POST] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: created });
  } catch (err) {
    console.error('[Chats POST] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
