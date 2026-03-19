import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function runSQL(sql: string): Promise<{ success: boolean; error?: string }> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_migration`;

  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_migration`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err };
  }
  return { success: true };
}

export async function POST() {
  const results: Record<string, any> = {};

  const steps = [
    {
      name: 'create_exec_fn',
      sql: `
        CREATE OR REPLACE FUNCTION exec_migration(sql text)
        RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
        BEGIN EXECUTE sql; END; $$;
        GRANT EXECUTE ON FUNCTION exec_migration(text) TO service_role;
      `,
    },
  ];

  for (const step of steps) {
    const r = await runSQL(step.sql);
    results[step.name] = r;
  }

  const migrations = [
    {
      name: 'alter_chats_participants_to_text_array',
      sql: `ALTER TABLE chats ALTER COLUMN participants TYPE text[] USING participants::text[];`,
    },
    {
      name: 'alter_messages_sender_id_to_text',
      sql: `ALTER TABLE messages ALTER COLUMN sender_id TYPE text USING sender_id::text;`,
    },
    {
      name: 'alter_messages_chat_id_to_text',
      sql: `ALTER TABLE messages ALTER COLUMN chat_id TYPE text USING chat_id::text;`,
    },
    {
      name: 'drop_messages_chat_id_fk',
      sql: `ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;`,
    },
    {
      name: 'drop_old_rls_chats',
      sql: `
        DROP POLICY IF EXISTS "allow_all_chats" ON chats;
        DROP POLICY IF EXISTS "Users can access their own chats" ON chats;
        DROP POLICY IF EXISTS "Allow users to view chats they are a part of" ON chats;
        DROP POLICY IF EXISTS "Allow full access to service_role" ON chats;
      `,
    },
    {
      name: 'drop_old_rls_messages',
      sql: `
        DROP POLICY IF EXISTS "allow_all_messages" ON messages;
        DROP POLICY IF EXISTS "Users can access messages in their chats" ON messages;
        DROP POLICY IF EXISTS "Allow users to view messages in their chats" ON messages;
        DROP POLICY IF EXISTS "Allow users to insert messages in their chats" ON messages;
        DROP POLICY IF EXISTS "Allow full access to service_role" ON messages;
      `,
    },
    {
      name: 'rls_chats_service_role',
      sql: `
        CREATE POLICY "service_role_all_chats" ON chats FOR ALL TO service_role USING (true) WITH CHECK (true);
      `,
    },
    {
      name: 'rls_chats_select',
      sql: `
        CREATE POLICY "users_view_their_chats" ON chats FOR SELECT
        USING (auth.uid()::text = ANY(participants));
      `,
    },
    {
      name: 'rls_chats_insert',
      sql: `
        CREATE POLICY "users_insert_chats" ON chats FOR INSERT
        WITH CHECK (auth.uid()::text = ANY(participants));
      `,
    },
    {
      name: 'rls_chats_update',
      sql: `
        CREATE POLICY "users_update_chats" ON chats FOR UPDATE
        USING (auth.uid()::text = ANY(participants));
      `,
    },
    {
      name: 'rls_messages_service_role',
      sql: `
        CREATE POLICY "service_role_all_messages" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);
      `,
    },
    {
      name: 'rls_messages_select',
      sql: `
        CREATE POLICY "users_view_messages_in_chats" ON messages FOR SELECT
        USING (EXISTS (
          SELECT 1 FROM chats WHERE chats.id::text = messages.chat_id AND auth.uid()::text = ANY(chats.participants)
        ));
      `,
    },
    {
      name: 'rls_messages_insert',
      sql: `
        CREATE POLICY "users_insert_messages" ON messages FOR INSERT
        WITH CHECK (auth.uid()::text = sender_id);
      `,
    },
    {
      name: 'enable_realtime_chats',
      sql: `ALTER TABLE chats REPLICA IDENTITY FULL;`,
    },
    {
      name: 'enable_realtime_messages',
      sql: `ALTER TABLE messages REPLICA IDENTITY FULL;`,
    },
    {
      name: 'create_chat_media_bucket',
      sql: `
        INSERT INTO storage.buckets (id, name, public, file_size_limit)
        VALUES ('chat-media', 'chat-media', true, 2147483648)
        ON CONFLICT (id) DO NOTHING;
      `,
    },
    {
      name: 'storage_rls_service_role',
      sql: `
        DROP POLICY IF EXISTS "service_role_storage_all" ON storage.objects;
        CREATE POLICY "service_role_storage_all" ON storage.objects FOR ALL TO service_role USING (true) WITH CHECK (true);
      `,
    },
    {
      name: 'storage_rls_public_read',
      sql: `
        DROP POLICY IF EXISTS "public_read_chat_media" ON storage.objects;
        CREATE POLICY "public_read_chat_media" ON storage.objects FOR SELECT TO anon, authenticated
        USING (bucket_id = 'chat-media');
      `,
    },
  ];

  for (const step of migrations) {
    const r = await runSQL(step.sql);
    results[step.name] = r;
  }

  const allOk = Object.values(results).every((r: any) => r.success);
  return NextResponse.json({ allOk, results });
}
