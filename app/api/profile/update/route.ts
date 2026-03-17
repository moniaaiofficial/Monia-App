import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

// This is a separate admin client for the uniqueness check.
// The primary database write should happen via the webhook.
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, username, mobile, city } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1️⃣ Username uniqueness check (this is a good practice to keep)
    if (username) {
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', userId)
        .maybeSingle();

      if (checkError) {
        console.error("Username check error:", checkError.message);
        throw new Error(`Supabase error: ${checkError.message}`);
      }

      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
      }
    }

    // 2️⃣ CLERK METADATA UPDATE
    // This is the single source of truth. The webhook will handle the rest.
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        username,
        mobile,
        city,
      }
    });

    // The Supabase update is now handled by the 'user.updated' webhook.
    // We no longer write to Supabase directly from here.

    return NextResponse.json({ success: true, message: "Clerk metadata updated. Webhook will sync to Supabase." });

  } catch (err: any) {
    console.error("API Error in /api/profile/update:", err.message);
    // Return a more specific error message if available
    const errorMessage = err.errors?.[0]?.message || err.message || 'An unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
