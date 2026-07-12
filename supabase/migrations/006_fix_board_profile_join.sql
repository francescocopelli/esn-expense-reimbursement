-- ============================================================
-- FIX: board cannot see profiles when joining from expense_requests
-- Root cause: PostgREST FK joins evaluate RLS per-row as the row owner,
-- so the board's profiles_select_board policy is never triggered
-- for profiles referenced by OTHER users' requests.
-- ============================================================

-- 1. Ensure is_board_member is executable by authenticated users
grant execute on function public.is_board_member(uuid) to authenticated;

-- 2. Drop and recreate the board profile select policy (idempotent)
drop policy if exists "profiles_select_board" on public.profiles;

create policy "profiles_select_board"
  on public.profiles
  for select
  using (public.is_board_member(auth.uid()));

-- 3. Add explicit policy allowing board to read profiles that appear
--    as user_id or reviewed_by in ANY expense_request they can already see.
--    This covers the PostgREST lateral/FK join path.
drop policy if exists "profiles_select_via_expense_request" on public.profiles;

create policy "profiles_select_via_expense_request"
  on public.profiles
  for select
  using (
    public.is_board_member(auth.uid())
    and (
      exists (
        select 1 from public.expense_requests er
        where er.user_id = profiles.id
           or er.reviewed_by = profiles.id
      )
    )
  );
