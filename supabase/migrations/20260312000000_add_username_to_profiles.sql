/*
  # Add username column to profiles table for Clerk sync

  ## Changes
  - Add `username` column to profiles table
  - Add `avatar_url` column to profiles table
  - Add `mobile` column for phone numbers
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
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Add username column with unique constraint
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;
ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);

-- Add avatar_url column for profile pictures
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add mobile column (if mobile_number exists, rename it)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'mobile_number'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN mobile_number TO mobile;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'mobile'
  ) THEN
    ALTER TABLE profiles ADD COLUMN mobile TEXT;
  END IF;
END $$;

-- Make mobile nullable (might not be available from Clerk)
ALTER TABLE profiles ALTER COLUMN mobile DROP NOT NULL;

-- Make full_name nullable
ALTER TABLE profiles ALTER COLUMN full_name DROP NOT NULL;

-- Make email nullable for edge cases
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Update media_files table to use TEXT for user_id
ALTER TABLE media_files DROP CONSTRAINT IF EXISTS media_files_user_id_fkey;
ALTER TABLE media_files ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Update RLS policies to use TEXT comparison
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;

-- Service role can do everything (for webhooks) - this is the main policy we need
CREATE POLICY "Service role full access"
  ON profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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

-- Update media files policies
DROP POLICY IF EXISTS "Users can view own media files" ON media_files;
DROP POLICY IF EXISTS "Users can insert own media files" ON media_files;
DROP POLICY IF EXISTS "Users can update own media files" ON media_files;
DROP POLICY IF EXISTS "Users can delete own media files" ON media_files;
DROP POLICY IF EXISTS "Service role full access on media" ON media_files;

CREATE POLICY "Service role full access on media"
  ON media_files FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

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
