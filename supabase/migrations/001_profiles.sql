-- ============================================================
-- Migration 001: Profiles
-- Extensão da tabela auth.users do Supabase Auth
-- ============================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique not null,
  full_name   text,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Índice para busca por username
create index if not exists profiles_username_idx on public.profiles (username);

-- Trigger: atualiza updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Trigger: cria perfil automaticamente após cadastro no Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS (Row Level Security)
alter table public.profiles enable row level security;

create policy "Perfis públicos visíveis para todos"
  on public.profiles for select
  using (true);

create policy "Usuário pode atualizar próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);
