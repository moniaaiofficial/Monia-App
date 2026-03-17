
-- Grant all operations to the authenticated role
GRANT ALL ON profiles TO authenticated;

-- RLS Policy: Allow service_role to perform all actions
CREATE POLICY "Allow service_role all actions" ON profiles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- RLS Policy: Allow users to view their own profile
CREATE POLICY "Allow users to view their own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- RLS Policy: Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);
