create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  top_color text not null default '#5677ca',
  created_at timestamptz not null default now()
);

create table if not exists public.company_members (
  company_id uuid references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  primary key (company_id, user_id)
);

create table if not exists public.tips (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sequential_id integer not null,
  code text not null,
  description text not null,
  unit text not null,
  diameter numeric(12, 3),
  length numeric(12, 3),
  quantity numeric(12, 3) not null default 0,
  weight_kg numeric(12, 3) not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (company_id, sequential_id)
);
alter table public.tips add column if not exists status text not null default 'active';

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  description text not null,
  material_type text,
  steel_grade text,
  standard text,
  gauge text,
  diameter numeric(12, 3),
  thickness numeric(12, 3),
  standard_length numeric(12, 3),
  color text,
  unit text not null default 'un.',
  theoretical_weight numeric(12, 3),
  weight_per_meter numeric(12, 3),
  manufacturer text,
  supplier text,
  barcode text,
  qr_code text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  material_id uuid not null references public.materials(id),
  location_id uuid references public.locations(id),
  quantity numeric(12, 3) not null default 0,
  weight_kg numeric(12, 3) not null default 0,
  status text not null default 'normal' check (status in ('normal', 'attention', 'divergence', 'unidentified')),
  updated_at timestamptz not null default now(),
  unique (company_id, material_id, location_id)
);

create table if not exists public.rfid_tags (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tag_code text not null,
  barcode text,
  material_id uuid references public.materials(id),
  location_id uuid references public.locations(id),
  batch text,
  quantity numeric(12, 3) not null default 0,
  weight_kg numeric(12, 3) not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (company_id, tag_code)
);

create table if not exists public.inventories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  location_id uuid references public.locations(id),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'cancelled')),
  expected_tags integer not null default 0,
  read_tags integer not null default 0,
  missing_tags integer not null default 0,
  divergences integer not null default 0,
  accuracy numeric(5, 2),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  material_id uuid references public.materials(id),
  tag_id uuid references public.rfid_tags(id),
  movement_type text not null check (movement_type in ('entry', 'exit', 'transfer', 'writeoff', 'adjustment', 'inventory')),
  quantity numeric(12, 3) not null default 0,
  weight_kg numeric(12, 3) not null default 0,
  origin_location_id uuid references public.locations(id),
  destination_location_id uuid references public.locations(id),
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.stock_items add column if not exists lais text;
alter table public.stock_items add column if not exists corrida text;
alter table public.stock_items add column if not exists lote text;
alter table public.stock_items add column if not exists unit_cost numeric(12, 3) not null default 0;
alter table public.stock_items add column if not exists total_cost numeric(12, 3) not null default 0;
alter table public.stock_items add column if not exists standard_length numeric(12, 3);
alter table public.stock_items add column if not exists turnover text;
alter table public.stock_items add column if not exists entered_at timestamptz;
alter table public.stock_items add column if not exists last_movement_at timestamptz;

alter table public.stock_movements add column if not exists user_id uuid references auth.users(id);
alter table public.stock_movements add column if not exists note text;

create table if not exists public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  stock_item_id uuid not null references public.stock_items(id) on delete cascade,
  previous_quantity numeric(12, 3) not null default 0,
  new_quantity numeric(12, 3) not null default 0,
  reason text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.tips enable row level security;
alter table public.materials enable row level security;
alter table public.locations enable row level security;
alter table public.stock_items enable row level security;
alter table public.rfid_tags enable row level security;
alter table public.inventories enable row level security;
alter table public.stock_movements enable row level security;
alter table public.stock_adjustments enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_company_member(target_company uuid)
returns boolean language sql security definer set search_path = public
as $$ select exists (
  select 1 from public.company_members
  where company_id = target_company and user_id = auth.uid()
) $$;

create policy "members can read companies" on public.companies
for select using (public.is_company_member(id));

create policy "members can read memberships" on public.company_members
for select using (user_id = auth.uid());

create policy "members can read tips" on public.tips
for select using (public.is_company_member(company_id));

create policy "members can create tips" on public.tips
for insert with check (public.is_company_member(company_id) and created_by = auth.uid());

create policy "members can update tips" on public.tips
for update using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

create policy "members can read materials" on public.materials for select using (public.is_company_member(company_id));
create policy "members can manage materials" on public.materials for all using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "members can read locations" on public.locations for select using (public.is_company_member(company_id));
create policy "members can manage locations" on public.locations for all using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "members can read stock" on public.stock_items for select using (public.is_company_member(company_id));
create policy "members can manage stock" on public.stock_items for all using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "members can read rfid" on public.rfid_tags for select using (public.is_company_member(company_id));
create policy "members can manage rfid" on public.rfid_tags for all using (public.is_company_member(company_id)) with check (public.is_company_member(company_id));
create policy "members can read inventories" on public.inventories for select using (public.is_company_member(company_id));
create policy "members can create inventories" on public.inventories for insert with check (public.is_company_member(company_id));
create policy "members can read movements" on public.stock_movements for select using (public.is_company_member(company_id));
create policy "members can create movements" on public.stock_movements for insert with check (public.is_company_member(company_id));
create policy "members can read stock adjustments" on public.stock_adjustments for select using (public.is_company_member(company_id));
create policy "members can create stock adjustments" on public.stock_adjustments for insert with check (public.is_company_member(company_id) and created_by = auth.uid());
create policy "members can read audit logs" on public.audit_logs for select using (public.is_company_member(company_id));
