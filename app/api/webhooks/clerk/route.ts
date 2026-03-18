
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase credentials are not set in the environment variables');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('[Webhook] CLERK_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const headersList = await headers();
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
    const { id, email_addresses, first_name, last_name, image_url, public_metadata } = evt.data;
    const userEmail = email_addresses[0]?.email_address;

    if (!id || !userEmail) {
      return new Response('Missing user ID or email', { status: 400 });
    }

    const { error } = await supabaseAdmin.from('profiles').upsert([
      {
        id: id,
        email: userEmail,
        full_name: `${first_name || ''} ${last_name || ''}`.trim(),
        avatar_url: image_url,
      },
    ]);

    if (error) {
      console.error(`[Webhook] Error upserting user ${id}:`, error);
      return new Response(`Error upserting user: ${error.message}`, { status: 500 });
    }

    console.log(`[Webhook] Successfully upserted user ${id}`);
  } else if (evt.type === 'user.deleted') {
    const { id } = evt.data;
    if (!id) {
      return new Response('Missing user ID', { status: 400 });
    }

    const { error } = await supabaseAdmin.from('profiles').delete().eq('id', id);

    if (error) {
      console.error(`[Webhook] Error deleting user ${id}:`, error);
      return new Response(`Error deleting user: ${error.message}`, { status: 500 });
    }

    console.log(`[Webhook] Successfully deleted user ${id}`);
  }

  return new Response('Webhook processed successfully', { status: 200 });
}
