
-- Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow full access to service_role" ON public.profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;

DROP POLICY IF EXISTS "Allow full access to service_role" ON public.chats;
DROP POLICY IF EXISTS "Users can access their own chats" ON public.chats;

DROP POLICY IF EXISTS "Allow full access to service_role" ON public.messages;
DROP POLICY IF EXISTS "Users can access messages in their chats" ON public.messages;

-- Create security-focused RLS policies for the 'profiles' table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to service_role" 
ON public.profiles FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can read their own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = id) 
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Allow authenticated users to read profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- Create security-focused RLS policies for the 'chats' table
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to service_role" 
ON public.chats FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can access their own chats" 
ON public.chats FOR ALL 
TO authenticated 
USING (auth.uid()::text = ANY(participants)) 
WITH CHECK (auth.uid()::text = ANY(participants));

-- Create security-focused RLS policies for the 'messages' table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to service_role" 
ON public.messages FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Users can access messages in their chats" 
ON public.messages FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1
    FROM chats
    WHERE chats.id = messages.chat_id AND auth.uid()::text = ANY(chats.participants)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM chats
    WHERE chats.id = messages.chat_id AND auth.uid()::text = ANY(chats.participants)
  )
);

-- Create the function to sync user data from Clerk
CREATE OR REPLACE FUNCTION public.sync_user_profile(
  user_id TEXT,
  user_email TEXT,
  user_full_name TEXT,
  user_avatar_url TEXT,
  user_raw_metadata JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url, mobile, city, sleep_start, sleep_end)
  VALUES (
    user_id,
    user_email,
    user_full_name,
    user_avatar_url,
    user_raw_metadata->>'mobile',
    user_raw_metadata->>'city',
    user_raw_metadata->>'sleep_start',
    user_raw_metadata->>'sleep_end'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    mobile = EXCLUDED.mobile,
    city = EXCLUDED.city,
    sleep_start = EXCLUDED.sleep_start,
    sleep_end = EXCLUDED.sleep_end,
    updated_at = NOW();
END;
$$;

-- Grant execute permission on the function to the service_role
GRANT EXECUTE ON FUNCTION public.sync_user_profile(TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;
