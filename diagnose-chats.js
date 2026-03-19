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

async function diagnoseChatsIssue() {
  console.log('\n' + '═'.repeat(80));
  console.log('DIAGNOSING CHATS/MESSAGES PERMISSION ISSUE');
  console.log('═'.repeat(80) + '\n');

  try {
    // Check if tables exist
    console.log('STEP 1: CHECK IF TABLES EXIST');
    console.log('─'.repeat(80) + '\n');

    const { data: tables, error: tablesErr } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema, table_type')
      .in('table_name', ['chats', 'messages', 'profiles'])
      .eq('table_schema', 'public');

    if (tablesErr) {
      console.log('❌ Cannot query information_schema:', tablesErr.message);
    } else {
      console.log('Tables found:\n');
      if (tables && tables.length > 0) {
        tables.forEach(t => {
          console.log(`  ✓ ${t.table_name} (${t.table_type})`);
        });
      } else {
        console.log('  ❌ No tables found!');
      }
    }
    console.log();

    // Try raw query to get RLS status
    console.log('STEP 2: CHECK RLS STATUS');
    console.log('─'.repeat(80) + '\n');

    const rlsQuery = `
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename IN ('chats', 'messages')
      AND schemaname = 'public';
    `;

    console.log('Executing: SELECT rowsecurity FROM pg_tables...\n');

    const { data: rlsStatus, error: rlsErr } = await supabase
      .rpc('execute_sql', { sql: rlsQuery })
      .catch(() => ({ data: null, error: 'RPC not available' }));

    if (rlsErr) {
      console.log(`Note: ${rlsErr.message}\n`);
    } else if (rlsStatus && rlsStatus.length > 0) {
      console.log('RLS Status:');
      rlsStatus.forEach(r => {
        console.log(`  ${r.tablename}: RLS ${r.rowsecurity ? 'ENABLED' : 'DISABLED'}`);
      });
      console.log();
    }

    // Try to just count rows
    console.log('STEP 3: TRY BASIC QUERIES');
    console.log('─'.repeat(80) + '\n');

    console.log('Query: Count chats');
    try {
      const { count: c1, error: e1 } = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true });
      console.log(`  Result: ${!e1 ? `✓ ${c1} chats` : `❌ ${e1.message}`}`);
    } catch (err) {
      console.log(`  Result: ❌ ${err.message}`);
    }

    console.log('\nQuery: Count messages');
    try {
      const { count: c2, error: e2 } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });
      console.log(`  Result: ${!e2 ? `✓ ${c2} messages` : `❌ ${e2.message}`}`);
    } catch (err) {
      console.log(`  Result: ❌ ${err.message}`);
    }

    console.log('\nQuery: Count profiles (for comparison)');
    try {
      const { count: c3, error: e3 } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      console.log(`  Result: ${!e3 ? `✓ ${c3} profiles` : `❌ ${e3.message}`}`);
    } catch (err) {
      console.log(`  Result: ❌ ${err.message}`);
    }
    console.log();

    // Check table grants
    console.log('STEP 4: CHECK DATABASE GRANTS');
    console.log('─'.repeat(80) + '\n');

    const grantsQuery = `
      SELECT grantee, privilege_type
      FROM information_schema.table_privileges
      WHERE table_name IN ('chats', 'messages')
      AND table_schema = 'public';
    `;

    const { data: grants, error: grantsErr } = await supabase
      .rpc('execute_sql', { sql: grantsQuery })
      .catch(() => ({ data: null, error: 'RPC not available' }));

    if (grantsErr) {
      console.log(`Table grants: Not immediately accessible (${grantsErr.message})\n`);
    } else if (grants && grants.length > 0) {
      console.log('Table Grants:');
      grants.forEach(g => {
        console.log(`  ${g.grantee}: ${g.privilege_type}`);
      });
      console.log();
    }

    // Try recreating tables
    console.log('STEP 5: ENSURE TABLES EXIST WITH FULL PERMISSIONS');
    console.log('─'.repeat(80) + '\n');

    const createTablesSQL = `
      -- Drop existing if they exist
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS chats CASCADE;

      -- Create chats table
      CREATE TABLE IF NOT EXISTS chats (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        participants TEXT[] NOT NULL,
        last_message TEXT,
        last_message_time TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create messages table
      CREATE TABLE IF NOT EXISTS messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        sender_id TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT DEFAULT 'text',
        status TEXT CHECK (status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Disable RLS (since app uses Clerk auth)
      ALTER TABLE chats DISABLE ROW LEVEL SECURITY;
      ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

      -- Set REPLICA IDENTITY for Realtime
      ALTER TABLE chats REPLICA IDENTITY FULL;
      ALTER TABLE messages REPLICA IDENTITY FULL;

      -- Grant permissions
      GRANT ALL ON chats TO anon, authenticated, service_role;
      GRANT ALL ON messages TO anon, authenticated, service_role;

      -- Create indexes
      CREATE INDEX idx_chats_participants ON chats USING GIN(participants);
      CREATE INDEX idx_messages_chat_id ON messages(chat_id);
      CREATE INDEX idx_messages_created_at ON messages(created_at);
    `;

    console.log('Recreating tables with full permissions...\n');

    let createErr;
    try {
      const result = await supabase.rpc('exec_migration', { sql: createTablesSQL });
      createErr = result.error;
    } catch (err) {
      createErr = err;
    }

    if (createErr) {
      console.log(`⚠ Creation note: ${createErr.message}\n`);
    } else {
      console.log('✓ Tables created/verified\n');
    }

    // Final verification
    console.log('STEP 6: FINAL VERIFICATION');
    console.log('─'.repeat(80) + '\n');

    const { data: finalChats, error: finalErr1, count: finalCount1 } = await supabase
      .from('chats')
      .select('*', { count: 'exact' })
      .limit(1);

    const { data: finalMsgs, error: finalErr2, count: finalCount2 } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .limit(1);

    console.log('Chats Table:');
    if (finalErr1) {
      console.log(`  ❌ ${finalErr1.message}`);
    } else {
      console.log(`  ✓ Accessible (${finalCount1 || 0} rows)`);
    }

    console.log('\nMessages Table:');
    if (finalErr2) {
      console.log(`  ❌ ${finalErr2.message}`);
    } else {
      console.log(`  ✓ Accessible (${finalCount2 || 0} rows)`);
    }

    console.log('\n' + '═'.repeat(80) + '\n');

  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

diagnoseChatsIssue();
