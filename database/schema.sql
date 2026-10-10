-- StockShield schema for Supabase. Run in: Supabase Dashboard > SQL Editor > New query > Run.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z0-9][A-Z0-9.\-:^]{0,19}$'),
  company_name text, exchange text,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);
create index if not exists watchlist_user_idx on public.watchlist(user_id);

create table if not exists public.portfolio_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null check (symbol ~ '^[A-Z0-9][A-Z0-9.\-:^]{0,19}$'),
  company_name text, exchange text,
  purchase_date date not null check (purchase_date <= current_date),
  purchase_price numeric(18,4) not null check (purchase_price > 0),
  quantity numeric(18,6) not null check (quantity > 0),
  transaction_costs numeric(18,4) not null default 0 check (transaction_costs >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists holdings_user_idx on public.portfolio_holdings(user_id);

create table if not exists public.saved_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null, company_name text,
  analysis_period text not null check (analysis_period in ('1m','3m','6m','1y','5y')),
  report_data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists reports_user_idx on public.saved_reports(user_id, created_at desc);

-- keep updated_at fresh
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists profiles_updated on public.profiles;
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists holdings_updated on public.portfolio_holdings;
create trigger holdings_updated before update on public.portfolio_holdings for each row execute function public.set_updated_at();

-- create a profile automatically when a user signs up
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, left(new.raw_user_meta_data->>'display_name', 60))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Row Level Security: a user can only touch rows whose owner is their own authenticated id
alter table public.profiles enable row level security;
alter table public.watchlist enable row level security;
alter table public.portfolio_holdings enable row level security;
alter table public.saved_reports enable row level security;

create policy "profiles_select_own" on public.profiles for select using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "watchlist_select_own" on public.watchlist for select using ((select auth.uid()) = user_id);
create policy "watchlist_insert_own" on public.watchlist for insert with check ((select auth.uid()) = user_id);
create policy "watchlist_delete_own" on public.watchlist for delete using ((select auth.uid()) = user_id);

create policy "holdings_select_own" on public.portfolio_holdings for select using ((select auth.uid()) = user_id);
create policy "holdings_insert_own" on public.portfolio_holdings for insert with check ((select auth.uid()) = user_id);
create policy "holdings_update_own" on public.portfolio_holdings for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "holdings_delete_own" on public.portfolio_holdings for delete using ((select auth.uid()) = user_id);

create policy "reports_select_own" on public.saved_reports for select using ((select auth.uid()) = user_id);
create policy "reports_insert_own" on public.saved_reports for insert with check ((select auth.uid()) = user_id);
create policy "reports_delete_own" on public.saved_reports for delete using ((select auth.uid()) = user_id);
