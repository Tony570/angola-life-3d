-- Executar no SQL Editor do teu projecto Supabase.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 2 and 18),
  province text not null default 'Luanda',
  money bigint not null default 2500,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles are readable by authenticated players" on public.profiles for select to authenticated using (true);
create policy "players create own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "players update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.world_chat (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  message text not null check (char_length(message) between 1 and 180),
  created_at timestamptz not null default now()
);
alter table public.world_chat enable row level security;
create policy "authenticated players read chat" on public.world_chat for select to authenticated using (true);
create policy "players send own chat" on public.world_chat for insert to authenticated with check (auth.uid() = user_id);

-- Activar Realtime para world_chat no painel Supabase, se quiseres persistir mensagens.
