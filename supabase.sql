
-- =====================================================
-- ANGOLA LIFE 3D
-- PASSO 1 - BASE DE DADOS PERSISTENTE
-- Seguro para executar novamente: não apaga dados.
-- =====================================================

create extension if not exists pgcrypto;

-- =====================================================
-- 1. PERFIS EXISTENTES
-- =====================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique,
  province text not null default 'Luanda',
  money bigint not null default 2500,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- =====================================================
-- 2. CHAT GLOBAL EXISTENTE
-- =====================================================

create table if not exists public.world_chat (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.world_chat enable row level security;

-- Criar políticas básicas apenas se ainda não existirem.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd = 'SELECT'
  ) then
    create policy profiles_read_authenticated
      on public.profiles for select
      to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and cmd = 'INSERT'
  ) then
    create policy profiles_insert_own
      on public.profiles for insert
      to authenticated with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'world_chat'
      and cmd = 'SELECT'
  ) then
    create policy world_chat_read_authenticated
      on public.world_chat for select
      to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'world_chat'
      and cmd = 'INSERT'
  ) then
    create policy world_chat_insert_own
      on public.world_chat for insert
      to authenticated with check (auth.uid() = user_id);
  end if;
end $$;

grant select on public.profiles, public.world_chat to authenticated;
grant insert on public.world_chat to authenticated;
grant usage, select on sequence public.world_chat_id_seq to authenticated;

-- =====================================================
-- 3. ESTADO DO JOGADOR
-- =====================================================

create table if not exists public.player_state (
  player_id uuid primary key references auth.users(id) on delete cascade,
  health integer not null default 100 check (health between 0 and 100),
  energy integer not null default 100 check (energy between 0 and 100),
  hunger integer not null default 100 check (hunger between 0 and 100),
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  position_z double precision not null default 0,
  updated_at timestamptz not null default now()
);

-- =====================================================
-- 4. BANCO E MOVIMENTOS FINANCEIROS
-- =====================================================

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  bank_name text not null default 'Banco de Angola',
  account_number text not null unique
    default upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 12)),
  balance bigint not null default 0 check (balance >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.bank_accounts(id) on delete set null,
  transaction_type text not null,
  amount bigint not null check (amount > 0),
  description text,
  created_at timestamptz not null default now()
);

-- =====================================================
-- 5. VEÍCULOS DOS JOGADORES
-- =====================================================

create table if not exists public.owned_vehicles (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  vehicle_name text not null,
  vehicle_model text not null,
  color text not null default 'Branco',
  plate text unique,
  fuel numeric(5,2) not null default 100
    check (fuel between 0 and 100),
  health integer not null default 100
    check (health between 0 and 100),
  stored boolean not null default true,
  purchased_at timestamptz not null default now()
);

-- =====================================================
-- 6. CASAS E PROPRIEDADES
-- =====================================================

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  property_name text not null,
  property_type text not null default 'casa',
  location_name text not null,
  interior_data jsonb not null default '{}'::jsonb,
  is_rented boolean not null default false,
  rent_due_at timestamptz,
  purchased_at timestamptz not null default now()
);

-- =====================================================
-- 7. MÓVEIS E DECORAÇÃO
-- =====================================================

create table if not exists public.furniture_inventory (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references public.properties(id) on delete cascade,
  item_name text not null,
  item_type text not null,
  quantity integer not null default 1 check (quantity > 0),
  placed_data jsonb not null default '{}'::jsonb,
  purchased_at timestamptz not null default now()
);

-- =====================================================
-- 8. ROUPAS E ACESSÓRIOS
-- =====================================================

create table if not exists public.clothing_inventory (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  item_type text not null,
  color text,
  equipped boolean not null default false,
  purchased_at timestamptz not null default now()
);

-- =====================================================
-- 9. NEGÓCIOS E EMPREGADOS
-- =====================================================

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  business_type text not null,
  location_name text not null,
  balance bigint not null default 0 check (balance >= 0),
  is_open boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.business_employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  job_title text not null default 'Funcionário',
  salary bigint not null default 0 check (salary >= 0),
  hired_at timestamptz not null default now(),
  unique (business_id, player_id)
);

-- =====================================================
-- 10. IMPOSTOS
-- =====================================================

create table if not exists public.tax_records (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  tax_type text not null,
  amount bigint not null check (amount >= 0),
  payment_status text not null default 'pendente',
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- =====================================================
-- 11. FAMÍLIA E RELAÇÕES
-- =====================================================

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  related_player_id uuid references auth.users(id) on delete set null,
  member_name text not null,
  relationship text not null,
  created_at timestamptz not null default now()
);

-- =====================================================
-- 12. GRAVIDEZ E NASCIMENTOS NO JOGO
-- =====================================================

create table if not exists public.pregnancies (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  expected_birth_at timestamptz,
  status text not null default 'em_andamento'
);

-- =====================================================
-- 13. MISSÕES DIÁRIAS
-- =====================================================

