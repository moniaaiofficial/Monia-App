-- MONiA Database Fix
-- Run this in Supabase Dashboard → SQL Editor
-- This adds missing columns and fixes RLS policies

-- ============================================================
-- FIX 1: Add missing privacy/sleep mode columns to profiles
-- ============================================================
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS hide_phone BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS hide_city BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS hide_full_name BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS sleep_mode_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS sleep_start TEXT DEFAULT '20:00';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS sleep_end TEXT DEFAULT '07:00';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS permanent_id TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on permanent_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_profiles_permanent_id ON profiles(permanent_id);

-- ============================================================
-- FIX 2: Ensure chats table exists with correct schema
-- ============================================================
CREATE TABLE IF NOT EXISTS chats (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participants       TEXT[] NOT NULL,
  last_message       TEXT,
  last_message_time  TIMESTAMPTZ DEFAULT NOW(),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Convert participants column type to TEXT[] if needed
ALTER TABLE chats ALTER COLUMN participants TYPE TEXT[] USING ARRAY(participants::text[]) WHERE participants IS NOT NULL;

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats REPLICA IDENTITY FULL;

-- ============================================================
-- FIX 3: Ensure messages table exists with correct schema
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id     TEXT NOT NULL,
  sender_id   TEXT NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT DEFAULT 'text',
  status      TEXT CHECK (status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_time ON chats(last_message_time DESC);

-- ============================================================
-- FIX 4: Fix RLS Policies - Allow service_role and anon access
-- ============================================================

-- PROFILES POLICIES
DROP POLICY IF EXISTS "service_role_full_profiles" ON profiles;
CREATE POLICY "service_role_full_profiles" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_read_profiles" ON profiles;
CREATE POLICY "anon_read_profiles" ON profiles FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_profiles" ON profiles;
CREATE POLICY "authenticated_read_profiles" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_update_own_profile" ON profiles;
CREATE POLICY "authenticated_update_own_profile" ON profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- CHATS POLICIES
DROP POLICY IF EXISTS "service_role_all_chats" ON chats;
CREATE POLICY "service_role_all_chats" ON chats FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_chats" ON chats;
CREATE POLICY "anon_all_chats" ON chats FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_chats" ON chats;
CREATE POLICY "authenticated_all_chats" ON chats FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_view_their_chats" ON chats;
CREATE POLICY "users_view_their_chats" ON chats FOR SELECT
USING (auth.uid()::text = ANY(participants));

DROP POLICY IF EXISTS "users_insert_chats" ON chats;
CREATE POLICY "users_insert_chats" ON chats FOR INSERT
WITH CHECK (auth.uid()::text = ANY(participants));

DROP POLICY IF EXISTS "users_update_chats" ON chats;
CREATE POLICY "users_update_chats" ON chats FOR UPDATE
USING (auth.uid()::text = ANY(participants));

-- MESSAGES POLICIES
DROP POLICY IF EXISTS "service_role_all_messages" ON messages;
CREATE POLICY "service_role_all_messages" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_all_messages" ON messages;
CREATE POLICY "anon_all_messages" ON messages FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_all_messages" ON messages;
CREATE POLICY "authenticated_all_messages" ON messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_view_messages_in_chats" ON messages;
CREATE POLICY "users_view_messages_in_chats" ON messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM chats
  WHERE chats.id = messages.chat_id AND auth.uid()::text = ANY(chats.participants)
));

DROP POLICY IF EXISTS "users_insert_messages" ON messages;
CREATE POLICY "users_insert_messages" ON messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM chats
  WHERE chats.id = messages.chat_id AND auth.uid()::text = ANY(chats.participants)
));

-- ============================================================
-- VERIFY COLUMNS WERE ADDED
-- ============================================================
-- Run this to verify all columns exist:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name='profiles' 
-- ORDER BY ordinal_position;
