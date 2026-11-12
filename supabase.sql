
-- ANGOLA LIFE 3D
-- PASSO 1: Base de dados persistente
-- Este script acrescenta tabelas. Não apaga perfis nem mensagens existentes.

create extension if not exists pgcrypto;

-- 1. PERFIL E ESTADO DO JOGADOR
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

-- 2. CONTAS BANCÁRIAS
create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  bank_name text not null default 'Banco de Angola',
  account_number text not null unique default upper(substr(encode(gen_random_bytes(8),'hex'),1,12)),
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

-- 3. VEÍCULOS
create table if not exists public.owned_vehicles (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  vehicle_name text not null,
  vehicle_model text not null,
  color text not null default 'Branco',
  plate text unique,
  fuel numeric(5,2) not null default 100 check (fuel between 0 and 100),
  health integer not null default 100 check (health between 0 and 100),
  stored boolean not null default true,
  purchased_at timestamptz not null default now()
);

-- 4. CASAS E PROPRIEDADES
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

-- 5. MÓVEIS E DECORAÇÃO
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

-- 6. ROUPAS E ACESSÓRIOS
create table if not exists public.clothing_inventory (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  item_type text not null,
  color text,
  equipped boolean not null default false,
  purchased_at timestamptz not null default now()
);

-- 7. NEGÓCIOS E FUNCIONÁRIOS
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

-- 8. IMPOSTOS E PAGAMENTOS
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

-- 9. FAMÍLIA E RELAÇÕES
create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  related_player_id uuid references auth.users(id) on delete set null,
  member_name text not null,
  relationship text not null,
  created_at timestamptz not null default now()
);

-- 10. GRAVIDEZ E NASCIMENTOS NO JOGO
create table if not exists public.pregnancies (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  partner_id uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  expected_birth_at timestamptz,
  status text not null default 'em_andamento'
);

-- 11. MISSÕES DIÁRIAS
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

-- 12. PRESENTES E RECOMPENSAS
create table if not exists public.player_rewards (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references auth.users(id) on delete cascade,
  reward_name text not null,
  reward_type text not null,
  reward_data jsonb not null default '{}'::jsonb,
  claimed boolean not null default false,
  created_at timestamptz not null default now()
);

-- 13. CRIMES E OCORRÊNCIAS POLICIAIS
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

-- 14. EXPERIÊNCIA E NÍVEL
create table if not exists public.player_progress (
  player_id uuid primary key references auth.users(id) on delete cascade,
  experience integer not null default 0 check (experience >= 0),
  player_level integer not null default 1 check (player_level >= 1),
  updated_at timestamptz not null default now()
);

-- ÍNDICES PARA PESQUISAS MAIS RÁPIDAS
create index if not exists idx_vehicles_player on public.owned_vehicles(player_id);
create index if not exists idx_properties_owner on public.properties(owner_id);
create index if not exists idx_business_owner on public.businesses(owner_id);
create index if not exists idx_employees_player on public.business_employees(player_id);
create index if not exists idx_missions_player_date on public.player_missions(player_id, mission_date);
create index if not exists idx_rewards_player on public.player_rewards(player_id);
create index if not exists idx_bank_player on public.bank_accounts(player_id);
create index if not exists idx_crimes_player on public.crime_records(player_id);

-- SEGURANÇA: ativar RLS nas tabelas privadas
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

-- Políticas de leitura: cada jogador só consulta os seus dados privados.
do $$
declare
  t text;
begin
  foreach t in array array[
    'player_state','bank_accounts','bank_transactions','owned_vehicles',
    'properties','furniture_inventory','clothing_inventory',
    'business_employees','tax_records','family_members','pregnancies',
    'player_missions','player_rewards','crime_records','player_progress'
  ]
  loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = t
        and policyname = t || '_read_own'
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (player_id = auth.uid())',
        t || '_read_own', t
      );
    end if;
  end loop;
end $$;

-- Propriedades: o dono consulta as suas casas.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='properties' and policyname='properties_read_own') then
    create policy properties_read_own on public.properties
      for select to authenticated using (owner_id = auth.uid());
  end if;
end $$;

-- Negócios: os jogadores autenticados podem consultar negócios da cidade.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='businesses' and policyname='businesses_read_city') then
    create policy businesses_read_city on public.businesses
      for select to authenticated using (true);
  end if;
end $$;

-- Missões disponíveis para todos os jogadores autenticados.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='daily_missions' and policyname='daily_missions_read_active') then
    create policy daily_missions_read_active on public.daily_missions
      for select to authenticated using (active = true);
  end if;
end $$;

-- Funcionários podem consultar os próprios contratos.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='business_employees' and policyname='employees_read_own') then
    create policy employees_read_own on public.business_employees
      for select to authenticated using (player_id = auth.uid());
  end if;
end $$;

-- Permissões de leitura para jogadores autenticados.
grant select on public.player_state, public.bank_accounts,
  public.bank_transactions, public.owned_vehicles, public.properties,
  public.furniture_inventory, public.clothing_inventory, public.businesses,
  public.business_employees, public.tax_records, public.family_members,
  public.pregnancies, public.daily_missions, public.player_missions,
  public.player_rewards, public.crime_records, public.police_records,
  public.player_progress to authenticated;

-- Não permitir alterações diretas aos saldos, veículos, casas ou recompensas.
-- As operações financeiras e compras serão feitas por funções seguras no próximo passo.
revoke insert, update, delete on public.bank_accounts,
  public.bank_transactions, public.owned_vehicles, public.properties,
  public.furniture_inventory, public.clothing_inventory, public.businesses,
  public.business_employees, public.tax_records, public.family_members,
  public.pregnancies, public.daily_missions, public.player_missions,
  public.player_rewards, public.crime_records, public.police_records
  from anon, authenticated;

-- O estado e a experiência também serão atualizados por funções controladas.
revoke insert, update, delete on public.player_state, public.player_progress
  from anon, authenticated;

