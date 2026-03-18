
CREATE OR REPLACE FUNCTION sync_user_profile(
    user_id text,
    user_email text,
    user_full_name text,
    user_avatar_url text,
    user_raw_metadata jsonb
) RETURNS void AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, avatar_url, username, mobile, city)
    VALUES (
        user_id,
        user_email,
        user_full_name,
        user_avatar_url,
        user_raw_metadata->>'username',
        user_raw_metadata->>'mobile',
        user_raw_metadata->>'city'
    )
    ON CONFLICT (id)
    DO UPDATE SET
        email = COALESCE(user_email, profiles.email),
        full_name = COALESCE(user_full_name, profiles.full_name),
        avatar_url = COALESCE(user_avatar_url, profiles.avatar_url),
        username = COALESCE(user_raw_metadata->>'username', profiles.username),
        mobile = COALESCE(user_raw_metadata->>'mobile', profiles.mobile),
        city = COALESCE(user_raw_metadata->>'city', profiles.city),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
