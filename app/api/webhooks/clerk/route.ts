import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Supabase Client Server-side ke liye
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to env')
  }

  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 })
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
    return new Response('Error occured', { status: 400 })
  }

  // Jab naya user Signup kare
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0].email_address;

    const { error } = await supabase
      .from('profiles')
      .upsert({ // upsert use kar rahe hain taaki agar user pehle se ho toh update ho jaye
        id: id,
        email: email,
        full_name: `${first_name || ''} ${last_name || ''}`,
        avatar_url: image_url,
        updated_at: new Date(),
      })

    if (error) {
      console.error('Error syncing to Supabase:', error)
      return new Response('Error syncing to Supabase', { status: 500 })
    }
  }

  return new Response('Webhook received', { status: 200 })
}

