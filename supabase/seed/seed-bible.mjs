#!/usr/bin/env node
/**
 * seed-bible.mjs
 * 
 * Importa os dados da Bíblia Almeida (ARC, ARA, ACF) para o Supabase.
 * 
 * Fonte: https://github.com/thiagobodruk/biblia (JSON de domínio público)
 * 
 * USO:
 *   node supabase/seed/seed-bible.mjs
 * 
 * REQUISITOS:
 *   npm install @supabase/supabase-js node-fetch dotenv
 *   Preencha .env.local com EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
 *   Use a SERVICE_ROLE_KEY para inserção (não a anon key)
 *   Adicione SUPABASE_SERVICE_ROLE_KEY no .env.local
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carrega .env.local manualmente (sem depender do dotenv no seed)
function loadEnv() {
  const envPath = resolve(__dirname, '../../.env.local');
  if (!existsSync(envPath)) {
    throw new Error('.env.local não encontrado. Crie o arquivo com as chaves do Supabase.');
  }
  const content = readFileSync(envPath, 'utf-8');
  const vars = {};
  for (const line of content.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) vars[key.trim()] = rest.join('=').trim();
  }
  return vars;
}

const env = loadEnv();

const supabaseUrl     = env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey  = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Erro: EXPO_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env.local');
  process.exit(1);
}

// Usa service role para ignorar RLS durante o seed
const supabase = createClient(supabaseUrl, serviceRoleKey);

// ─── Mapeamento de livros ──────────────────────────────────────────────────────

const OT_BOOKS = 39; // Gênesis a Malaquias

const BOOK_ABBREVS = [
  'Gn','Ex','Lv','Nm','Dt','Js','Jz','Rt','1Sm','2Sm','1Rs','2Rs',
  '1Cr','2Cr','Ed','Ne','Et','Jó','Sl','Pv','Ec','Ct','Is','Jr','Lm',
  'Ez','Dn','Os','Jl','Am','Ob','Jn','Mq','Na','Hc','Sf','Ag','Zc','Ml',
  'Mt','Mc','Lc','Jo','At','Rm','1Co','2Co','Gl','Ef','Fp','Cl',
  '1Ts','2Ts','1Tm','2Tm','Tt','Fm','Hb','Tg','1Pe','2Pe',
  '1Jo','2Jo','3Jo','Jd','Ap',
];

// ─── Versões para importar ────────────────────────────────────────────────────

const VERSIONS = [
  {
    slug: 'arc',
    name: 'Almeida Revista e Corrigida',
    // URL do JSON da ARC no repositório thiagobodruk/biblia
    url: 'https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/aa.json',
  },
  {
    slug: 'ara',
    name: 'Almeida Revista e Atualizada',
    url: 'https://raw.githubusercontent.com/thiagobodruk/biblia/master/json/acf.json',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao baixar ${url}: ${res.status}`);
  return res.json();
}

async function upsertInBatches(table, rows, batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(batch);
    if (error) throw new Error(`Erro ao inserir em ${table}: ${error.message}`);
    process.stdout.write(`  ${table}: ${Math.min(i + batchSize, rows.length)}/${rows.length}\r`);
  }
  console.log(`  ${table}: ${rows.length} registros inseridos.`);
}

// ─── Seed principal ───────────────────────────────────────────────────────────

async function seedVersion(version) {
  console.log(`\n📖 Importando: ${version.name} (${version.slug})`);

  // 1. Inserir versão
  const { data: versionRow, error: vErr } = await supabase
    .from('bible_versions')
    .upsert({ slug: version.slug, name: version.name, language: 'pt-BR' }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (vErr) throw new Error(`Versão: ${vErr.message}`);
  const versionId = versionRow.id;

  // 2. Baixar JSON
  console.log('  Baixando dados...');
  const books = await fetchJson(version.url);

  // 3. Inserir livros
  const bookRows = books.map((book, i) => ({
    version_id: versionId,
    number: i + 1,
    name: book.name,
    abbrev: BOOK_ABBREVS[i] ?? book.abbr ?? `L${i+1}`,
    testament: i < OT_BOOKS ? 'OT' : 'NT',
  }));

  const { data: insertedBooks, error: bErr } = await supabase
    .from('bible_books')
    .upsert(bookRows, { onConflict: 'version_id,number' })
    .select('id, number');

  if (bErr) throw new Error(`Livros: ${bErr.message}`);

  // Mapeia number → id
  const bookIdMap = Object.fromEntries(insertedBooks.map(b => [b.number, b.id]));

  // 4. Inserir capítulos e versículos
  const allChapters = [];
  const chapterKey  = []; // { bookNum, chapterNum, bookDbId }

  books.forEach((book, bi) => {
    book.chapters.forEach((_, ci) => {
      allChapters.push({ book_id: bookIdMap[bi + 1], number: ci + 1 });
      chapterKey.push({ bookNum: bi + 1, chapterNum: ci + 1 });
    });
  });

  const { data: insertedChapters, error: cErr } = await supabase
    .from('bible_chapters')
    .upsert(allChapters, { onConflict: 'book_id,number' })
    .select('id, book_id, number');

  if (cErr) throw new Error(`Capítulos: ${cErr.message}`);

  // Mapeia book_id+number → chapter id
  const chapterIdMap = Object.fromEntries(
    insertedChapters.map(c => [`${c.book_id}-${c.number}`, c.id])
  );

  // 5. Montar todos os versículos
  const allVerses = [];
  books.forEach((book, bi) => {
    const bookDbId = bookIdMap[bi + 1];
    book.chapters.forEach((verses, ci) => {
      const chapterId = chapterIdMap[`${bookDbId}-${ci + 1}`];
      verses.forEach((text, vi) => {
        allVerses.push({ chapter_id: chapterId, number: vi + 1, text });
      });
    });
  });

  await upsertInBatches('bible_verses', allVerses);
  console.log(`  ✅ ${version.slug.toUpperCase()} importada com sucesso!`);
}

async function main() {
  console.log('🌱 Iniciando seed da Bíblia...\n');

  for (const version of VERSIONS) {
    await seedVersion(version);
  }

  console.log('\n🎉 Seed concluído!');
}

main().catch(err => {
  console.error('\n❌ Erro:', err.message);
  process.exit(1);
});
