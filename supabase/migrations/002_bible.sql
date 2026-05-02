-- ============================================================
-- Migration 002: Bíblia — versões, livros, capítulos e versículos
-- ============================================================

-- Versões disponíveis
create table if not exists public.bible_versions (
  id        serial primary key,
  slug      text unique not null,   -- ex: 'arc', 'ara', 'acf'
  name      text not null,          -- ex: 'Almeida Revista e Corrigida'
  language  text not null default 'pt-BR'
);

-- Livros da Bíblia
create table if not exists public.bible_books (
  id          serial primary key,
  version_id  int not null references public.bible_versions (id) on delete cascade,
  number      smallint not null,     -- 1-66
  name        text not null,         -- ex: 'Gênesis'
  abbrev      text not null,         -- ex: 'Gn'
  testament   char(2) not null check (testament in ('OT', 'NT')),
  unique (version_id, number)
);

create index if not exists bible_books_version_idx on public.bible_books (version_id);

-- Capítulos
create table if not exists public.bible_chapters (
  id       serial primary key,
  book_id  int not null references public.bible_books (id) on delete cascade,
  number   smallint not null,
  unique (book_id, number)
);

create index if not exists bible_chapters_book_idx on public.bible_chapters (book_id);

-- Versículos
create table if not exists public.bible_verses (
  id             serial primary key,
  chapter_id     int not null references public.bible_chapters (id) on delete cascade,
  number         smallint not null,
  text           text not null,
  search_vector  tsvector generated always as (
                   to_tsvector('portuguese', text)
                 ) stored,
  unique (chapter_id, number)
);

create index if not exists bible_verses_chapter_idx  on public.bible_verses (chapter_id);
create index if not exists bible_verses_search_idx   on public.bible_verses using gin (search_vector);

-- RLS: Bíblia é pública (somente leitura)
alter table public.bible_versions enable row level security;
alter table public.bible_books    enable row level security;
alter table public.bible_chapters enable row level security;
alter table public.bible_verses   enable row level security;

create policy "Bíblia pública — leitura"
  on public.bible_versions for select using (true);

create policy "Livros públicos — leitura"
  on public.bible_books for select using (true);

create policy "Capítulos públicos — leitura"
  on public.bible_chapters for select using (true);

create policy "Versículos públicos — leitura"
  on public.bible_verses for select using (true);

-- Função de busca full-text
create or replace function public.search_verses(
  query_text   text,
  version_slug text default 'arc',
  max_results  int  default 30
)
returns table (
  verse_id      int,
  chapter_id    int,
  verse_number  smallint,
  verse_text    text,
  chapter_num   smallint,
  book_name     text,
  book_abbrev   text,
  book_number   smallint,
  testament     char(2),
  rank          real
)
language sql stable as $$
  select
    v.id,
    v.chapter_id,
    v.number,
    v.text,
    c.number,
    b.name,
    b.abbrev,
    b.number,
    b.testament,
    ts_rank(v.search_vector, websearch_to_tsquery('portuguese', query_text)) as rank
  from public.bible_verses v
  join public.bible_chapters c  on c.id = v.chapter_id
  join public.bible_books b     on b.id = c.book_id
  join public.bible_versions bv on bv.id = b.version_id
  where
    bv.slug = version_slug
    and v.search_vector @@ websearch_to_tsquery('portuguese', query_text)
  order by rank desc
  limit max_results;
$$;
