# Profile Icon Screen - Complete Fix & Testing Guide

## ✅ Changes Made

### 1. **Root Page (Authentication Flow)**
- **File**: `app/page.tsx`
- **Change**: Added profile completion check
- **Logic**: 
  - If user is authenticated AND `profile_complete = true` → redirect to `/dashboard`
  - If user is authenticated AND `profile_complete` is NOT set → redirect to `/profile-setup`
  - If not authenticated → redirect to `/welcome`
- **Console Logs**: `[Splash] User logged in — profile_complete: {boolean}` and redirect info

### 2. **Profile Page (Data Loading & Display)**
- **File**: `app/profile/page.tsx`
- **Changes**:
  - Enhanced `useEffect` to populate ALL fields from Supabase:
    - Full Name, Email, Username, Mobile, City, Avatar URL
  - Improved auto-creation logic when profile doesn't exist
  - Better error handling (only show real DB errors, not PGRST116)
  - Enhanced console logging for debugging
  - Optimistic UI updates with revert-on-error
  - All toggle fields now properly initialized
- **Console Logs**:
  ```
  👤 USER ID: {userId}
  📦 USER DATA FROM CLERK: {...}
  📊 PROFILE RESPONSE: {...}
  ⚠️ PROFILE ERROR: {code, message}
  ✅ PROFILE RESPONSE: {data}
  ✅ NEW PROFILE CREATED: {...}
  📱 UPDATED PROFILE STATE: {...}
  💾 OPTIMISTIC UPDATE - Local state updated
  📝 Saving profile for user...
  📤 Server response (status X): {...}
  ✅ Profile updated successfully on server
  📦 CONFIRMED FROM SERVER - Updated profile state
  ```

### 3. **Profile Setup Page**
- **File**: `app/profile-setup/page.tsx`
- **Changes**: Added comprehensive logging
- **Console Logs**: `[Profile Setup] Submitting/Server response/Profile saved successfully`

### 4. **Clerk Webhook**
- **File**: `app/api/webhooks/clerk/route.ts`
- **Changes**:
  - Enhanced logging to show all data being synced
  - Properly initializes all toggle fields on user creation
  - Preserves metadata values if provided
- **Console Logs**: 
  ```
  [Webhook] Processing {event-type} for user {id}
  [Webhook] Creating new profile with defaults
  [Webhook] Upserting profile row
  [Webhook] ✅ {event-type} — Successfully upserted user to Supabase
  [Webhook] Profile data stored
  ```

### 5. **Profile Update API**
- **File**: `app/api/profile/update/route.ts`
- **Changes**: 
  - Enhanced logging for each field update
  - Better validation feedback
  - Clerk metadata update logging
- **Console Logs**: 
  ```
  📝 [API] Profile update requested for user {id}
  ✅ {field} updated: {value}
  📤 Upserting to Supabase: {...}
  ✅ Profile upserted successfully: {...}
  📝 Updating Clerk metadata for user {id}
  ✅ Clerk metadata updated with profile_complete: true
  ```

### 6. **More Page (Dashboard)**
- **File**: `app/dashboard/more/page.tsx`
- **Changes**: Added profile loading with error handling and logging
- **Console Logs**: `[More Page] Loading/Profile loaded/Profile fetch error`

---

## 🧪 Testing Checklist

### Test 1: New User Registration & Auto-Redirect
**Scenario**: Brand new user signs up with Google OAuth

**Steps**:
1. Go to `/welcome` and click "Continue with Google"
2. Sign up with a new Google account (use temp account if possible)
3. Watch the splash screen (logo visible briefly)

**Expected Results**:
- User redirected to `/profile-setup` (NOT `/dashboard`)
- Console shows: `[Splash] User logged in — profile_complete: undefined`
- Console shows: `[Splash] Redirecting to profile-setup (incomplete profile)`
- Webhook fires in backend (check function logs in Supabase)
- Profile auto-created in Supabase with basic info

**Console Logs to Check**:
```
👤 USER ID: {user_xxxxx}
📦 USER DATA FROM CLERK: {email, fullName, imageUrl}
⚠️ PROFILE ERROR: PGRST116,message: "no rows returned"
✅ NEW PROFILE CREATED: {id, email, full_name, username}
```

---

### Test 2: Profile Setup - Enter Details
**Scenario**: Complete profile setup form

**Steps**:
1. On `/profile-setup`, see pre-filled username suggestion
2. Enter Mobile: `+91 9876543210`
3. Enter City: `Mumbai`
4. Click "Continue"

**Expected Results**:
- Profile saved to Supabase with all fields
- `profile_complete` set to `true` in Clerk metadata
- User redirected to `/dashboard`
- Profile now shows all data

