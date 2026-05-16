#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const content = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
const env = Object.fromEntries(
  content.split('\n').filter(l => l.includes('=')).map(l => {
    const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()];
  })
);

const sb = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

// Simula o mesmo cálculo do app
const now = new Date();
const start = new Date(now.getFullYear(), 0, 0);
const dayOfYear = Math.floor((now - start) / 86_400_000);
const rowOffset = ((dayOfYear - 1 + 31102) % 31102) + 1;
console.log('rowOffset para hoje:', rowOffset);

// Teste 1: query principal
const { data, error } = await sb
  .from('bible_verses')
  .select('id, number, text, bible_chapters!inner(number, bible_books!inner(name, abbrev, bible_versions!inner(slug)))')
  .eq('bible_chapters.bible_books.bible_versions.slug', 'arc')
  .range(rowOffset, rowOffset)
  .single();

console.log('\n--- Query principal ---');
if (error) {
  console.log('ERRO:', error.message, error.code);
} else {
  const book = data.bible_chapters.bible_books.name;
  const ch = data.bible_chapters.number;
  console.log(`OK: ${book} ${ch}:${data.number} — "${data.text.slice(0, 60)}..."`);
}

// Teste 2: fallback
const { data: fb, error: fbErr } = await sb
  .from('bible_verses')
  .select('id, number, text, bible_chapters!inner(number, bible_books!inner(name, abbrev, bible_versions!inner(slug)))')
  .eq('number', 1)
  .eq('bible_chapters.number', 23)
  .eq('bible_chapters.bible_books.name', 'Salmos')
  .limit(1)
  .single();

console.log('\n--- Fallback (Salmos 23:1) ---');
if (fbErr) {
  console.log('ERRO:', fbErr.message);
} else {
  console.log(`OK: ${fb.bible_chapters.bible_books.name} ${fb.bible_chapters.number}:${fb.number} — "${fb.text.slice(0, 60)}..."`);
}

// Teste 3: total de versículos arc
const { count } = await sb
  .from('bible_verses')
  .select('id', { count: 'exact', head: true });
console.log('\nTotal de versículos no banco:', count);
