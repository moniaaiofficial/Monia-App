/*
  # Create MONiA Database Schema

  ## Overview
  Sets up the core database structure for the MONiA application including user profiles and media tracking.

  ## New Tables
  
  ### 1. `profiles`
  Stores extended user profile information beyond Supabase Auth
  - `id` (uuid, primary key) - Links to auth.users
  - `full_name` (text) - User's full name
  - `email` (text) - User's email address
  - `mobile_number` (text) - User's phone number (mandatory)
  - `city` (text) - User's city
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### 2. `media_files`
  Tracks uploaded media files for auto-deletion after 48 hours
  - `id` (uuid, primary key) - Unique media file identifier
  - `user_id` (uuid) - Owner of the media file
  - `file_path` (text) - Storage path to the media file
  - `file_type` (text) - Type: image, video, document, voice_note
  - `created_at` (timestamptz) - Upload timestamp
  - `media_expiry` (timestamptz) - Auto-calculated expiry (created_at + 48 hours)
  - `is_deleted` (boolean) - Soft delete flag

  ## Security
  
  ### Row Level Security (RLS)
  - All tables have RLS enabled
  - Users can only read/update their own profile data
  - Users can only access their own media files
  - Authenticated users required for all operations

  ## Important Notes
  - Media files automatically expire 48 hours after creation
  - Text messages are NOT stored in this schema (handled separately)
  - Cleanup job will run via Edge Function to delete expired media
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  mobile_number text NOT NULL,
  city text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create media_files table
CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'voice_note')),
  created_at timestamptz DEFAULT now(),
  media_expiry timestamptz DEFAULT (now() + interval '48 hours'),
  is_deleted boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Media files policies
CREATE POLICY "Users can view own media files"
  ON media_files FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media files"
  ON media_files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media files"
  ON media_files FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own media files"
  ON media_files FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster media expiry queries
CREATE INDEX IF NOT EXISTS idx_media_expiry ON media_files(media_expiry) WHERE is_deleted = false;

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();