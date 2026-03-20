# MONiA Profile Sync - CRITICAL FIXES APPLIED ✅

## Summary of Issues Fixed

### Issue #1: Email Signup Data Not Syncing to Supabase ❌ → ✅
- **Problem**: Mobile and City were saved to `unsafeMetadata` in Clerk instead of `publicMetadata`
- **Impact**: Webhook couldn't read them, so they never synced to Supabase
- **Fix**: Changed signup form to save to `publicMetadata` instead
- **File**: `app/auth/signup/page.tsx`
- **Change**: `unsafeMetadata: { mobile, city }` → `publicMetadata: { mobile, city, profile_complete: false }`

### Issue #2: Email Signup Users Aren't Redirected to Profile Completion ❌ → ✅
- **Problem**: After email verification, users went directly to `/dashboard` instead of `/profile-setup`
- **Impact**: Users never get to confirm/input their profile data
- **Fix**: Redirect to `/profile-setup` after email verification (same as Google OAuth)
- **File**: `app/auth/verify-email/page.tsx`
- **Change**: `router.push('/dashboard')` → `router.push('/profile-setup')`

### Issue #3: Webhook Not Reading All Metadata Sources ❌ → ✅
- **Problem**: Webhook only read `publicMetadata`, ignored `unsafeMetadata` (legacy data)
- **Impact**: If any old data existed in unsafeMetadata, it would be ignored
- **Fix**: Webhook now reads both sources with fallback chain
- **File**: `app/api/webhooks/clerk/route.ts`
- **Changes**:
  - Read both `publicMetadata` and `unsafeMetadata`
  - Merge them with proper priority: `{ ...unsafeMeta, ...publicMeta }`
  - Username priority: `clerk_username` → `public_username` → `unsafe_username` → `email_derived`
  - Better error logging for debugging

### Issue #4: Profile Complete Flag Not Set for Email Signups ❌ → ✅
- **Problem**: After profile-setup, the `profile_complete` flag wasn't being set in Clerk metadata
- **Impact**: Users might get sent back to profile-setup on next login
- **Fix**: Profile update endpoint now sets `profile_complete: true` when updating username/mobile/city
- **File**: `app/api/profile/update/route.ts`
- **Change**: Always set `profile_complete: true` when updating profile fields

---

## Testing Checklist

### Test #1: Email Signup Flow (NEW ACCOUNT)
```
1. Go to app → Sign up
2. Enter:
   - Full Name: Test User
   - Username: testuser123
   - Email: test+$(date +%s)@example.com
   - Mobile: +1234567890
   - City: New York
   - Password: TestPass123!
3. Click "Create Account"
4. Check Clerk dashboard: Profile data should be in publicMetadata
5. Check email inbox → Click verification link
6. EXPECT: Redirected to /profile-setup (NOT /dashboard) ✅
7. Pre-filled fields should show your signup data ✅
8. Click "Continue to MONiA" button
9. EXPECT: Redirected to dashboard ✅
10. VERIFY IN SUPABASE:
    - Open Supabase dashboard → profiles table
    - Filter by email: your test email
    - Check that ALL fields are present:
      - ✅ full_name: Test User
      - ✅ username: testuser123
      - ✅ email: test+...@example.com
      - ✅ mobile: +1234567890 (THIS WAS MISSING BEFORE!)
      - ✅ city: New York (THIS WAS MISSING BEFORE!)
    - Check Clerk: publicMetadata should have profile_complete: true

### Test #2: Google OAuth Flow (NEW ACCOUNT)
```
1. Go to app → Sign up
2. Click "Continue with Google"
3. Complete Google OAuth
4. EXPECT: Redirected to /profile-setup ✅
5. Enter:
   - Username: googleuser456
   - Mobile: +9876543210
   - City: San Francisco
6. Click "Continue to MONiA"
7. EXPECT: Redirected to dashboard ✅
8. VERIFY IN SUPABASE:
    - Filter by email: your Google email
    - Check ALL fields populated:
      - ✅ full_name: (from Google)
      - ✅ username: googleuser456
      - ✅ email: (your.google.email@gmail.com)
      - ✅ mobile: +9876543210
      - ✅ city: San Francisco
    - Check avatar_url populated from Google profile

