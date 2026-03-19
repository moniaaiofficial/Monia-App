#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env
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

const supabase = createClient(url, serviceKey);

async function execute() {
  console.log('\n' + '═'.repeat(80));
  console.log('MONiA APP - REAL DATABASE VERIFICATION & FIX');
  console.log('═'.repeat(80) + '\n');

  try {
    // STEP 1: Check profiles table
    console.log('STEP 1: VERIFY PROFILES TABLE DATA');
    console.log('─'.repeat(80));
    
    const { data: profiles, error: profilesErr, count: profileCount } = await supabase
      .from('profiles')
      .select('id, username, email, full_name, mobile, city, avatar_url', { count: 'exact' })
      .limit(5);

    console.log(`Result: ${profileCount} total profiles in database\n`);
    
    if (profilesErr) {
      console.log(`❌ ERROR: ${profilesErr.message}`);
    } else if (profiles && profiles.length > 0) {
      console.log('✓ Sample profiles:');
      profiles.forEach((p, i) => {
        console.log(`  ${i + 1}. ID: ${p.id}`);
        console.log(`     Username: ${p.username}`);
        console.log(`     Email: ${p.email}`);
        console.log(`     Full Name: ${p.full_name}`);
        console.log(`     Mobile: ${p.mobile}`);
        console.log(`     City: ${p.city}\n`);
      });
    } else {
      console.log('❌ No profiles found');
    }

    // STEP 2: Check if toggle columns exist
    console.log('STEP 2: VERIFY PRIVACY TOGGLE COLUMNS');
    console.log('─'.repeat(80));

    const columns = ['hide_phone', 'hide_city', 'hide_full_name', 'sleep_mode_enabled', 'sleep_start', 'sleep_end'];
    const { data: fullProfile, error: fullErr } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single();

    if (fullErr && fullErr.message.includes('does not exist')) {
      console.log('❌ ERROR: Columns missing from profile table');
      console.log(`   Error: ${fullErr.message}\n`);
      console.log('ACTION: Need to add missing columns via SQL\n');
    } else if (fullProfile) {
      console.log('✓ Checking column existence:\n');
      columns.forEach(col => {
        const exists = fullProfile.hasOwnProperty(col);
        console.log(`  ${exists ? '✓' : '✗'} ${col}: ${exists ? 'EXISTS' : 'MISSING'}`);
      });
      console.log();
    }

    // STEP 3: Check chats table
    console.log('STEP 3: VERIFY CHATS TABLE');
    console.log('─'.repeat(80));

    const { data: chats, error: chatsErr, count: chatsCount } = await supabase
      .from('chats')
      .select('id, participants', { count: 'exact' })
      .limit(3);

    console.log(`Result: ${chatsCount} total chats in database\n`);

    if (chatsErr) {
      console.log(`❌ ERROR: ${chatsErr.message}\n`);
    } else if (chats && chats.length > 0) {
      console.log('✓ Sample chats:');
      chats.forEach((c, i) => {
        console.log(`  ${i + 1}. ID: ${c.id}`);
        console.log(`     Participants: ${JSON.stringify(c.participants)}`);
        if (c.participants && c.participants.length > 0) {
          console.log(`     Participant type: ${typeof c.participants[0]}`);
        }
        console.log();
      });
    } else {
      console.log('ℹ No chats found (might be empty)\n');
    }

    // STEP 4: Check messages table
    console.log('STEP 4: VERIFY MESSAGES TABLE');
    console.log('─'.repeat(80));

    const { data: messages, error: msgsErr, count: msgsCount } = await supabase
      .from('messages')
      .select('id, chat_id, sender_id', { count: 'exact' })
      .limit(3);

    console.log(`Result: ${msgsCount} total messages in database\n`);

    if (msgsErr) {
      console.log(`❌ ERROR: ${msgsErr.message}\n`);
    } else if (messages && messages.length > 0) {
      console.log('✓ Sample messages:');
      messages.forEach((m, i) => {
        console.log(`  ${i + 1}. Chat ID: ${m.chat_id} | Sender ID: ${m.sender_id}\n`);
      });
    } else {
      console.log('ℹ No messages found (might be empty)\n');
    }

    // STEP 5: Check RLS policies
    console.log('STEP 5: RLS POLICIES STATUS');
    console.log('─'.repeat(80));
    console.log('ℹ Policies are listed in Supabase Dashboard → Authentication → Policies\n');
    console.log('For now, testing SELECT/UPDATE with service role...\n');

    if (profiles && profiles.length > 0) {
      const testId = profiles[0].id;
      console.log(`Testing with user: ${testId}\n`);

      // Test SELECT
      const { data: testRead, error: readErr } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', testId)
        .single();

      console.log(`  SELECT test: ${!readErr ? '✓ SUCCESS' : '✗ FAILED'}`);
      if (readErr) console.log(`    Error: ${readErr.message}`);

      // Test UPDATE
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testId);

      console.log(`  UPDATE test: ${!updateErr ? '✓ SUCCESS' : '✗ FAILED'}`);
      if (updateErr) console.log(`    Error: ${updateErr.message}`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('ANALYSIS COMPLETE');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

execute();
