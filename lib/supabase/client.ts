'use client';

import { createBrowserClient } from '@supabase/ssr';

let supabaseClient: any = null;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a no-op stub so the app boots without crashing.
    // Actual Supabase calls will fail gracefully once env vars are missing.
    console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.');
    return { from: () => ({ select: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }), channel: () => ({ on: () => ({ subscribe: () => {} }) }), removeChannel: () => {} } as any;
  }

  supabaseClient = createBrowserClient(url, key);
  return supabaseClient;
}

export const supabase = createClient();
