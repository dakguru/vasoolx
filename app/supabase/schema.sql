-- ============================================================
-- VasoolX — Supabase schema, RLS, and helpers
-- Run in the Supabase SQL editor (or via `supabase db push`).
-- Auth: Email + Password (Supabase Auth). Phone is stored as data only.
-- ============================================================

-- ---------- Enums ----------
create type loan_type as enum ('daily', 'weekly', 'monthly');
create type payment_method as enum ('cash', 'online', 'bank');
create type loan_status as enum ('active', 'closed', 'bad');
create type access_type as enum ('agent', 'partner');
create type member_status as enum ('pending', 'active');

-- ---------- Profiles (1:1 with auth.users) ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  locale text not null default 'en',
  theme text not null default 'system',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Lines ----------
create table public.lines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  name text not null,
  loan_type loan_type not null default 'daily',
  interest_rate numeric not null default 0,
  processing_fees numeric not null default 0,
  installments_period int not null default 30,
  bad_loan_days int not null default 15,
  close_loan_manually boolean not null default false,
  enable_customer_number boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Line members (team access) ----------
create table public.line_members (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.lines on delete cascade,
  user_id uuid references auth.users on delete cascade,
  phone text not null,
  name text not null default '',
  access_type access_type not null default 'agent',
  status member_status not null default 'pending',
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Areas ----------
create table public.areas (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.lines on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- ---------- Customers ----------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.lines on delete cascade,
  area_id uuid references public.areas on delete set null,
  name text not null,
  phone text not null default '',
  sort_order int not null default 0,
  address text not null default '',
  notes text not null default '',
  photo_url text,
  created_at timestamptz not null default now()
);

-- ---------- Loans ----------
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers on delete cascade,
  line_id uuid not null references public.lines on delete cascade,
  principal numeric not null,
  disbursed numeric not null,
  type loan_type not null default 'daily',
  installment_amount numeric not null,
  installments int not null,
  start_date date not null default current_date,
  status loan_status not null default 'active',
  created_at timestamptz not null default now()
);

-- ---------- Payments ----------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references public.loans on delete cascade,
  customer_id uuid not null references public.customers on delete cascade,
  line_id uuid not null references public.lines on delete cascade,
  amount numeric not null,
  date date not null default current_date,
  method payment_method not null default 'cash',
  note text not null default '',
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);

-- ---------- Investments ----------
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.lines on delete cascade,
  type text not null,
  amount numeric not null,
  method payment_method not null default 'cash',
  date date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now()
);

-- ---------- Expenses ----------
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  line_id uuid not null references public.lines on delete cascade,
  type text not null,
  amount numeric not null,
  method payment_method not null default 'cash',
  date date not null default current_date,
  note text not null default '',
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Helper: can the current user access a line? (owner or active member)
-- ============================================================
create or replace function public.can_access_line(l_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.lines l where l.id = l_id and l.owner_id = auth.uid()
  ) or exists (
    select 1 from public.line_members m
    where m.line_id = l_id and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function public.owns_line(l_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.lines l where l.id = l_id and l.owner_id = auth.uid()
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.lines enable row level security;
alter table public.line_members enable row level security;
alter table public.areas enable row level security;
alter table public.customers enable row level security;
alter table public.loans enable row level security;
alter table public.payments enable row level security;
alter table public.investments enable row level security;
alter table public.expenses enable row level security;

-- Profiles: user manages own row
create policy "profiles self" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- Lines: owner full; members read
create policy "lines read" on public.lines
  for select using (can_access_line(id));
create policy "lines owner write" on public.lines
  for insert with check (owner_id = auth.uid());
create policy "lines owner update" on public.lines
  for update using (owner_id = auth.uid());
create policy "lines owner delete" on public.lines
  for delete using (owner_id = auth.uid());

-- Generic per-line child tables: read if can access, write if owner
-- (agents' write rules for customers/loans/payments handled in app + can be
--  refined with permission jsonb; kept owner-write here for safety.)
create policy "line_members access" on public.line_members
  for select using (can_access_line(line_id) or user_id = auth.uid());
create policy "line_members owner write" on public.line_members
  for all using (owns_line(line_id)) with check (owns_line(line_id));

create policy "areas access" on public.areas
  for select using (can_access_line(line_id));
create policy "areas write" on public.areas
  for all using (owns_line(line_id)) with check (owns_line(line_id));

create policy "customers access" on public.customers
  for select using (can_access_line(line_id));
create policy "customers write" on public.customers
  for all using (can_access_line(line_id)) with check (can_access_line(line_id));

create policy "loans access" on public.loans
  for select using (can_access_line(line_id));
create policy "loans write" on public.loans
  for all using (can_access_line(line_id)) with check (can_access_line(line_id));

create policy "payments access" on public.payments
  for select using (can_access_line(line_id));
create policy "payments write" on public.payments
  for all using (can_access_line(line_id)) with check (can_access_line(line_id));

-- Investments: owners only (agents cannot view/add)
create policy "investments owner" on public.investments
  for all using (owns_line(line_id)) with check (owns_line(line_id));

-- Expenses: any member can add; read own or owner reads all
create policy "expenses access" on public.expenses
  for select using (owns_line(line_id) or created_by = auth.uid());
create policy "expenses insert" on public.expenses
  for insert with check (can_access_line(line_id));
create policy "expenses owner modify" on public.expenses
  for update using (owns_line(line_id));
create policy "expenses owner delete" on public.expenses
  for delete using (owns_line(line_id));

-- ---------- Storage bucket for customer photos ----------
insert into storage.buckets (id, name, public)
values ('customer-photos', 'customer-photos', true)
on conflict (id) do nothing;

-- ---------- Helpful indexes ----------
create index on public.customers (line_id);
create index on public.loans (line_id, status);
create index on public.payments (line_id, date);
create index on public.investments (line_id, date);
create index on public.expenses (line_id, date);
