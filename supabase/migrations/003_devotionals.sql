-- ============================================================
-- Migration 003: Devocionais, Bookmarks e Destaques
-- ============================================================

-- Devocionais
create table if not exists public.devotionals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  title       text not null,
  content     text not null,
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists devotionals_user_idx      on public.devotionals (user_id);
create index if not exists devotionals_public_idx    on public.devotionals (is_public, created_at desc);

create trigger devotionals_updated_at
  before update on public.devotionals
  for each row execute function public.set_updated_at();

-- Tags de devocionais
create table if not exists public.devotional_tags (
  devotional_id  uuid not null references public.devotionals (id) on delete cascade,
  tag            text not null,
  primary key (devotional_id, tag)
);

-- Versículos vinculados ao devocional (N:N)
create table if not exists public.devotional_verses (
  devotional_id  uuid not null references public.devotionals (id) on delete cascade,
  verse_id       int  not null references public.bible_verses (id) on delete cascade,
  primary key (devotional_id, verse_id)
);

-- Bookmarks (favoritos)
create table if not exists public.bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  verse_id    int  not null references public.bible_verses (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, verse_id)
);

create index if not exists bookmarks_user_idx on public.bookmarks (user_id);

-- Destaques de versículos
create table if not exists public.highlights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  verse_id    int  not null references public.bible_verses (id) on delete cascade,
  color       text not null default '#FDE68A',  -- amarelo padrão
  note        text,
  created_at  timestamptz not null default now(),
  unique (user_id, verse_id)
);

create index if not exists highlights_user_idx on public.highlights (user_id);

-- RLS
alter table public.devotionals      enable row level security;
alter table public.devotional_tags  enable row level security;
alter table public.devotional_verses enable row level security;
alter table public.bookmarks        enable row level security;
alter table public.highlights       enable row level security;

-- Devocionais: público pode ver os públicos; dono vê todos os seus
create policy "Devocionais públicos visíveis"
  on public.devotionals for select
  using (is_public = true or auth.uid() = user_id);

create policy "Dono cria devocional"
  on public.devotionals for insert
  with check (auth.uid() = user_id);

create policy "Dono edita devocional"
  on public.devotionals for update
  using (auth.uid() = user_id);

create policy "Dono exclui devocional"
  on public.devotionals for delete
  using (auth.uid() = user_id);

-- Tags: herdadas do devocional
create policy "Tags visíveis conforme devocional"
  on public.devotional_tags for select
  using (
    exists (
      select 1 from public.devotionals d
      where d.id = devotional_id
        and (d.is_public = true or d.user_id = auth.uid())
    )
  );

create policy "Dono gerencia tags"
  on public.devotional_tags for all
  using (
    exists (
      select 1 from public.devotionals d
      where d.id = devotional_id and d.user_id = auth.uid()
    )
  );

-- Versículos do devocional
create policy "Verses visíveis conforme devocional"
  on public.devotional_verses for select
  using (
    exists (
      select 1 from public.devotionals d
      where d.id = devotional_id
        and (d.is_public = true or d.user_id = auth.uid())
    )
  );

create policy "Dono gerencia verses do devocional"
  on public.devotional_verses for all
  using (
    exists (
      select 1 from public.devotionals d
      where d.id = devotional_id and d.user_id = auth.uid()
    )
  );

-- Bookmarks: privados
create policy "Bookmarks do próprio usuário"
  on public.bookmarks for all
  using (auth.uid() = user_id);

-- Highlights: privados
create policy "Destaques do próprio usuário"
  on public.highlights for all
  using (auth.uid() = user_id);
