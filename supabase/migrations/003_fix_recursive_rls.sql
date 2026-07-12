-- ============================================================
-- FIX: remove recursive RLS on profiles/expense_requests
-- The previous board policies queried public.profiles from inside
-- a policy on public.profiles, causing: infinite recursion detected
-- ============================================================

create or replace function public.is_board_member(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = uid and role = 'board'
  );
$$;

revoke all on function public.is_board_member(uuid) from public;
grant execute on function public.is_board_member(uuid) to authenticated;

drop policy if exists "profiles_select_board" on public.profiles;
drop policy if exists "requests_select_board" on public.expense_requests;
drop policy if exists "requests_update_board" on public.expense_requests;

create policy "profiles_select_board"
  on public.profiles
  for select
  using (public.is_board_member(auth.uid()));

create policy "requests_select_board"
  on public.expense_requests
  for select
  using (public.is_board_member(auth.uid()));

create policy "requests_update_board"
  on public.expense_requests
  for update
  using (public.is_board_member(auth.uid()));
