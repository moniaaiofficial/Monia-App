-- Phase 2B: Add privacy/sleep/permanent-id fields to profiles
-- Run this in your Supabase SQL editor

-- Privacy toggles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_phone BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_city BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_full_name BOOLEAN DEFAULT FALSE;

-- Sleep mode
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_mode_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_start TEXT DEFAULT '20:00';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_end TEXT DEFAULT '07:00';

-- Permanent unique ID (random_number-user_id format)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permanent_id TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_permanent_id ON profiles(permanent_id);

-- Allow anon reads on profiles (needed for new-chat search and profile display)
-- The existing policies only allow `authenticated` role reads via Supabase Auth JWT,
-- but this app uses Clerk auth so we add a permissive anon read policy.
DROP POLICY IF EXISTS "Allow anon read profiles" ON profiles;
CREATE POLICY "Allow anon read profiles"
  ON profiles FOR SELECT
  TO anon
  USING (true);

-- Also allow anon insert for new profile setup (Google OAuth users)
DROP POLICY IF EXISTS "Allow anon insert profiles" ON profiles;
CREATE POLICY "Allow anon insert profiles"
  ON profiles FOR INSERT
  TO anon
  WITH CHECK (true);
