import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function generateUsernameFromEmail(email: string): string {
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '_');
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('[Webhook] CLERK_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const headersList = await headers();
  const svix_id        = headersList.get('svix-id');
  const svix_timestamp = headersList.get('svix-timestamp');
  const svix_signature = headersList.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  let body: string;
  try {
    body = await req.text();
  } catch {
    return new Response('Failed to read request body', { status: 400 });
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id':        svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return new Response('Invalid webhook signature', { status: 400 });
  }

  // ── user.created / user.updated ────────────────────────────────────
  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      public_metadata,
      username: clerkUsername,
    } = evt.data;

    const userEmail  = email_addresses?.[0]?.email_address ?? '';
    const fullName   = `${first_name ?? ''} ${last_name ?? ''}`.trim();
    const publicMeta = (public_metadata as Record<string, any>) ?? {};
    const unsafeMeta = (evt.data as any)?.unsafe_metadata as Record<string, any> ?? {};

    // Merge metadata from both sources (priority: public_metadata → unsafe_metadata)
    const meta = { ...unsafeMeta, ...publicMeta };

    // Resolve username (priority: clerk username → public_metadata → unsafe metadata → email-derived)
    const username =
      (clerkUsername as string | null) ||
      (publicMeta.username as string | null) ||
      (unsafeMeta.username as string | null) ||
      generateUsernameFromEmail(userEmail);

    console.log(`[Webhook] Processing ${evt.type} for user ${id}:`, {
      email: userEmail,
      fullName,
      username,
      imageUrl: image_url,
      mobile: meta.mobile,
      city: meta.city,
      publicMetadata: publicMeta,
      unsafeMetadata: unsafeMeta,
    });

    // Ensure mobile and city are strings or null
    const mobile = meta.mobile ? String(meta.mobile).trim() || null : null;
    const city = meta.city ? String(meta.city).trim() || null : null;

    const row: Record<string, any> = {
      id,
      email:      userEmail,
      full_name:  fullName || null,
      username,
      avatar_url: image_url || null,
      mobile,
      city,
      updated_at: new Date().toISOString(),
    };

    // Set defaults only on CREATE (don't overwrite existing values on update)
    if (evt.type === 'user.created') {
      row.hide_phone        = meta.hide_phone ?? false;
      row.hide_city         = meta.hide_city ?? false;
      row.hide_full_name    = meta.hide_full_name ?? false;
      row.sleep_mode_enabled = meta.sleep_mode_enabled ?? false;
      row.sleep_start       = meta.sleep_start ?? '20:00';
      row.sleep_end         = meta.sleep_end ?? '07:00';
      row.created_at        = new Date().toISOString();
      console.log(`[Webhook] Creating new profile with defaults`);
    } else {
      // On update, preserve existing toggle values if not provided in metadata
      console.log(`[Webhook] Updating existing profile`);
    }

    console.log(`[Webhook] Upserting profile row:`, row);

    const { error, data } = await supabaseAdmin
      .from('profiles')
      .upsert([row], { onConflict: 'id' })
      .select();

    if (error) {
      console.error(`[Webhook] Error upserting user ${id}:`, error);
      console.error(`[Webhook] Full error details:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return new Response(`DB error: ${error.message}`, { status: 500 });
    }

    console.log(`[Webhook] ✅ ${evt.type} — Successfully upserted user ${id} to Supabase`);
    console.log(`[Webhook] Profile data stored:`, {
      id,
      email: userEmail,
      full_name: fullName,
      username,
      avatar_url: image_url,
      mobile,
      city,
      data_received: data,
    });
  }

  // ── user.deleted ────────────────────────────────────────────────────
  else if (evt.type === 'user.deleted') {
    const { id } = evt.data;
    if (!id) return new Response('Missing user id', { status: 400 });

    const { error } = await supabaseAdmin.from('profiles').delete().eq('id', id);
    if (error) {
      console.error(`[Webhook] Error deleting user ${id}:`, error);
      return new Response(`DB error: ${error.message}`, { status: 500 });
    }
    console.log(`[Webhook] ✅ Deleted user ${id}`);
  }

  return new Response('OK', { status: 200 });
}
