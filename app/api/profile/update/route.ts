import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/nextjs/server';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, username, mobile, city, full_name, email, avatar_url } = body;

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // 1️⃣ Username uniqueness check
    if (username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', userId)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    // 2️⃣ SUPABASE UPSERT (Google login entry ko update karega)
    const { error: dbError } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        username, 
        mobile, 
        city, 
        full_name,
        email,
        avatar_url,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (dbError) throw new Error(dbError.message);

    // 3️⃣ CLERK METADATA UPDATE (Clerk dashboard ke liye)
    try {
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: {
          username,
          mobile,
          city
        }
      });
    } catch (clerkErr: any) {
      console.error("Clerk Metadata Update Error:", clerkErr.message);
      // Not throwing error because the primary goal is to save data in Supabase
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
