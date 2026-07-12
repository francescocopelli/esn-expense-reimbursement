-- ============================================================
-- ESN Expense Reimbursement System — Initial Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES TABLE
-- Extends Supabase auth.users with ESN-specific fields
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  section text not null,
  role text not null default 'member' check (role in ('member', 'board')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- EXPENSE REQUESTS TABLE
-- ============================================================
create table public.expense_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  event_name text not null,
  category text not null check (category in ('Trasporti', 'Catering', 'Materiali', 'Alloggio', 'Altro')),
  amount numeric(10, 2) not null check (amount > 0),
  description text,
  receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  board_note text,
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger on_expense_requests_updated
  before update on public.expense_requests
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, section, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Utente ESN'),
    coalesce(new.raw_user_meta_data->>'section', 'ESN Pisa'),
    coalesce(new.raw_user_meta_data->>'role', 'member')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.expense_requests enable row level security;

-- Profiles: users can read/update their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Board can read all profiles
create policy "profiles_select_board" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'board'
    )
  );

-- Expense requests: members see only their own
create policy "requests_select_own" on public.expense_requests
  for select using (auth.uid() = user_id);

create policy "requests_insert_own" on public.expense_requests
  for insert with check (auth.uid() = user_id);

-- Board can read and update all requests
create policy "requests_select_board" on public.expense_requests
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'board'
    )
  );

create policy "requests_update_board" on public.expense_requests
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'board'
    )
  );

-- ============================================================
-- STORAGE BUCKET (run separately or via Supabase dashboard)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('receipts', 'receipts', true);
--
-- create policy "receipts_upload_auth" on storage.objects
--   for insert with check (bucket_id = 'receipts' and auth.role() = 'authenticated');
--
-- create policy "receipts_select_public" on storage.objects
--   for select using (bucket_id = 'receipts');
