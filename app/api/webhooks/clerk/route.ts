import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars not configured')
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function extractProfileData(data: Record<string, any>) {
  const {
    id,
    email_addresses = [],
    phone_numbers = [],
    first_name,
    last_name,
    image_url,
    username,
    primary_email_address_id,
    primary_phone_number_id,
    external_accounts = [],
    unsafe_metadata = {},
    public_metadata = {},
  } = data

  // Prefer primary email, fallback to first in list
  const primaryEmail =
    email_addresses.find((e: any) => e.id === primary_email_address_id)?.email_address ||
    email_addresses[0]?.email_address ||
    ''

  // Prefer primary phone, fallback to first in list, then metadata
  const primaryPhone =
    phone_numbers.find((p: any) => p.id === primary_phone_number_id)?.phone_number ||
    phone_numbers[0]?.phone_number ||
    null

  const unsafeMeta = (unsafe_metadata || {}) as Record<string, string>
  const publicMeta = (public_metadata || {}) as Record<string, string>

  const mobile = primaryPhone || unsafeMeta.mobile || publicMeta.mobile || null
  const city = unsafeMeta.city || publicMeta.city || null

  // Build full name: Clerk first/last preferred; fallback to Google external account
  let fullName = `${first_name || ''} ${last_name || ''}`.trim() || null
  if (!fullName && external_accounts.length > 0) {
    const ext = external_accounts[0]
    fullName =
      `${ext.first_name || ''} ${ext.last_name || ''}`.trim() ||
      ext.username ||
      null
  }
  if (!fullName && primaryEmail) {
    fullName = primaryEmail.split('@')[0]
  }

  // Avatar: Clerk image_url, then Google picture
  const avatarUrl = image_url || external_accounts[0]?.picture || null

  // Username: Clerk username or sanitised email prefix
  const finalUsername =
    username ||
    (primaryEmail
      ? primaryEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_')
      : null)

  return {
    id,
    email: primaryEmail,
    username: finalUsername,
    full_name: fullName,
    mobile,
    city,
    avatar_url: avatarUrl,
  }
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('[Webhook] CLERK_WEBHOOK_SECRET is not set')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  // Read the raw body BEFORE parsing — svix verifies the exact original bytes.
  // Doing req.json() + JSON.stringify() would corrupt the signature check.
  const rawBody = await req.text()

  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err)
    return new Response('Webhook verification failed', { status: 400 })
  }

  console.log(`[Webhook] Event received: ${evt.type}`)

  let supabase: ReturnType<typeof getSupabaseAdmin>
  try {
    supabase = getSupabaseAdmin()
  } catch (err: any) {
    console.error('[Webhook] Failed to init Supabase:', err.message)
    return new Response('Server config error', { status: 500 })
  }

  try {
    if (evt.type === 'user.created') {
      const profile = extractProfileData(evt.data as Record<string, any>)
      console.log('[Webhook] Creating profile:', profile)

      const { error } = await supabase.from('profiles').upsert(
        { ...profile, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )

      if (error) {
        console.error('[Webhook] Error creating profile:', error.message, profile)
        return new Response(`Error creating profile: ${error.message}`, { status: 500 })
      }

      console.log('[Webhook] Profile created:', profile.id)
    }

    if (evt.type === 'user.updated') {
      const profile = extractProfileData(evt.data as Record<string, any>)
      console.log('[Webhook] Updating profile:', profile)

      const { error } = await supabase.from('profiles').upsert(
        { ...profile, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )

      if (error) {
        console.error('[Webhook] Error updating profile:', error.message)
        return new Response(`Error updating profile: ${error.message}`, { status: 500 })
      }

      console.log('[Webhook] Profile updated:', profile.id)
    }

    if (evt.type === 'user.deleted') {
      const { id } = evt.data
      if (id) {
        const { error } = await supabase.from('profiles').delete().eq('id', id)
        if (error) {
          console.error('[Webhook] Error deleting profile:', error.message)
          return new Response(`Error deleting profile: ${error.message}`, { status: 500 })
        }
        console.log('[Webhook] Profile deleted:', id)
      }
    }
  } catch (err: any) {
    console.error('[Webhook] Unexpected error:', err)
    return new Response(`Internal error: ${err.message}`, { status: 500 })
  }

  return new Response('OK', { status: 200 })
}
