-- ============================================================
-- Migration 004: Cards / Stories para redes sociais
-- ============================================================

create table if not exists public.cards (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  -- URL da imagem exportada no Supabase Storage
  image_url        text,
  -- Configuração completa do template em JSON:
  -- { background, textBlocks[], fontFamily, format, filters, ... }
  template_config  jsonb not null default '{}',
  -- Versículo de origem (opcional)
  verse_id         int references public.bible_verses (id) on delete set null,
  -- Devocional de origem (opcional)
  devotional_id    uuid references public.devotionals (id) on delete set null,
  -- Formato: 'story' (9×16), 'square' (1×1), 'portrait' (4×5)
  format           text not null default 'story' check (format in ('story','square','portrait')),
  is_public        boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists cards_user_idx on public.cards (user_id, created_at desc);

-- RLS
alter table public.cards enable row level security;

create policy "Cards públicos visíveis"
  on public.cards for select
  using (is_public = true or auth.uid() = user_id);

create policy "Dono cria card"
  on public.cards for insert
  with check (auth.uid() = user_id);

create policy "Dono edita card"
  on public.cards for update
  using (auth.uid() = user_id);

create policy "Dono exclui card"
  on public.cards for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Planos de leitura (Fase 2 — estrutura preparada)
-- ============================================================

create table if not exists public.reading_plans (
  id           serial primary key,
  name         text not null,
  description  text,
  total_days   smallint not null,
  is_active    boolean not null default true
);

create table if not exists public.reading_plan_days (
  id          serial primary key,
  plan_id     int not null references public.reading_plans (id) on delete cascade,
  day_number  smallint not null,
  unique (plan_id, day_number)
);

create table if not exists public.reading_plan_day_ranges (
  id              serial primary key,
  plan_day_id     int not null references public.reading_plan_days (id) on delete cascade,
  book_abbrev     text not null,
  chapter_start   smallint not null,
  chapter_end     smallint not null
);

create table if not exists public.user_reading_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  plan_id      int  not null references public.reading_plans (id) on delete cascade,
  day_number   smallint not null,
  completed_at timestamptz,
  unique (user_id, plan_id, day_number)
);

alter table public.reading_plans             enable row level security;
alter table public.reading_plan_days         enable row level security;
alter table public.reading_plan_day_ranges   enable row level security;
alter table public.user_reading_progress     enable row level security;

create policy "Planos públicos visíveis"
  on public.reading_plans for select using (true);

create policy "Dias dos planos visíveis"
  on public.reading_plan_days for select using (true);

create policy "Ranges dos planos visíveis"
  on public.reading_plan_day_ranges for select using (true);

create policy "Progresso do próprio usuário"
  on public.user_reading_progress for all
  using (auth.uid() = user_id);
