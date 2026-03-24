#!/bin/bash
set -a; source .env.local; set +a

fly deploy \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY="$VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
