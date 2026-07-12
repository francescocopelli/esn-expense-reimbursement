-- Projects feature migration
-- Run this in Supabase SQL Editor

-- 1. Projects table
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  budget      numeric(10,2),
  is_active   boolean not null default true,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Project supervisors (any user can be supervisor, not just board)
create table if not exists public.project_supervisors (
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- 3. Allowed categories per project (if empty = all global categories allowed)
create table if not exists public.project_allowed_categories (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  category_name text not null,
  max_amount   numeric(10,2),
  unique(project_id, category_name)
);

-- 4. Add project_id to expense_reports (nullable = standard reimbursement)
alter table public.expense_reports
  add column if not exists project_id uuid references public.projects(id) on delete set null;

-- 5. RLS policies
alter table public.projects enable row level security;
alter table public.project_supervisors enable row level security;
alter table public.project_allowed_categories enable row level security;

-- Projects: readable by all authenticated users
create policy "projects_select" on public.projects
  for select to authenticated using (true);

-- Projects: insert/update/delete by board and admin
create policy "projects_insert" on public.projects
  for insert to authenticated
  with check (
    (select role from public.profiles where id = auth.uid()) in ('board','admin')
  );
create policy "projects_update" on public.projects
  for update to authenticated
  using (
    (select role from public.profiles where id = auth.uid()) in ('board','admin')
  );
create policy "projects_delete" on public.projects
  for delete to authenticated
  using (
    (select role from public.profiles where id = auth.uid()) in ('board','admin')
  );

-- project_supervisors: readable by all, writable by board+admin
create policy "ps_select" on public.project_supervisors for select to authenticated using (true);
create policy "ps_insert" on public.project_supervisors for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) in ('board','admin'));
create policy "ps_delete" on public.project_supervisors for delete to authenticated
  using ((select role from public.profiles where id = auth.uid()) in ('board','admin'));

-- project_allowed_categories: readable by all, writable by board+admin
create policy "pac_select" on public.project_allowed_categories for select to authenticated using (true);
create policy "pac_insert" on public.project_allowed_categories for insert to authenticated
  with check ((select role from public.profiles where id = auth.uid()) in ('board','admin'));
create policy "pac_update" on public.project_allowed_categories for update to authenticated
  using ((select role from public.profiles where id = auth.uid()) in ('board','admin'));
create policy "pac_delete" on public.project_allowed_categories for delete to authenticated
  using ((select role from public.profiles where id = auth.uid()) in ('board','admin'));

-- Trigger: update updated_at on projects
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
