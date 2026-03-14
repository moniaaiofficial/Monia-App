import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';

function extractProfileData(data: Record<string, any>) {
  const {
    id,
    email_addresses        = [],
    phone_numbers          = [],
    first_name,
    last_name,
    image_url,
    username,
    primary_email_address_id,
    primary_phone_number_id,
    external_accounts      = [],
    unsafe_metadata        = {},
    public_metadata        = {},
  } = data;

  const primaryEmail =
    email_addresses.find((e: any) => e.id === primary_email_address_id)?.email_address ||
    email_addresses[0]?.email_address ||
    '';

  const primaryPhone =
    phone_numbers.find((p: any) => p.id === primary_phone_number_id)?.phone_number ||
    phone_numbers[0]?.phone_number ||
    null;

  const unsafeMeta = (unsafe_metadata || {}) as Record<string, string>;
  const publicMeta = (public_metadata || {}) as Record<string, string>;

  const mobile = primaryPhone || unsafeMeta.mobile || publicMeta.mobile || null;
  const city   = unsafeMeta.city || publicMeta.city || null;

  let fullName = `${first_name || ''} ${last_name || ''}`.trim() || null;
  if (!fullName && external_accounts.length > 0) {
    const ext = external_accounts[0];
    fullName =
      `${ext.first_name || ''} ${ext.last_name || ''}`.trim() ||
      ext.username ||
      null;
  }
  if (!fullName && primaryEmail) fullName = primaryEmail.split('@')[0];

  const avatarUrl = image_url || external_accounts[0]?.picture || null;

  const finalUsername =
    username ||
    (primaryEmail ? primaryEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') : null);

  return { id, email: primaryEmail, username: finalUsername, full_name: fullName, mobile, city, avatar_url: avatarUrl };
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('[Webhook] CLERK_WEBHOOK_SECRET is not set');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  const rawBody = await req.text();

  const headerPayload = await headers();
  const svixId        = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(rawBody, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err);
    return new Response('Webhook verification failed', { status: 400 });
  }

  console.log(`[Webhook] Event: ${evt.type}`);

  let db: ReturnType<typeof getDb>;
  try {
    db = getDb();
  } catch (err: any) {
    console.error('[Webhook] DB init error:', err.message);
    return new Response('Server config error', { status: 500 });
  }

  try {
    if (evt.type === 'user.created' || evt.type === 'user.updated') {
      const p = extractProfileData(evt.data as Record<string, any>);
      console.log(`[Webhook] Upserting profile:`, p.id);

      await db.query(
        `INSERT INTO profiles (id, email, username, full_name, mobile, city, avatar_url, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, now())
         ON CONFLICT (id) DO UPDATE SET
           email       = EXCLUDED.email,
           username    = EXCLUDED.username,
           full_name   = EXCLUDED.full_name,
           mobile      = EXCLUDED.mobile,
           city        = EXCLUDED.city,
           avatar_url  = EXCLUDED.avatar_url,
           updated_at  = now()`,
        [p.id, p.email, p.username, p.full_name, p.mobile, p.city, p.avatar_url]
      );

      console.log('[Webhook] Profile upserted:', p.id);
    }

    if (evt.type === 'user.deleted') {
      const { id } = evt.data;
      if (id) {
        console.log('[Webhook] Deleting profile:', id);
        await db.query('DELETE FROM profiles WHERE id = $1', [id]);
        console.log('[Webhook] Profile deleted:', id);
      }
    }
  } catch (err: any) {
    console.error('[Webhook] Unexpected error:', err);
    return new Response(`Internal error: ${err.message}`, { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
