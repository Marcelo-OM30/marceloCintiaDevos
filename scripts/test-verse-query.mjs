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

// Importa a lista curada (como JSON inline para evitar problemas de módulo)
const VERSES_FILE = readFileSync(resolve(__dirname, '../lib/curatedVerses.ts'), 'utf-8');
// Extrai as referências via regex simples
const refs = [...VERSES_FILE.matchAll(/\{ book: '([^']+)', chapter: (\d+), verse: (\d+) \}/g)]
  .map(m => ({ book: m[1], chapter: Number(m[2]), verse: Number(m[3]) }));

console.log(`Total de versículos na lista curada: ${refs.length}`);

// Versículo do dia
const now = new Date();
const start = new Date(now.getFullYear(), 0, 0);
const dayOfYear = Math.floor((now - start) / 86_400_000);
const ref = refs[(dayOfYear - 1 + refs.length) % refs.length];
console.log(`\nVersículo de hoje (dia ${dayOfYear}): ${ref.book} ${ref.chapter}:${ref.verse}`);

// Testa a query principal
const { data, error } = await sb
  .from('bible_verses')
  .select('id, number, text, bible_chapters!inner(number, bible_books!inner(name, abbrev))')
  .eq('number', ref.verse)
  .eq('bible_chapters.number', ref.chapter)
  .eq('bible_chapters.bible_books.name', ref.book)
  .limit(1)
  .single();

if (error) {
  console.log('ERRO na query:', error.message);
} else {
  console.log(`OK: ${data.bible_chapters.bible_books.name} ${data.bible_chapters.number}:${data.number}`);
  console.log(`Texto: "${data.text}"`);
}

// Testa 5 versículos aleatórios da lista para garantir que existem no banco
console.log('\n--- Testando 5 versículos aleatórios da lista ---');
const samples = [refs[0], refs[50], refs[100], refs[150], refs[200]];
for (const r of samples) {
  const { data: d, error: e } = await sb
    .from('bible_verses')
    .select('number, text, bible_chapters!inner(number, bible_books!inner(name))')
    .eq('number', r.verse)
    .eq('bible_chapters.number', r.chapter)
    .eq('bible_chapters.bible_books.name', r.book)
    .limit(1)
    .maybeSingle();
  if (e || !d) {
    console.log(`❌ ${r.book} ${r.chapter}:${r.verse} — NÃO ENCONTRADO`);
  } else {
    console.log(`✓  ${r.book} ${r.chapter}:${r.verse} — "${d.text.slice(0, 50)}..."`);
  }
}

// Total de versículos no banco
const { count } = await sb
  .from('bible_verses')
  .select('id', { count: 'exact', head: true });
console.log('\nTotal de versículos no banco:', count);
