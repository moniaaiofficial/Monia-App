/*
  # Add username column to profiles table for Clerk sync

  ## Changes
  - Add `username` column to profiles table
  - Add `avatar_url` column to profiles table
  - Make mobile_number nullable for Clerk sync
  - Update id column to be TEXT (for Clerk user IDs)
  - Add unique constraint on username
  - Update RLS policies for service role access

  ## Notes
  - Clerk user IDs are strings like "user_xxxxx", not UUIDs
  - Username must be unique across all users
  - Service role key bypasses RLS for webhook operations
*/

-- Drop existing foreign key constraint if it exists
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Change id column type to TEXT for Clerk user IDs
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- Add username column with unique constraint
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add avatar_url column for profile pictures
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Make mobile_number nullable (might not be available from Clerk)
ALTER TABLE profiles ALTER COLUMN mobile_number DROP NOT NULL;

-- Rename mobile_number to mobile for consistency
ALTER TABLE profiles RENAME COLUMN mobile_number TO mobile;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Update media_files table to use TEXT for user_id
ALTER TABLE media_files DROP CONSTRAINT IF EXISTS media_files_user_id_fkey;
ALTER TABLE media_files ALTER COLUMN user_id TYPE TEXT;

-- Update RLS policies to use TEXT comparison
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate policies that work with Clerk (using id as text)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Update media files policies
DROP POLICY IF EXISTS "Users can view own media files" ON media_files;
DROP POLICY IF EXISTS "Users can insert own media files" ON media_files;
DROP POLICY IF EXISTS "Users can update own media files" ON media_files;
DROP POLICY IF EXISTS "Users can delete own media files" ON media_files;

CREATE POLICY "Users can view own media files"
  ON media_files FOR SELECT
  TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own media files"
  ON media_files FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own media files"
  ON media_files FOR UPDATE
  TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own media files"
  ON media_files FOR DELETE
  TO authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Service role full access on media"
  ON media_files FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
