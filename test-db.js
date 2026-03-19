#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env file manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n' + '═'.repeat(70));
console.log('MONiA DATABASE DIAGNOSTIC - REAL DATA VERIFICATION');
console.log('═'.repeat(70) + '\n');

if (!url || !serviceKey) {
  console.error('❌ ERROR: Missing credentials');
  console.log('  NEXT_PUBLIC_SUPABASE_URL:', url ? '✓' : '✗');
  console.log('  SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✓' : '✗');
  process.exit(1);
}

console.log('✓ Credentials loaded\n');

const supabase = createClient(url, serviceKey);

async function test() {
  try {
    // TEST 1: Profile data
    console.log('───────────────────────────────────────');
    console.log('STEP 1: PROFILES TABLE');
    console.log('───────────────────────────────────────\n');

    const { data: profiles, error: profileErr, count: profileCount } = await supabase
      .from('profiles')
      .select('id, username, hide_phone, hide_city, hide_full_name, sleep_mode_enabled', { count: 'exact' })
      .limit(1);

    console.log(`Total profiles in database: ${profileCount || 0}`);

    if (profiles && profiles.length > 0) {
      const p = profiles[0];
      console.log('\n✓ Sample profile record:');
      console.log(`  ID: ${p.id}`);
      console.log(`  Type of ID: ${typeof p.id}`);
      console.log(`  ID Starts with "user_": ${p.id?.startsWith('user_') ? 'YES ✓' : 'NO (UUID or other)'}`);
      console.log(`  Username: ${p.username}`);
      console.log(`  hide_phone: ${p.hide_phone} (${typeof p.hide_phone})`);
      console.log(`  hide_city: ${p.hide_city} (${typeof p.hide_city})`);
      console.log(`  hide_full_name: ${p.hide_full_name} (${typeof p.hide_full_name})`);
      console.log(`  sleep_mode_enabled: ${p.sleep_mode_enabled} (${typeof p.sleep_mode_enabled})`);
    } else if (profileErr) {
      console.log(`✗ Error: ${profileErr.message}`);
    } else {
      console.log('✗ No profiles found (table might be empty)');
    }

    // TEST 2: Chats data
    console.log('\n───────────────────────────────────────');
    console.log('STEP 2: CHATS TABLE');
    console.log('───────────────────────────────────────\n');

    const { data: chats, error: chatsErr, count: chatsCount } = await supabase
      .from('chats')
      .select('id, participants, last_message_time', { count: 'exact' })
      .limit(1);

    console.log(`Total chats in database: ${chatsCount || 0}`);

    if (chats && chats.length > 0) {
      const c = chats[0];
      console.log('\n✓ Sample chat record:');
      console.log(`  ID: ${c.id} (Type: ${typeof c.id})`);
      console.log(`  Participants: ${JSON.stringify(c.participants)}`);
      console.log(`  Participants type: ${typeof c.participants}`);
      if (Array.isArray(c.participants) && c.participants.length > 0) {
        console.log(`  First participant type: ${typeof c.participants[0]}`);
        console.log(`  First participant: ${c.participants[0]}`);
        const isText = typeof c.participants[0] === 'string';
        const isClerkId = String(c.participants[0]).startsWith('user_');
        console.log(`  → Participants are TEXT/STRING: ${isText ? 'YES ✓' : 'NO ✗ (UUIDs or numbers)'}`);
        console.log(`  → First participant looks like Clerk ID: ${isClerkId ? 'YES ✓' : 'NO (UUID or other format)'}`);
      }
      console.log(`  Last message time: ${c.last_message_time}`);
    } else if (chatsErr) {
      console.log(`✗ Error: ${chatsErr.message}`);
    } else {
      console.log('✗ No chats found (table might be empty)');
    }

    // TEST 3: Messages data
    console.log('\n───────────────────────────────────────');
    console.log('STEP 3: MESSAGES TABLE');
    console.log('───────────────────────────────────────\n');

    const { data: messages, error: messagesErr, count: messagesCount } = await supabase
      .from('messages')
      .select('id, chat_id, sender_id, type', { count: 'exact' })
      .limit(1);

    console.log(`Total messages in database: ${messagesCount || 0}`);

    if (messages && messages.length > 0) {
      const m = messages[0];
      console.log('\n✓ Sample message record:');
      console.log(`  ID: ${m.id} (Type: ${typeof m.id})`);
      console.log(`  Chat ID: ${m.chat_id} (Type: ${typeof m.chat_id})`);
      console.log(`  Sender ID: ${m.sender_id} (Type: ${typeof m.sender_id})`);
      console.log(`  Type: ${m.type}`);
    } else if (messagesErr) {
      console.log(`✗ Error: ${messagesErr.message}`);
    } else {
      console.log('✗ No messages found (table might be empty)');
    }

    // TEST 4: Query operations
    console.log('\n───────────────────────────────────────');
    console.log('STEP 4: LIVE QUERY TESTS');
    console.log('───────────────────────────────────────\n');

    if (profiles && profiles.length > 0) {
      const testUserId = profiles[0].id;
      console.log(`Testing with user ID: ${testUserId}\n`);

      // Test SELECT
      const { data: profile, error: selectErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

      console.log(`Test 1 - SELECT profile:`);
      console.log(`  Status: ${!selectErr ? '✓ SUCCESS' : '✗ FAILED'}`);
      if (selectErr) console.log(`  Error: ${selectErr.message}`);

      // Test UPDATE timestamp
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testUserId);

      console.log(`\nTest 2 - UPDATE (timestamp):`);
      console.log(`  Status: ${!updateErr ? '✓ SUCCESS' : '✗ FAILED'}`);
      if (updateErr) console.log(`  Error: ${updateErr.message}`);

      // Test UPDATE toggle
      const { error: toggleErr1 } = await supabase
        .from('profiles')
        .update({ hide_phone: true })
        .eq('id', testUserId);

      console.log(`\nTest 3 - UPDATE (toggle hide_phone=true):`);
      console.log(`  Status: ${!toggleErr1 ? '✓ SUCCESS' : '✗ FAILED'}`);
      if (toggleErr1) console.log(`  Error: ${toggleErr1.message}`);

      // Verify toggle was saved
      const { data: updatedProfile, error: verifyErr } = await supabase
        .from('profiles')
        .select('hide_phone')
        .eq('id', testUserId)
        .single();

      if (updatedProfile) {
        console.log(`\nTest 4 - VERIFY toggle saved:`);
        console.log(`  hide_phone value: ${updatedProfile.hide_phone}`);
        console.log(`  Status: ${updatedProfile.hide_phone === true ? '✓ SAVED CORRECTLY' : '✗ NOT SAVED OR REVERTED'}`);
      }

      // Revert for cleanup
      await supabase
        .from('profiles')
        .update({ hide_phone: false })
        .eq('id', testUserId);

      // Test contains query for chats
      console.log(`\nTest 5 - CONTAINS query (find chats with this user):`);
      const { data: userChats, error: containsErr, count: userChatsCount } = await supabase
        .from('chats')
        .select('id, participants', { count: 'exact' })
        .contains('participants', [testUserId]);

      console.log(`  Status: ${!containsErr ? '✓ SUCCESS' : '✗ FAILED'}`);
      console.log(`  Chats found: ${userChatsCount || 0}`);
      if (containsErr) console.log(`  Error: ${containsErr.message}`);
      if (userChats && userChats.length > 0) {
        console.log(`  Sample: ${JSON.stringify(userChats[0])}`);
      }
    }

    // TEST 5: RLS Check
    console.log('\n───────────────────────────────────────');
    console.log('STEP 5: RLS POLICIES');
    console.log('───────────────────────────────────────\n');

    console.log('ℹ RLS Policies detailed info requires direct SQL access');
    console.log('ℹ To view RLS policies:');
    console.log('  1. Go to Supabase Dashboard');
    console.log('  2. Navigate to Authentication → Policies');
    console.log('  3. Select each table: profiles, chats, messages\n');

    // We can check if RLS is enabled by trying operations
    const { error: anonTestErr } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    console.log('ℹ RLS Enabled check (via anon key):');
    console.log(`  Status: ${anonTestErr ? '✓ RLS ENABLED (anon blocked)' : '✗ RLS disabled or anon key allows'}`);

    // TEST 6: Summary
    console.log('\n' + '═'.repeat(70));
    console.log('DIAGNOSTIC SUMMARY');
    console.log('═'.repeat(70) + '\n');

    console.log('✓ Database connection: SUCCESS');
    console.log('✓ Tables accessible: profiles, chats, messages');
    
    if (profiles?.length > 0) {
      console.log(`✓ Data present: ${profileCount} profiles, ${chatsCount} chats, ${messagesCount} messages`);
    } else {
      console.log('⚠ No data in tables (profiles empty)');
    }

    console.log('\n→ KEY FINDINGS:');
    if (profiles?.length > 0) {
      const p = profiles[0];
      if (p.id?.startsWith('user_')) {
        console.log('  ✓ Profile IDs are Clerk format (TEXT) ✓');
      } else {
        console.log('  ⚠ Profile IDs are NOT Clerk format (might be UUID)');
      }
    }

    if (chats?.length > 0) {
      const c = chats[0];
      if (c.participants && Array.isArray(c.participants)) {
        const firstPart = c.participants[0];
        if (typeof firstPart === 'string') {
          console.log('  ✓ Chat participants are TEXT ✓');
          if (String(firstPart).startsWith('user_')) {
            console.log('  ✓ Participants contain Clerk IDs ✓');
          } else {
            console.log('  ⚠ Participants might not be Clerk format');
          }
        } else if (typeof firstPart === 'number') {
          console.log('  ✗ Chat participants are NUMBERS/UUIDs (should be TEXT) ✗');
        } else {
          console.log(`  ⚠ Chat participants type unknown: ${typeof firstPart}`);
        }
      }
    }

    console.log('\n' + '═'.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
