export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const results: Record<string, any> = {};

  try {
    const { count: profileCount, error: pe } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    results.profiles = pe ? { error: pe.message } : { count: profileCount };

    const { data: sampleProfiles, error: spe } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, email, mobile, city, avatar_url, hide_phone, hide_city, sleep_mode_enabled')
      .limit(5);
    results.sampleProfiles = spe ? { error: spe.message } : sampleProfiles;

    const { count: chatCount, error: ce } = await supabaseAdmin
      .from('chats')
      .select('*', { count: 'exact', head: true });
    results.chats = ce ? { error: ce.message } : { count: chatCount };

    const { count: msgCount, error: me } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true });
    results.messages = me ? { error: me.message } : { count: msgCount };

    const { data: recentMessages, error: rme } = await supabaseAdmin
      .from('messages')
      .select('id, chat_id, sender_id, content, type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    results.recentMessages = rme ? { error: rme.message } : recentMessages;

    const { data: recentChats, error: rce } = await supabaseAdmin
      .from('chats')
      .select('id, participants, last_message, last_message_time')
      .order('last_message_time', { ascending: false })
      .limit(5);
    results.recentChats = rce ? { error: rce.message } : recentChats;

    results.env = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      clerkSecretKey: process.env.CLERK_SECRET_KEY ? 'SET' : 'MISSING',
    };

    results.timestamp = new Date().toISOString();
    results.status = 'ok';

    return NextResponse.json(results, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 });
  }
}
