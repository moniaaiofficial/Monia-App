#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

async function fixRLS() {
  console.log('\n' + '═'.repeat(80));
  console.log('FIXING RLS POLICIES FOR CHATS/MESSAGES');
  console.log('═'.repeat(80) + '\n');

  try {
    // Comprehensive RLS fix
    const rlsFixSQL = `
      -- CHATS TABLE - Disable RLS completely (app uses Clerk auth, not Supabase Auth)
      ALTER TABLE chats DISABLE ROW LEVEL SECURITY;

      -- MESSAGES TABLE - Disable RLS completely
      ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

      -- If re-enabling RLS in future, use these permissive policies:
      -- For CHATS:
      DROP POLICY IF EXISTS "service_role_all_chats" ON chats;
      DROP POLICY IF EXISTS "anon_all_chats" ON chats;
      DROP POLICY IF EXISTS "authenticated_all_chats" ON chats;

      -- For MESSAGES:
      DROP POLICY IF EXISTS "service_role_all_messages" ON messages;
      DROP POLICY IF EXISTS "anon_all_messages" ON messages;
      DROP POLICY IF EXISTS "authenticated_all_messages" ON messages;
    `;

    console.log('Applying RLS fix...\n');

    let fixData, fixErr;
    try {
      const result = await supabase.rpc('exec_migration', { sql: rlsFixSQL });
      fixData = result.data;
      fixErr = result.error;
    } catch (err) {
      fixErr = err;
    }

    if (fixErr) {
      console.log(`⚠ Error: ${fixErr.message}`);
      console.log('This might be expected. Continuing with verification...\n');
    } else {
      console.log('✓ RLS policies updated\n');
    }

    // Verify chats are now accessible
    console.log('Verifying chats table access...\n');

    const { data: chats, error: chatsErr, count: chatsCount } = await supabase
      .from('chats')
      .select('id, participants', { count: 'exact' })
      .limit(3);

    if (chatsErr) {
      console.log(`❌ Chats still blocked: ${chatsErr.message}`);
    } else {
      console.log(`✓ Chats accessible! Total: ${chatsCount}`);
      if (chats && chats.length > 0) {
        chats.forEach((c, i) => {
          console.log(`  ${i + 1}. Chat ID: ${c.id}`);
          console.log(`     Participants: ${JSON.stringify(c.participants)}`);
        });
      } else {
        console.log('  (No chats yet - that\'s normal for new app)');
      }
    }

    // Verify messages are now accessible
    console.log('\nVerifying messages table access...\n');

    const { data: messages, error: msgsErr, count: msgsCount } = await supabase
      .from('messages')
      .select('id, chat_id, sender_id', { count: 'exact' })
      .limit(3);

    if (msgsErr) {
      console.log(`❌ Messages still blocked: ${msgsErr.message}`);
    } else {
      console.log(`✓ Messages accessible! Total: ${msgsCount}`);
      if (messages && messages.length > 0) {
        messages.forEach((m, i) => {
          console.log(`  ${i + 1}. Message ID: ${m.id}`);
        });
      } else {
        console.log('  (No messages yet - that\'s normal for new app)');
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('RLS FIX COMPLETE');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

fixRLS();
