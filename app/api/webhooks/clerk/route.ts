import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Supabase Client with Service Role Key (server-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET not set')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Webhook verification failed', { status: 400 })
  }

  // Handle user.created event
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url, username, unsafe_metadata, public_metadata } = evt.data;
    const email = email_addresses?.[0]?.email_address || '';
    
    // Get mobile and city from unsafe_metadata or public_metadata (set during signup)
    const unsafeMeta = unsafe_metadata as Record<string, string> | undefined;
    const publicMeta = public_metadata as Record<string, string> | undefined;
    const mobile = unsafeMeta?.mobile || publicMeta?.mobile || null;
    const city = unsafeMeta?.city || publicMeta?.city || null;
    const fullName = `${first_name || ''} ${last_name || ''}`.trim() || null;

    // Log the data being inserted for debugging
    console.log('Creating profile with data:', {
      id,
      email,
      username,
      full_name: fullName,
      mobile,
      city,
      avatar_url: image_url,
      unsafeMeta,
      publicMeta
    });

    const profileData = {
      id: id,
      email: email,
      username: username || null,
      full_name: fullName,
      mobile: mobile,
      city: city,
      avatar_url: image_url || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id'
      })
      .select();

    if (error) {
      console.error('Error creating profile in Supabase:', error);
      console.error('Profile data that failed:', profileData);
      return new Response(`Error creating profile: ${error.message}`, { status: 500 })
    }

    console.log('Profile created successfully for user:', id, data)
  }

  // Handle user.updated event
  if (evt.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, username, unsafe_metadata, public_metadata } = evt.data;
    const email = email_addresses?.[0]?.email_address || '';
    
    const unsafeMeta = unsafe_metadata as Record<string, string> | undefined;
    const publicMeta = public_metadata as Record<string, string> | undefined;
    const mobile = unsafeMeta?.mobile || publicMeta?.mobile || null;
    const city = unsafeMeta?.city || publicMeta?.city || null;

    const { error } = await supabase
      .from('profiles')
      .update({
        email: email,
        username: username || null,
        full_name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        mobile: mobile,
        city: city,
        avatar_url: image_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating profile in Supabase:', error)
      return new Response('Error updating profile', { status: 500 })
    }

    console.log('Profile updated for user:', id)
  }

  // Handle user.deleted event
  if (evt.type === 'user.deleted') {
    const { id } = evt.data;

    if (id) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting profile from Supabase:', error)
        return new Response('Error deleting profile', { status: 500 })
      }

      console.log('Profile deleted for user:', id)
    }
  }

  return new Response('Webhook processed successfully', { status: 200 })
}

