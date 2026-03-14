import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// ─── JWT generation using the project's custom JWT secret ────────────────────
function base64url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function buildServiceRoleJwt(): string {
  const secret = process.env.SUPABASE_JWT_SECRET
  if (!secret) throw new Error('SUPABASE_JWT_SECRET is not set')

  const header  = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss:  'supabase',
    ref:  'rdyyylgtxwxggbfouley',
    role: 'service_role',
    iat:  1772795551,
    exp:  2088371551,
  }))
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return `${header}.${payload}.${sig}`
}

// ─── Supabase admin client signed with the custom JWT ─────────────────────────
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set')
  const jwt = buildServiceRoleJwt()
  return createClient(url, jwt, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ─── Extract all user fields from Clerk webhook payload ──────────────────────
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
  } = data

  // Primary email
  const primaryEmail =
    email_addresses.find((e: any) => e.id === primary_email_address_id)?.email_address ||
    email_addresses[0]?.email_address ||
    ''

  // Primary phone — from Clerk's phone_numbers array first, then metadata
  const primaryPhone =
    phone_numbers.find((p: any) => p.id === primary_phone_number_id)?.phone_number ||
    phone_numbers[0]?.phone_number ||
    null

  const unsafeMeta = (unsafe_metadata || {}) as Record<string, string>
  const publicMeta = (public_metadata || {}) as Record<string, string>

  // mobile: phone field → unsafe_metadata.mobile → public_metadata.mobile
  const mobile = primaryPhone || unsafeMeta.mobile || publicMeta.mobile || null
  // city: unsafe_metadata.city → public_metadata.city (set during email signup)
  const city   = unsafeMeta.city || publicMeta.city || null

  // Full name: Clerk first/last → Google external account → email prefix
  let fullName = `${first_name || ''} ${last_name || ''}`.trim() || null
  if (!fullName && external_accounts.length > 0) {
    const ext = external_accounts[0]
    fullName =
      `${ext.first_name || ''} ${ext.last_name || ''}`.trim() ||
      ext.username ||
      null
  }
  if (!fullName && primaryEmail) fullName = primaryEmail.split('@')[0]

  // Avatar: Clerk image_url → Google picture
  const avatarUrl = image_url || external_accounts[0]?.picture || null

  // Username: Clerk username → sanitised email prefix
  const finalUsername =
    username ||
    (primaryEmail ? primaryEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') : null)

  return { id, email: primaryEmail, username: finalUsername, full_name: fullName, mobile, city, avatar_url: avatarUrl }
}

// ─── Webhook handler ──────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    console.error('[Webhook] CLERK_WEBHOOK_SECRET is not set')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  // Read raw body first — svix must verify the exact original bytes
  const rawBody = await req.text()

  const headerPayload = await headers()
  const svixId        = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(rawBody, {
      'svix-id':        svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err)
    return new Response('Webhook verification failed', { status: 400 })
  }

  console.log(`[Webhook] Event: ${evt.type}`)

  let supabase: ReturnType<typeof getSupabaseAdmin>
  try {
    supabase = getSupabaseAdmin()
  } catch (err: any) {
    console.error('[Webhook] Supabase init error:', err.message)
    return new Response('Server config error', { status: 500 })
  }

  try {
    // ── user.created ─────────────────────────────────────────────────────────
    if (evt.type === 'user.created') {
      const p = extractProfileData(evt.data as Record<string, any>)
      console.log('[Webhook] Creating profile:', p)

      const { error } = await supabase.rpc('sync_clerk_user', {
        p_id:         p.id,
        p_email:      p.email,
        p_username:   p.username,
        p_full_name:  p.full_name,
        p_mobile:     p.mobile,
        p_city:       p.city,
        p_avatar_url: p.avatar_url,
      })

      if (error) {
        console.error('[Webhook] Error creating profile:', error.message, p)
        return new Response(`Error creating profile: ${error.message}`, { status: 500 })
      }
      console.log('[Webhook] Profile created:', p.id)
    }

    // ── user.updated ─────────────────────────────────────────────────────────
    if (evt.type === 'user.updated') {
      const p = extractProfileData(evt.data as Record<string, any>)
      console.log('[Webhook] Updating profile:', p)

      const { error } = await supabase.rpc('sync_clerk_user', {
        p_id:         p.id,
        p_email:      p.email,
        p_username:   p.username,
        p_full_name:  p.full_name,
        p_mobile:     p.mobile,
        p_city:       p.city,
        p_avatar_url: p.avatar_url,
      })

      if (error) {
        console.error('[Webhook] Error updating profile:', error.message, p)
        return new Response(`Error updating profile: ${error.message}`, { status: 500 })
      }
      console.log('[Webhook] Profile updated:', p.id)
    }

    // ── user.deleted ─────────────────────────────────────────────────────────
    if (evt.type === 'user.deleted') {
      const { id } = evt.data
      if (id) {
        console.log('[Webhook] Deleting profile:', id)

        const { error } = await supabase.rpc('delete_clerk_user', { p_id: id })

        if (error) {
          console.error('[Webhook] Error deleting profile:', error.message)
          // Return 200 so Clerk does not retry on a row that may already be gone
        } else {
          console.log('[Webhook] Profile deleted:', id)
        }
      }
    }
  } catch (err: any) {
    console.error('[Webhook] Unexpected error:', err)
    return new Response(`Internal error: ${err.message}`, { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
