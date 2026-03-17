-- Grant table-level permissions to the service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Enable Row Level Security on the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all potentially conflicting policies to ensure a clean slate
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- 1. Create a master policy for the service_role (for server-side operations)
CREATE POLICY "Service role has full access"
ON public.profiles FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. Create a policy for authenticated users to read their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING ( auth.uid()::text = id );

-- 3. Create a policy for authenticated users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ( auth.uid()::text = id )
WITH CHECK ( auth.uid()::text = id );
