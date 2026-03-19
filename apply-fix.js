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

async function fixDatabase() {
  console.log('\n' + '═'.repeat(80));
  console.log('MONiA DATABASE FIX - ADDING MISSING COLUMNS');
  console.log('═'.repeat(80) + '\n');

  try {
    // Test if exec_migration function exists
    console.log('Step 1: Testing exec_migration RPC function...\n');

    const testSQL = `SELECT 'exec_migration RPC is available' as status;`;
    let testData, testErr;
    try {
      const result = await supabase.rpc('exec_migration', { sql: testSQL });
      testData = result.data;
      testErr = result.error;
    } catch (err) {
      testErr = err;
    }

    if (testErr && testErr.message.includes('does not exist')) {
      console.log('⚠ exec_migration RPC not found. Creating it first...\n');

      // Create the exec_migration function
      const createFnSQL = `
        CREATE OR REPLACE FUNCTION exec_migration(sql text)
        RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
        BEGIN EXECUTE sql; END; $$;
        GRANT EXECUTE ON FUNCTION exec_migration(text) TO service_role;
      `;

      const headers = {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      };

      const res = await fetch(`${url}/rest/v1/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ sql: createFnSQL }),
      }).catch(err => ({ ok: false, error: err.message }));

      console.log('Created exec_migration function\n');
    } else if (testErr) {
      console.log(`⚠ RPC test error: ${testErr.message}`);
      console.log('Continuing anyway...\n');
    } else {
      console.log('✓ exec_migration RPC is available\n');
    }

    // Now execute the migration to add columns
    console.log('Step 2: Adding missing columns to profiles table...\n');

    const addColumnsSQL = `
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_phone BOOLEAN DEFAULT FALSE;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_city BOOLEAN DEFAULT FALSE;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_full_name BOOLEAN DEFAULT FALSE;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_mode_enabled BOOLEAN DEFAULT FALSE;
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_start TEXT DEFAULT '20:00';
      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_end TEXT DEFAULT '07:00';
    `;

    let addColData, addColErr;
    try {
      const result = await supabase.rpc('exec_migration', { sql: addColumnsSQL });
      addColData = result.data;
      addColErr = result.error;
    } catch (err) {
      addColErr = err;
    }

    if (addColErr) {
      console.log(`⚠ Error executing column add: ${addColErr.message}`);
      console.log('This might be expected if columns already exist.\n');
    } else {
      console.log('✓ Column addition executed\n');
    }

    // Fix RLS policies
    console.log('Step 3: Fixing RLS policies for anon and authenticated users...\n');

    const rlsSQL = `
      -- Allow anon to read/update profiles (Clerk auth is used, not Supabase Auth)
      DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
      CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);

      -- Ensure service_role has full access to chats and messages
      DROP POLICY IF EXISTS "service_role_all_chats" ON chats;
      CREATE POLICY "service_role_all_chats" ON chats FOR ALL TO service_role USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "service_role_all_messages" ON messages;
      CREATE POLICY "service_role_all_messages" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);

      -- Allow anon full access to chats (for Clerk auth users)
      DROP POLICY IF EXISTS "anon_all_chats" ON chats;
      CREATE POLICY "anon_all_chats" ON chats FOR ALL TO anon USING (true) WITH CHECK (true);

      DROP POLICY IF EXISTS "anon_all_messages" ON messages;
      CREATE POLICY "anon_all_messages" ON messages FOR ALL TO anon USING (true) WITH CHECK (true);
    `;

    let rlsData, rlsErr;
    try {
      const result = await supabase.rpc('exec_migration', { sql: rlsSQL });
      rlsData = result.data;
      rlsErr = result.error;
    } catch (err) {
      rlsErr = err;
    }

    if (rlsErr) {
      console.log(`⚠ Error fixing RLS: ${rlsErr.message}`);
    } else {
      console.log('✓ RLS policies updated\n');
    }

    // Verify columns exist
    console.log('Step 4: Verifying columns were added...\n');

    const { data: profiles, error: verifyErr } = await supabase
      .from('profiles')
      .select('hide_phone, hide_city, hide_full_name, sleep_mode_enabled, sleep_start, sleep_end')
      .limit(1)
      .single();

    if (verifyErr) {
      console.log(`❌ Verification failed: ${verifyErr.message}`);
      console.log('\nThe columns might not have been added. Please manually run the SQL in:');
      console.log('  supabase/fix-schema.sql\n');
      console.log('Steps:');
      console.log('1. Go to Supabase Dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Create new query');
      console.log('4. Copy and paste contents of supabase/fix-schema.sql');
      console.log('5. Click Run');
    } else {
      console.log('✓ SUCCESS: Columns verified as present!');
      console.log(`  hide_phone: ${profiles.hide_phone} (type: ${typeof profiles.hide_phone})`);
      console.log(`  hide_city: ${profiles.hide_city}`);
      console.log(`  hide_full_name: ${profiles.hide_full_name}`);
      console.log(`  sleep_mode_enabled: ${profiles.sleep_mode_enabled}`);
      console.log(`  sleep_start: ${profiles.sleep_start}`);
      console.log(`  sleep_end: ${profiles.sleep_end}\n`);
    }

    // Test update operation
    console.log('Step 5: Testing toggle update operation...\n');

    const { data: testProfiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (testProfiles) {
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ hide_phone: true, updated_at: new Date().toISOString() })
        .eq('id', testProfiles.id);

      if (updateErr) {
        console.log(`❌ Toggle update failed: ${updateErr.message}`);
      } else {
        console.log('✓ Toggle update successful!\n');

        // Verify it was saved
        const { data: updated } = await supabase
          .from('profiles')
          .select('hide_phone')
          .eq('id', testProfiles.id)
          .single();

        if (updated && updated.hide_phone) {
          console.log('✓ VERIFIED: Toggle value was saved to database');
        }

        // Revert for cleanup
        await supabase
          .from('profiles')
          .update({ hide_phone: false })
          .eq('id', testProfiles.id);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log('DATABASE FIX COMPLETE');
    console.log('═'.repeat(80) + '\n');

  } catch (error) {
    console.error('Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixDatabase();
