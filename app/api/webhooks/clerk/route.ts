import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Supabase credentials not set');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function extractProfileData(data: Record<string, any>) {
  const { id, public_metadata, primary_email_address_id, email_addresses, first_name, last_name, image_url, username: clerkUsername } = data;

  const email = email_addresses.find((e: any) => e.id === primary_email_address_id)?.email_address || email_addresses[0]?.email_address || '';
  const fullName = `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0];
  const username = public_metadata?.username || clerkUsername || '';

  return {
    id,
    email,
    username,
    full_name: fullName,
    mobile: public_metadata?.mobile || null,
    city: public_metadata?.city || null,
    avatar_url: image_url || null,
  };
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('[Webhook] CLERK_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const rawBody = await req.text();
  const headerPayload = headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return new Response('Webhook verification failed', { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    const p = extractProfileData(evt.data as Record<string, any>);

    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const { error } = await supabase.rpc('sync_clerk_user', {
        p_id: p.id,
        p_email: p.email,
        p_username: p.username,
        p_full_name: p.full_name,
        p_mobile: p.mobile,
        p_city: p.city,
        p_avatar_url: p.avatar_url,
      });

      if (error) {
        console.error(`[Webhook] Error syncing user ${p.id}:`, error.message);
        return new Response(`Error syncing user: ${error.message}`, { status: 500 });
      }
    } else if (evt.type === 'user.deleted') {
      if (evt.data.id) {
        const { error } = await supabase.rpc('delete_clerk_user', { p_id: evt.data.id });
        if (error) {
          console.error(`[Webhook] Error deleting user ${evt.data.id}:`, error.message);
          // Don't retry deletion if the user is already gone
        }
      }
    }
  } catch (err: any) {
    console.error('[Webhook] Unexpected error:', err);
    return new Response(`Internal error: ${err.message}`, { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
