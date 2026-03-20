
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      username,
      mobile,
      city,
      full_name,
      email,
      avatar_url,
      hide_phone,
      hide_city,
      hide_full_name,
      sleep_mode_enabled,
      sleep_start,
      sleep_end,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Build the Supabase update payload — only include defined fields
    const supabasePatch: Record<string, any> = { id: userId, updated_at: new Date().toISOString() };

    if (username !== undefined) {
      const cleanUsername = String(username).trim().replace(/^@+/, '');
      // Check username uniqueness
      const { data: existing } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .neq('id', userId)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
      }
      supabasePatch.username = cleanUsername;
    }
    if (mobile      !== undefined) supabasePatch.mobile      = mobile;
    if (city        !== undefined) supabasePatch.city        = city;
    if (full_name   !== undefined) supabasePatch.full_name   = full_name;
    if (email       !== undefined) supabasePatch.email       = email;
    if (avatar_url  !== undefined) supabasePatch.avatar_url  = avatar_url;

    if (hide_phone        !== undefined) supabasePatch.hide_phone        = hide_phone;
    if (hide_city         !== undefined) supabasePatch.hide_city         = hide_city;
    if (hide_full_name    !== undefined) supabasePatch.hide_full_name    = hide_full_name;
    if (sleep_mode_enabled !== undefined) supabasePatch.sleep_mode_enabled = sleep_mode_enabled;
    if (sleep_start       !== undefined) supabasePatch.sleep_start       = sleep_start;
    if (sleep_end         !== undefined) supabasePatch.sleep_end         = sleep_end;

    // Upsert into Supabase profiles
    const { error: supabaseError, data: updatedProfile } = await supabaseAdmin
      .from('profiles')
      .upsert([supabasePatch], { onConflict: 'id' })
      .select('*')
      .single();

    if (supabaseError) {
      console.error('Supabase upsert error:', supabaseError);
      return NextResponse.json({ error: supabaseError.message }, { status: 500 });
    }

    // If username is being set, also update Clerk metadata
    if (username !== undefined || mobile !== undefined || city !== undefined) {
      try {
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            username: supabasePatch.username,
            mobile:   supabasePatch.mobile,
            city:     supabasePatch.city,
            profile_complete: true,
          },
        });
      } catch (clerkErr) {
        console.error('Clerk metadata update error (non-fatal):', clerkErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedProfile 
    });
  } catch (error) {
    console.error('Error in profile update endpoint:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