### Test #3: Existing User Login
```
1. Create a new account (test 1 or 2)
2. Complete the flow and go to dashboard
3. Log out
4. Log back in with same credentials
5. EXPECT: Direct to dashboard (NOT profile-setup) because profile_complete: true ✅
6. Go to Profile page
7. VERIFY ALL FIELDS DISPLAY CORRECTLY:
   - ✅ Full Name shows correctly
   - ✅ Username shows correctly (with @ prefix)
   - ✅ Email shows correctly
   - ✅ Mobile shows (NOT dashes "—")
   - ✅ City shows (NOT dashes "—")

### Test #4: Toggle Persistence (Privacy & Sleep Mode)
```
1. Open Profile page on your test account
2. Scroll to "Privacy" section
3. Toggle "Hide mobile number" ON
4. EXPECT: UI updates immediately ✅
5. EXPECT: Loader shows briefly ✅
6. Wait for "✓" checkmark to show ✅
7. Refresh the page (Cmd+R / Ctrl+R)
8. EXPECT: Toggle still ON (persisted to Supabase) ✅
9. Toggle "Sleep Mode" ON
10. Set wake/sleep times
11. EXPECT: Times save and persist ✅
12. Refresh again
13. EXPECT: All toggles remain in saved state ✅

### Test #5: Profile Page Data Display (The User Example)
```
After completing Test #1, check the Profile page:

Profile
[Avatar]
Full Name (should be: Test User)

ACCOUNT INFO
Username: @testuser123 (NOT @— as before)
Full Name: Test User
Email: test+...@example.com
Mobile: +1234567890 (NOT — as before!)
City: New York (NOT — as before!)

PRIVACY
- Hide full name from others [Toggle]
- Hide mobile number [Toggle]
- Hide city [Toggle]

SLEEP MODE 🌙
- Enable Sleep Mode [Toggle]
- (If enabled) Sleep from: [Time picker]
- (If enabled) Wake at: [Time picker]

All fields should have real data, no placeholders!
```

---

## Webhook Logs to Verify

When a new user signs up and the webhook runs, check Supabase logs:
1. Go to Supabase dashboard → Edge Functions or Logs
2. Look for webhook entries
3. Should see logs like:
```
[Webhook] Processing user.created for user user_XXX:
- email: test+...@example.com
- fullName: Test User
- username: testuser123
- mobile: +1234567890
- city: New York
- publicMetadata: { mobile: "+1234567890", city: "New York", profile_complete: false }

[Webhook] ✅ user.created — Successfully upserted user
```

---

## Files Modified

1. ✅ `/app/auth/signup/page.tsx` - Changed metadata storage
2. ✅ `/app/auth/verify-email/page.tsx` - Changed redirect URL
3. ✅ `/app/api/webhooks/clerk/route.ts` - Enhanced webhook parsing and logging
4. ✅ `/app/api/profile/update/route.ts` - Enhanced Clerk metadata updates

---

## What to Watch For

### ✅ SHOULD SEE:
- Profile fields populate if data was provided during signup
- Toggles save and persist across page refreshes
- Mobile and City appear on Profile page (not dashes)

### ❌ SHOULD NOT SEE:
- "@—" placeholder for username
- "—" for Mobile and City
- "fake placeholder" values
- Users stuck on profile-setup after second login

---

## Debugging Steps If Issues Persist

1. **Check Clerk Metadata:**
   - Go to Clerk dashboard → Users → Select test user
   - View "Public Metadata" tab
   - Should see: `{ "mobile": "...", "city": "...", "profile_complete": true }`

2. **Check Supabase Profile Row:**
   - Go to Supabase → profiles table
   - Filter by user id
   - ALL fields should have values (no NULLs unless intentional)

3. **Check Browser Console Logs:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for messages like:
     - `✅ Profile created successfully`
     - `💾 OPTIMISTIC UPDATE`
     - `📝 Saving profile`

4. **Check Server Logs (Vercel):**
   - Go to Vercel project → Logs
   - Search for webhook logs
   - Should see successful upserts with mobile/city data

5. **Manual Test - Insert Data:**
   - In Supabase SQL editor, manually update a test user:
   ```sql
   UPDATE profiles 
   SET mobile = '+1111111111', city = 'TestCity'
   WHERE id = 'user_XXX';
   ```
   - Refresh Profile page
   - New values should appear

---

## After Testing - Next Steps

Once all tests pass:
1. Deploy to production ✅
2. Monitor Vercel logs for 24 hours
3. Test with real new user signups
4. Keep this document for reference

