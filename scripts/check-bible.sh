#!/bin/bash
cd /home/marcelo/cascadeprojects/marceloCintiaDevos
ANON_KEY=$(grep EXPO_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d= -f2)
URL=$(grep EXPO_PUBLIC_SUPABASE_URL .env.local | cut -d= -f2)
echo "URL: $URL"
curl -s "${URL}/rest/v1/bible_verses?select=id&limit=1" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY"
echo ""
echo "--- count ---"
curl -s "${URL}/rest/v1/bible_verses?select=id" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Prefer: count=exact" \
  -I 2>&1 | grep -i content-range