**Console Logs to Check**:
```
[Profile Setup] Submitting profile for user {id}
📝 [API] Profile update requested for user {id}
✅ Username updated: {username}
✅ Mobile updated: {mobile}
✅ City updated: {city}
📝 Updating Clerk metadata for user {id}
✅ Clerk metadata updated with profile_complete: true
```

---

### Test 3: View Profile Page - All Fields Display
**Scenario**: Navigate to profile page

**Steps**:
1. From dashboard, click "More" tab
2. Click on profile card
3. View profile page (`/profile`)

**Expected Results**:
- All fields display correctly:
  - ✅ Full Name (from Clerk)
  - ✅ Email (from Clerk)
  - ✅ Username (user-entered)
  - ✅ Mobile (user-entered)
  - ✅ City (user-entered)
  - ✅ Avatar (from Clerk)
- No "—" (dash) fallbacks for required fields
- Sleep mode section visible
- All toggle switches present

**Console Logs to Check**:
```
👤 USER ID: {userId}
✅ Profile loaded successfully: {all fields listed}
```

---

### Test 4: Edit Profile - Username Change
**Scenario**: Change username on profile page

**Steps**:
1. On profile page, find Username row
2. Click "Edit" button
3. Change username (e.g., `test_user_new`)
4. Click "Save"

**Expected Results**:
- UI updates immediately (optimistic update)
- Success checkmark shows briefly
- Button shows spinning loader during save
- Data persisted to Supabase
- Username uniqueness validated

**Console Logs to Check**:
```
💾 OPTIMISTIC UPDATE - Local state updated: {username: ...}
📝 Saving profile for user
📤 Server response (status 200)
✅ Profile updated successfully on server
📦 CONFIRMED FROM SERVER - Updated profile state
```

---

### Test 5: Toggle Privacy Settings
**Scenario**: Enable/disable privacy toggles

**Steps**:
1. On profile page, scroll to "Privacy" section
2. Toggle "Hide mobile number"
3. Toggle "Hide city"
4. Toggle "Hide full name from others"

**Expected Results**:
- Toggle switches work smoothly
- Each save happens in realtime
- Success checkmark shows after each toggle
- Data saved to Supabase
- Toggles persist after refresh

**Console Logs to Check**:
```
💾 OPTIMISTIC UPDATE - Local state updated: {hide_phone: true}
✅ Hide phone: true
✅ Profile updated successfully on server
```

---

### Test 6: Enable & Configure Sleep Mode
**Scenario**: Set up sleep mode with custom times

**Steps**:
1. On profile page, scroll to "Sleep Mode" section
2. Toggle "Enable Sleep Mode"
3. Set "Sleep from": 22:00
4. Set "Wake at": 07:00

**Expected Results**:
- Sleep mode toggle works
- Time input fields appear when enabled
- Times save correctly
- Can modify and save new times
- All values persist after refresh

**Console Logs to Check**:
```
✅ Sleep mode enabled: true
✅ Sleep start: 22:00
✅ Sleep end: 07:00
```

---

### Test 7: Existing User Login
**Scenario**: User who already has a complete profile logs back in

**Steps**:
1. Sign out from the app
2. Sign back in with same Google account
3. Watch splash screen

**Expected Results**:
- User redirected to `/dashboard` (NOT profile-setup)
- Console shows: `[Splash] User logged in — profile_complete: true`
- Profile page loads instantly with all correct data
- No missing fields

**Console Logs to Check**:
```
[Splash] User logged in — profile_complete: true
✅ Profile loaded successfully
```

---

### Test 8: Profile Update & Clerk Sync
**Scenario**: Make changes and verify Clerk metadata updates

**Steps**:
1. On profile page, enter Mobile: `+91 8765432109`
2. Enter City: `Bangalore`
3. Click Save

**Expected Results**:
- Supabase updated with new values ✅
- Clerk `publicMetadata` updated with:
  - `username`: {entered username}
  - `mobile`: {entered mobile}
  - `city`: {entered city}
  - `profile_complete`: true
- Next login uses this updated metadata

**Console Logs to Check**:
```
📝 Updating Clerk metadata for user
✅ Clerk metadata updated with profile_complete: true
```

---

### Test 9: Avatar Upload
**Scenario**: Upload a profile picture

**Steps**:
1. On profile page, click camera icon on avatar
2. Upload an image (PNG/JPG, <5MB)
3. Wait for upload to complete

**Expected Results**:
- Avatar preview shows immediately
- Upload spinner appears
- Image stored in Supabase storage
- Avatar URL updated in profiles table
- Avatar persists after refresh

