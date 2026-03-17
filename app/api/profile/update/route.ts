
import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials are not set in the environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { userId, username, mobile, city } = await request.json();

    if (!userId || !username || !mobile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for username uniqueness
    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', userId)
      .single();

    if (existingProfileError && existingProfileError.code !== 'PGRST116') { // Ignore 'PGRST116' (No rows found)
      console.error('Error checking username uniqueness:', existingProfileError);
      return NextResponse.json({ error: 'Error checking username uniqueness' }, { status: 500 });
    }

    if (existingProfile) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    // Update Clerk user metadata
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        username,
        mobile,
        city,
        profile_complete: true, // Mark profile as complete
      },
    });

    return NextResponse.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Error updating profile' }, { status: 500 });
  }
}
