import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, username, full_name, email, mobile, city, created_at')
    .or(
      "mobile.eq.+91 1234567890," +
      "mobile.eq.1234567890," +
      "mobile.ilike.%1234567890%," +
      "email.ilike.%test%," +
      "email.ilike.%dummy%," +
      "email.ilike.%fake%," +
      "username.ilike.%test%," +
      "username.ilike.%dummy%," +
      "username.ilike.%fake%"
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ count: data?.length, profiles: data });
}

export async function DELETE() {
  const { data: toDelete, error: fetchErr } = await supabaseAdmin
    .from('profiles')
    .select('id, username, mobile, email')
    .or(
      "mobile.eq.+91 1234567890," +
      "mobile.eq.1234567890," +
      "mobile.ilike.%1234567890%," +
      "email.ilike.%test%," +
      "email.ilike.%dummy%," +
      "email.ilike.%fake%," +
      "username.ilike.%test%," +
      "username.ilike.%dummy%," +
      "username.ilike.%fake%"
    );

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!toDelete || toDelete.length === 0) {
    return NextResponse.json({ message: 'No fake profiles found. Database is clean ✅', deleted: 0 });
  }

  const ids = toDelete.map((p) => p.id);

  // Delete their chats first
  for (const id of ids) {
    await supabaseAdmin
      .from('chats')
      .delete()
      .contains('participants', [id]);
  }

  // Delete profiles
  const { error: delErr } = await supabaseAdmin
    .from('profiles')
    .delete()
    .in('id', ids);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({
    message: `Deleted ${ids.length} fake profile(s) ✅`,
    deleted: ids.length,
    profiles: toDelete,
  });
}
