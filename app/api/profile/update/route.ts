import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/nextjs/server';
import crypto from 'crypto';

function base64url(input: string) {
  return Buffer.from(input).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}

function buildServiceRoleJwt(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) throw new Error('SUPABASE_JWT_SECRET not set');
  const header  = base64url(JSON.stringify({ alg:'HS256', typ:'JWT' }));
  const payload = base64url(JSON.stringify({ 
    iss:'supabase', 
    ref:'rdyyylgtxwxggbfouley', 
    role:'service_role', 
    iat: Math.floor(Date.now() / 1000), 
    exp: Math.floor(Date.now() / 1000) + 3600 
  }));
  const sig = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  return `${header}.${payload}.${sig}`;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return createClient(url, buildServiceRoleJwt(), { auth: { autoRefreshToken: false, persistSession: false } });
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
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        username,
        mobile,
        city
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
