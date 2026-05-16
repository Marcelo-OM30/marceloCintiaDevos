import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const content = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of content.split('\n')) {
  const [k, ...v] = line.split('=');
  if (k) env[k.trim()] = v.join('=').trim();
}

const sb = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

const { count, error } = await sb
  .from('bible_verses')
  .select('id', { count: 'exact', head: true });

console.log('Versículos no banco:', count);
if (error) console.log('Erro:', error.message);
