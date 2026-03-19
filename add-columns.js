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

async function addMissingColumns() {
  console.log('\n' + '═'.repeat(80));
  console.log('ADDING MISSING COLUMNS TO PROFILES TABLE');
  console.log('═'.repeat(80) + '\n');

  try {
    // Define the SQL to add columns
    const sqlStatements = [
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_phone BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_city BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_full_name BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_mode_enabled BOOLEAN DEFAULT FALSE;`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_start TEXT DEFAULT '20:00';`,
      `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_end TEXT DEFAULT '07:00';`,
    ];

    console.log('Executing SQL migrations...\n');

    // Try using RPC to execute SQL if available, otherwise note that manual execution is needed
    for (const sql of sqlStatements) {
      console.log(`Executing: ${sql.substring(0, 60)}...`);
      
      // Attempt using procedure execution
      const { error } = await supabase.rpc('execute_sql', { sql }).catch(err => ({
        error: { message: 'RPC not available - need manual SQL execution' }
      }));

      if (error && !error.message.includes('does not exist')) {
        console.log(`  ⚠ Note: ${error.message}`);
      }
    }

    console.log('\n✓ Column migration instructions generated.\n');
    console.log('Because Supabase doesn\'t allow arbitrary SQL execution via client,');
    console.log('you need to run these commands manually in the Supabase SQL Editor:\n');

    console.log('COPY-PASTE THIS SQL INTO SUPABASE DASHBOARD → SQL EDITOR:\n');
    console.log('─'.repeat(80));

    const fullSQL = `-- Add missing privacy and sleep mode columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_phone BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_city BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_full_name BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_mode_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_start TEXT DEFAULT '20:00';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sleep_end TEXT DEFAULT '07:00';

-- Verify columns were added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name='profiles' AND column_name IN ('hide_phone', 'hide_city', 'hide_full_name', 'sleep_mode_enabled', 'sleep_start', 'sleep_end');`;

    console.log(fullSQL);
    console.log('─'.repeat(80) + '\n');

    // Try to verify if columns exist now
    console.log('Verifying column addition...\n');
    const { data: testProfile, error: testErr } = await supabase
      .from('profiles')
      .select('hide_phone, hide_city, hide_full_name, sleep_mode_enabled, sleep_start, sleep_end')
      .limit(1)
      .single();

    if (!testErr) {
      console.log('✓ SUCCESS: Columns are now available!');
      console.log(`  hide_phone: ${testProfile.hide_phone}`);
      console.log(`  hide_city: ${testProfile.hide_city}`);
      console.log(`  hide_full_name: ${testProfile.hide_full_name}`);
      console.log(`  sleep_mode_enabled: ${testProfile.sleep_mode_enabled}`);
      console.log(`  sleep_start: ${testProfile.sleep_start}`);
      console.log(`  sleep_end: ${testProfile.sleep_end}`);
    } else {
      console.log(`✗ Columns still missing (expected if manual SQL not run yet)`);
      console.log(`  Error: ${testErr.message}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

addMissingColumns();
