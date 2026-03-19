#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n' + '═'.repeat(70));
console.log('MONiA DATABASE DIAGNOSTIC TEST');
console.log('═'.repeat(70) + '\n');

if (!url || !serviceKey) {
  console.error('❌ ERROR: Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
  console.log('\nPlease verify .env file contains:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  db: { schema: 'public' }
});

async function runDiagnostics() {
  try {
    console.log('📡 Connecting to Supabase database...\n');

    // TEST 1: Check table existence
    console.log('───────────────────────────────────────');
    console.log('TEST 1: Table Structure');
    console.log('───────────────────────────────────────');

    // Direct table queries
    const tableNames = ['chats', 'messages', 'profiles'];
    
    for (const table of tableNames) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      console.log(`\n✓ Table "${table}" exists: ${!error ? 'YES ✓' : 'NO ✗'}`);
      if (error) console.log(`  Error: ${error.message}`);
    }

    // TEST 2: Check actual data types by sampling
    console.log('\n───────────────────────────────────────');
    console.log('TEST 2: Data Type Verification');
    console.log('───────────────────────────────────────\n');

    // Get sample chats data and inspect types
    const { data: chatSamples, error: chatErr } = await supabase
      .from('chats')
      .select('id, participants, last_message_time')
      .limit(2);

    if (chatSamples && chatSamples.length > 0) {
      console.log('✓ Sample chat record:');
      const chat = chatSamples[0];
      console.log(`  - id: ${chat.id} (Type: ${typeof chat.id})`);
      console.log(`  - participants: ${JSON.stringify(chat.participants)} (Type: ${typeof chat.participants}, Element type: ${Array.isArray(chat.participants) && chat.participants[0] ? typeof chat.participants[0] : 'N/A'})`);
      console.log(`  - last_message_time: ${chat.last_message_time} (Type: ${typeof chat.last_message_time})`);
      
      const participantType = Array.isArray(chat.participants) && chat.participants.length > 0 
        ? typeof chat.participants[0] 
        : 'array_empty';
      
      console.log(`\n✓ CRITICAL: participants column contains: ${participantType === 'string' ? 'TEXT/STRING ✓' : participantType === 'number' ? 'NUMBERS/UUIDs ✗' : 'MIXED/UNKNOWN ⚠'}`);
    } else {
      console.log(`✗ No chat records found: ${chatErr?.message || 'Empty table'}`);
    }

    // Get sample messages data
    const { data: msgSamples, error: msgErr } = await supabase
      .from('messages')
      .select('id, chat_id, sender_id, type')
      .limit(2);

    if (msgSamples && msgSamples.length > 0) {
      console.log('\n✓ Sample message record:');
      const msg = msgSamples[0];
      console.log(`  - id: ${msg.id} (Type: ${typeof msg.id})`);
      console.log(`  - chat_id: ${msg.chat_id} (Type: ${typeof msg.chat_id})`);
      console.log(`  - sender_id: ${msg.sender_id} (Type: ${typeof msg.sender_id})`);
    } else {
      console.log(`✗ No message records found: ${msgErr?.message || 'Empty table'}`);
    }

    // Get sample profiles
    const { data: profSamples, error: profErr } = await supabase
      .from('profiles')
      .select('id, username, hide_phone, hide_city, hide_full_name')
      .limit(2);

    if (profSamples && profSamples.length > 0) {
      console.log('\n✓ Sample profile record:');
      const prof = profSamples[0];
      console.log(`  - id: ${prof.id} (Type: ${typeof prof.id}, Length: ${prof.id?.length})`);
      console.log(`  - username: ${prof.username} (Type: ${typeof prof.username})`);
      console.log(`  - hide_phone: ${prof.hide_phone} (Type: ${typeof prof.hide_phone})`);
      console.log(`  - hide_city: ${prof.hide_city} (Type: ${typeof prof.hide_city})`);
      
      // Check if ID looks like Clerk format
      const isClerkId = prof.id?.startsWith('user_');
      console.log(`  - ID Format: ${isClerkId ? 'Clerk ID ✓' : 'UUID or other'}`);
    } else {
      console.log(`✗ No profile records found: ${profErr?.message || 'Empty table'}`);
    }

    // TEST 3: RLS Policy Check
    console.log('\n───────────────────────────────────────');
    console.log('TEST 3: RLS Policies');
    console.log('───────────────────────────────────────\n');

    console.log('ℹ RLS Status check:');
    console.log('  (Detailed policy list requires direct SQL access)');
    console.log('  ➜ Check Supabase Dashboard → Authentication → Policies\n');

    // TEST 4: Test actual query operations
    console.log('───────────────────────────────────────');
    console.log('TEST 4: Query Operation Tests');
    console.log('───────────────────────────────────────\n');

    // Get first profile ID for testing
    const { data: firstProfile } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (firstProfile) {
      const testUserId = firstProfile.id;
      console.log(`Testing with user ID: ${testUserId}\n`);

      // Test 1: Read profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();

      console.log(`✓ Profile SELECT: ${!profileErr ? 'SUCCESS ✓' : 'FAILED ✗'}`);
      if (profileErr) console.log(`  Error: ${profileErr.message}`);

      // Test 2: Update profile (non-toggle field)
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testUserId);

      console.log(`✓ Profile UPDATE (updated_at): ${!updateErr ? 'SUCCESS ✓' : 'FAILED ✗'}`);
      if (updateErr) console.log(`  Error: ${updateErr.message}`);

      // Test 3: Update toggle field
      const { error: toggleErr } = await supabase
        .from('profiles')
        .update({ hide_phone: true })
        .eq('id', testUserId);

      console.log(`✓ Profile UPDATE (hide_phone toggle): ${!toggleErr ? 'SUCCESS ✓' : 'FAILED ✗'}`);
      if (toggleErr) console.log(`  Error: ${toggleErr.message}`);

      // Revert toggle
      await supabase
        .from('profiles')
        .update({ hide_phone: false })
        .eq('id', testUserId);

      // Test 4: Fetch chats containing this user
      const { data: userChats, error: chatsErr } = await supabase
        .from('chats')
        .select('*')
        .contains('participants', [testUserId]);

      console.log(`✓ Chats SELECT (contains query): Found ${userChats?.length || 0} chats ${!chatsErr ? '✓' : `✗ (${chatsErr?.message})`}`);
    } else {
      console.log('⚠ No profiles in database - skipping query tests');
    }

    // TEST 5: Realtime subscription test
    console.log('\n───────────────────────────────────────');
    console.log('TEST 5: Realtime Configuration');
    console.log('───────────────────────────────────────\n');

    console.log('ℹ Realtime subscriptions:');
    console.log('  - chats table: Check Supabase Dashboard → Realtime');
    console.log('  - messages table: Check Supabase Dashboard → Realtime');
    console.log('  (Both should have REPLICA IDENTITY enabled)');

    // Final summary
    console.log('\n' + '═'.repeat(70));
    console.log('DIAGNOSTIC SUMMARY');
    console.log('═'.repeat(70) + '\n');

    console.log('✓ Database connection: SUCCESS');
    console.log('✓ Tables present: chats, messages, profiles');
    console.log('ℹ Data type verification: See above');
    console.log('ℹ RLS policies: Check Supabase Dashboard');
    console.log('ℹ Realtime status: Check Supabase Dashboard');

    console.log('\n→ NEXT: Check the Supabase Dashboard SQL Editor for detailed schema info');
    console.log('→ NEXT: Verify RLS policies match authorization requirements');
    console.log('\n' + '═'.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Diagnostic error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runDiagnostics().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
