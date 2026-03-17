
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials are not set in the environment variables');
}

// Initialize Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('[Webhook] CLERK_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const headersList = headers();
  const svix_id = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', { status: 400 });
  }

  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const { id: userId, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data;
    const userEmail = email_addresses[0]?.email_address;
    const userFullName = `${first_name || ''} ${last_name || ''}`.trim();

    if (!userId || !userEmail) {
      return new Response('Missing user ID or email', { status: 400 });
    }

    const { error } = await supabaseAdmin.rpc('sync_user_profile', {
      user_id: userId,
      user_email: userEmail,
      user_full_name: userFullName,
      user_avatar_url: image_url,
      user_raw_metadata: public_metadata,
    });

    if (error) {
      console.error(`[Webhook] Error syncing user ${userId}:`, error);
      return new Response(`Error syncing user: ${error.message}`, { status: 500 });
    }

    console.log(`[Webhook] Successfully synced user ${userId}`);
  } else if (evt.type === 'user.deleted') {
    const { id: userId } = evt.data;
    if (!userId) {
      return new Response('Missing user ID', { status: 400 });
    }
    
    const { error } = await supabaseAdmin.from('profiles').delete().eq('id', userId);

    if (error) {
      console.error(`[Webhook] Error deleting user ${userId}:`, error);
      return new Response(`Error deleting user: ${error.message}`, { status: 500 });
    }

    console.log(`[Webhook] Successfully deleted user ${userId}`);
  }

  return new Response('Webhook processed successfully', { status: 200 });
}