**Console Logs to Check**:
```
[Avatar] Upload processing
✅ Profile avatar updated
```

---

### Test 10: More Page Profile Card
**Scenario**: View profile card on More page

**Steps**:
1. Go to dashboard
2. Click "More" tab at bottom
3. View profile card at top

**Expected Results**:
- Profile card shows:
  - ✅ Avatar
  - ✅ Full Name
  - ✅ @Username
  - ✅ Email
- All fields display correctly (no "—" fallbacks)
- Clicking card navigates to profile page

**Console Logs to Check**:
```
[More Page] Loading profile for user
✅ [More Page] Profile loaded: {all fields}
```

---

## 🐛 Debugging Tips

### If Profile Shows Empty/Missing Fields

**Check These Console Logs** (F12 → Console tab):
1. `👤 USER ID:` — Does it show a valid Clerk ID?
2. `✅ Profile loaded successfully:` — Are all fields listed?
3. `⚠️ PROFILE ERROR:` — Is there an error code?

**If PGRST116 error**:
- Profile doesn't exist in Supabase
- Should auto-create, but might fail
- Check webhook logs in Supabase

**If profile loads but fields are empty**:
- Webhook didn't sync username/mobile/city
- User needs to go to profile-setup
- Or user should fill in fields on profile page

---

### If Redirect Loop or Wrong Redirect

**Check These**:
1. `profile_complete` flag in Clerk:
   - Go to Clerk Dashboard → Users
   - Click user → Public Metadata
   - Should see `profile_complete: true`

2. If missing, profile-setup form wasn't submitted properly
   - Check `/api/profile/update` response (200 vs error)
   - Check Supabase for profile update

---

### If Toggles Not Saving

**Check These**:
1. "💾 OPTIMISTIC UPDATE" in console
2. "✅ Profile updated successfully" confirmation
3. Check Supabase profiles table directly:
   - Should see updated toggle values
   - Check `updated_at` timestamp to verify

---

## 📱 Key Features Verification

### ✅ Feature 1: Automatic Profile Creation
- **Trigger**: Clerk webhook on user.created
- **Result**: Profile exists in Supabase with basic info
- **Verify**: Open Supabase → profiles table → check for new row

### ✅ Feature 2: Auto-Redirect for Incomplete Profiles
- **Trigger**: New user logs in
- **Result**: Redirected to profile-setup
- **Verify**: In console: `[Splash] Redirecting to profile-setup`

### ✅ Feature 3: All Fields Display
- **Trigger**: Navigate to profile page
- **Result**: Full Name, Email, Username, Mobile, City, Avatar all show
- **Verify**: No "—" fallbacks for fields that have values

### ✅ Feature 4: Real-Time Toggle Saving
- **Trigger**: Click any toggle switch
- **Result**: Saves immediately, success indicator shows
- **Verify**: Refresh page — value persists

### ✅ Feature 5: Sleep Mode Configuration
- **Trigger**: Enable sleep mode + set times
- **Result**: Times saved, display persists
- **Verify**: Refresh page — settings unchanged

### ✅ Feature 6: Supabase Integration
- **Trigger**: Any profile change
- **Result**: Supabase profiles table updated
- **Verify**: Open Supabase → profiles table in real browser

---

## 🎯 Testing Automation (Optional)

You can use these test scripts to verify the backend integration:

```bash
# Test Webhook (simulate user.created)
# Already handled by Clerk in production

# Test Profile Fetch API
curl -X GET "http://localhost:3000/api/profile/get" \
  -H "Authorization: Bearer {clerk-token}"

# Test Profile Update API  
curl -X POST "http://localhost:3000/api/profile/update" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_xxxxx",
    "username": "testuser",
    "mobile": "+91 9999999999",
    "city": "Delhi"
  }'
```

---

## ✨ Summary

**What was fixed**:
1. ✅ New users auto-redirect to profile-setup (not dashboard)
2. ✅ Profile auto-creates on Clerk signup via webhook
3. ✅ Profile page loads ALL fields from Supabase
4. ✅ All toggles work and save in realtime
5. ✅ Sleep mode configuration fully functional
6. ✅ Comprehensive console logging for debugging
7. ✅ Better error handling (no false "Failed to fetch" messages)
8. ✅ Optimistic UI updates with error recovery

**Testing Priority**:
1. 🔴 **Critical**: Test 1, 2, 3, 7 (New user flow & existing user flow)
2. 🟡 **Important**: Test 4, 5, 6 (Profile editing & toggles)
3. 🟢 **Nice to have**: Test 8, 9, 10 (Advanced features)

Open the browser console (F12) during each test and verify the logs match the expected output!
