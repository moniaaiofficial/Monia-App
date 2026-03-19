#!/bin/bash
# Load env and run Node script
set -a
source .env.local 2>/dev/null || source .env 2>/dev/null
set +a

# Debug: show env vars are loaded
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "ERROR: NEXT_PUBLIC_SUPABASE_URL not set"
  exit 1
fi

echo "✓ Environment loaded"
node fix-message-types.js
