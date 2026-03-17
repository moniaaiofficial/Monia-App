
CREATE OR REPLACE FUNCTION search_users(search_term text)
RETURNS TABLE(id UUID, username TEXT, full_name TEXT, avatar_url TEXT)
AS $$
BEGIN
    RETURN QUERY
    SELECT id, username, full_name, avatar_url
    FROM profiles
    WHERE username ILIKE '%' || search_term || '%' OR full_name ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;
