-- ============================================================
-- MONiA — Complete Schema Setup & Fix
-- Run this entire script in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ── 1. Create helper exec function (used by the /api/db-setup route) ──
CREATE OR REPLACE FUNCTION exec_migration(sql text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN EXECUTE sql; END; $$;
GRANT EXECUTE ON FUNCTION exec_migration(text) TO service_role;

-- ── 2. Profiles table (Clerk user IDs are TEXT, not UUID) ─────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            TEXT PRIMARY KEY,
  full_name     TEXT,
  email         TEXT,
  username      TEXT UNIQUE,
  mobile        TEXT,
  city          TEXT,
  avatar_url    TEXT,
  hide_phone          BOOLEAN DEFAULT FALSE,
  hide_city           BOOLEAN DEFAULT FALSE,
  hide_full_name      BOOLEAN DEFAULT FALSE,
  sleep_mode_enabled  BOOLEAN DEFAULT FALSE,
  sleep_start         TEXT DEFAULT '20:00',
  sleep_end           TEXT DEFAULT '07:00',
  permanent_id        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_profiles" ON profiles;
CREATE POLICY "service_role_full_profiles" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_profiles" ON profiles;
CREATE POLICY "anon_read_profiles" ON profiles FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_profiles" ON profiles;
CREATE POLICY "authenticated_read_profiles" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_own_profile" ON profiles;
CREATE POLICY "authenticated_update_own_profile" ON profiles FOR UPDATE TO authenticated
USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ── 3. Chats table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chats (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participants       TEXT[] NOT NULL,
  last_message       TEXT,
  last_message_time  TIMESTAMPTZ DEFAULT NOW(),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Fix participants column type if it was UUID[]
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chats' AND column_name = 'participants'
    AND udt_name != '_text'
  ) THEN
    ALTER TABLE chats ALTER COLUMN participants TYPE TEXT[] USING participants::TEXT[];
  END IF;
END $$;

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "allow_all_chats" ON chats;
DROP POLICY IF EXISTS "Users can access their own chats" ON chats;
DROP POLICY IF EXISTS "Allow users to view chats they are a part of" ON chats;
DROP POLICY IF EXISTS "Allow full access to service_role" ON chats;
DROP POLICY IF EXISTS "service_role_all_chats" ON chats;
DROP POLICY IF EXISTS "users_view_their_chats" ON chats;
DROP POLICY IF EXISTS "users_insert_chats" ON chats;
DROP POLICY IF EXISTS "users_update_chats" ON chats;

CREATE POLICY "service_role_all_chats" ON chats FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "users_view_their_chats" ON chats FOR SELECT
USING (auth.uid()::text = ANY(participants));

CREATE POLICY "users_insert_chats" ON chats FOR INSERT
WITH CHECK (auth.uid()::text = ANY(participants));

CREATE POLICY "users_update_chats" ON chats FOR UPDATE
USING (auth.uid()::text = ANY(participants));

-- Also allow anon (app uses Clerk auth, not Supabase Auth)
DROP POLICY IF EXISTS "anon_all_chats" ON chats;
CREATE POLICY "anon_all_chats" ON chats FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_chats" ON chats;
CREATE POLICY "authenticated_all_chats" ON chats FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 4. Messages table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id     TEXT NOT NULL,
  sender_id   TEXT NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT DEFAULT 'text',
  status      TEXT CHECK (status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fix column types if they were UUID
DO $$
BEGIN
  -- Fix sender_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'sender_id' AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
    ALTER TABLE messages ALTER COLUMN sender_id TYPE TEXT USING sender_id::TEXT;
  END IF;

  -- Fix chat_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'chat_id' AND udt_name = 'uuid'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;
    ALTER TABLE messages ALTER COLUMN chat_id TYPE TEXT USING chat_id::TEXT;
  END IF;
END $$;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages REPLICA IDENTITY FULL;

DROP POLICY IF EXISTS "allow_all_messages" ON messages;
DROP POLICY IF EXISTS "Users can access messages in their chats" ON messages;
DROP POLICY IF EXISTS "Allow users to view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Allow users to insert messages in their chats" ON messages;
DROP POLICY IF EXISTS "Allow full access to service_role" ON messages;
DROP POLICY IF EXISTS "service_role_all_messages" ON messages;
DROP POLICY IF EXISTS "users_view_messages_in_chats" ON messages;
DROP POLICY IF EXISTS "users_insert_messages" ON messages;

CREATE POLICY "service_role_all_messages" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "users_view_messages_in_chats" ON messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM chats
  WHERE chats.id::text = messages.chat_id
  AND auth.uid()::text = ANY(chats.participants)
));

CREATE POLICY "users_insert_messages" ON messages FOR INSERT
WITH CHECK (auth.uid()::text = sender_id);

-- Also allow anon (app uses Clerk auth, not Supabase Auth)
DROP POLICY IF EXISTS "anon_all_messages" ON messages;
CREATE POLICY "anon_all_messages" ON messages FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_messages" ON messages;
CREATE POLICY "authenticated_all_messages" ON messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 5. Media files table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS media_files (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      TEXT NOT NULL,
  file_path    TEXT NOT NULL,
  file_type    TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'voice_note')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  media_expiry TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
  is_deleted   BOOLEAN DEFAULT FALSE
);

ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_media" ON media_files;
CREATE POLICY "service_role_full_media" ON media_files FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_own_media" ON media_files;
CREATE POLICY "users_own_media" ON media_files FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 6. Performance indexes ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_time ON chats(last_message_time DESC);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_media_expiry ON media_files(media_expiry) WHERE is_deleted = FALSE;

-- ── 7. Storage bucket ─────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat-media', 'chat-media', TRUE, 2147483648)
ON CONFLICT (id) DO UPDATE SET public = TRUE, file_size_limit = 2147483648;

DROP POLICY IF EXISTS "service_role_storage_all" ON storage.objects;
CREATE POLICY "service_role_storage_all" ON storage.objects
FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_chat_media" ON storage.objects;
CREATE POLICY "public_read_chat_media" ON storage.objects
FOR SELECT TO anon, authenticated USING (bucket_id = 'chat-media');

DROP POLICY IF EXISTS "authenticated_upload_chat_media" ON storage.objects;
CREATE POLICY "authenticated_upload_chat_media" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-media');

-- ── Done ──────────────────────────────────────────────────────────────
SELECT 'MONiA schema setup complete ✅' AS status;