create table if not exists public.daily_missions (
  id uuid primary key default gen_random_uuid(),
  mission_name text not null,
  description text not null,
  reward_money bigint not null default 0 check (reward_money >= 0),
  reward_xp integer not null default 0 check (reward_xp >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.player_missions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.daily_missions(id) on delete cascade,
  progress integer not null default 0 check (progress >= 0),
  completed boolean not null default false,
  claimed boolean not null default false,
  mission_date date not null default current_date,
  unique (player_id, mission_id, mission_date)
);

-- =====================================================
-- 14. PRESENTES E RECOMPENSAS
-- =====================================================

create table if not exists public.player_rewards (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  reward_name text not null,
  reward_type text not null,
  reward_data jsonb not null default '{}'::jsonb,
  claimed boolean not null default false,
  created_at timestamptz not null default now()
);

-- =====================================================
-- 15. CRIMES E POLÍCIA
-- =====================================================

create table if not exists public.crime_records (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  crime_type text not null,
  description text,
  location_name text,
  status text not null default 'registado',
  created_at timestamptz not null default now()
);

create table if not exists public.police_records (
  id uuid primary key default gen_random_uuid(),
  officer_id uuid references auth.users(id) on delete set null,
  suspect_id uuid references auth.users(id) on delete set null,
  record_type text not null,
  description text not null,
  location_name text,
  created_at timestamptz not null default now()
);

-- =====================================================
-- 16. EXPERIÊNCIA E NÍVEL
-- =====================================================

create table if not exists public.player_progress (
  player_id uuid primary key references auth.users(id) on delete cascade,
  experience integer not null default 0 check (experience >= 0),
  player_level integer not null default 1 check (player_level >= 1),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- 17. ÍNDICES
-- =====================================================

create index if not exists idx_vehicles_player
  on public.owned_vehicles(player_id);

create index if not exists idx_properties_owner
  on public.properties(owner_id);

create index if not exists idx_business_owner
  on public.businesses(owner_id);

create index if not exists idx_employees_player
  on public.business_employees(player_id);

create index if not exists idx_missions_player_date
  on public.player_missions(player_id, mission_date);

create index if not exists idx_rewards_player
  on public.player_rewards(player_id);

create index if not exists idx_bank_player
  on public.bank_accounts(player_id);

create index if not exists idx_transactions_player
  on public.bank_transactions(player_id);

create index if not exists idx_crimes_player
  on public.crime_records(player_id);

-- =====================================================
-- 18. SEGURANÇA RLS
-- =====================================================

alter table public.player_state enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.bank_transactions enable row level security;
alter table public.owned_vehicles enable row level security;
alter table public.properties enable row level security;
alter table public.furniture_inventory enable row level security;
alter table public.clothing_inventory enable row level security;
alter table public.businesses enable row level security;
alter table public.business_employees enable row level security;
alter table public.tax_records enable row level security;
alter table public.family_members enable row level security;
alter table public.pregnancies enable row level security;
alter table public.daily_missions enable row level security;
alter table public.player_missions enable row level security;
alter table public.player_rewards enable row level security;
alter table public.crime_records enable row level security;
alter table public.police_records enable row level security;
alter table public.player_progress enable row level security;

-- Políticas para dados privados pertencentes ao jogador.
do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('player_state', 'player_id'),
      ('bank_accounts', 'player_id'),
      ('bank_transactions', 'player_id'),
      ('owned_vehicles', 'player_id'),
      ('properties', 'owner_id'),
      ('furniture_inventory', 'player_id'),
      ('clothing_inventory', 'player_id'),
      ('business_employees', 'player_id'),
      ('tax_records', 'player_id'),
      ('family_members', 'player_id'),
      ('pregnancies', 'player_id'),
      ('player_missions', 'player_id'),
      ('player_rewards', 'player_id'),
      ('crime_records', 'player_id'),
      ('player_progress', 'player_id')
    ) as policies(table_name, owner_column)
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = item.table_name
        and policyname = item.table_name || '_read_own'
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (%I = auth.uid())',
        item.table_name || '_read_own',
        item.table_name,
        item.owner_column
      );
    end if;
  end loop;
end $$;

-- Negócios visíveis na cidade.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'businesses'
      and policyname = 'businesses_read_city'
  ) then
    create policy businesses_read_city
      on public.businesses for select
      to authenticated using (true);
  end if;
end $$;

-- Missões ativas visíveis a todos os jogadores.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'daily_missions'
      and policyname = 'daily_missions_read_active'
  ) then
    create policy daily_missions_read_active
      on public.daily_missions for select
      to authenticated using (active = true);
  end if;
end $$;

-- Registos policiais visíveis ao agente e ao suspeito envolvidos.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'police_records'
      and policyname = 'police_records_read_involved'
  ) then
    create policy police_records_read_involved
      on public.police_records for select
      to authenticated
      using (officer_id = auth.uid() or suspect_id = auth.uid());
  end if;
end $$;

-- =====================================================
-- 19. PERMISSÕES
-- =====================================================

grant select on
  public.player_state,
  public.bank_accounts,
  public.bank_transactions,
  public.owned_vehicles,
  public.properties,
  public.furniture_inventory,
  public.clothing_inventory,
  public.businesses,
  public.business_employees,
  public.tax_records,
  public.family_members,
  public.pregnancies,
  public.daily_missions,
  public.player_missions,
  public.player_rewards,
  public.crime_records,
  public.police_records,
  public.player_progress
to authenticated;

-- Bloquear alterações diretas a dados importantes.
-- As compras, pagamentos e recompensas serão ligados
-- posteriormente através de operações seguras no servidor.

revoke insert, update, delete on
  public.bank_accounts,
  public.bank_transactions,
  public.owned_vehicles,
  public.properties,
  public.furniture_inventory,
  public.clothing_inventory,
  public.businesses,
  public.business_employees,
  public.tax_records,
  public.family_members,
  public.pregnancies,
  public.daily_missions,
  public.player_missions,
  public.player_rewards,
  public.crime_records,
  public.police_records
from anon, authenticated;

revoke insert, update, delete on
  public.player_state,
  public.player_progress
from anon, authenticated;

-- FIM DO PASSO 1
