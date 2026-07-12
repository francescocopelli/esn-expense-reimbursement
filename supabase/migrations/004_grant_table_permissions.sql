-- ============================================================
-- FIX: grant table permissions required by PostgREST before RLS
-- RLS policies are not enough: authenticated users also need SQL grants
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.expense_requests to authenticated;

-- Optional hardening: anon should not access app tables directly
revoke all on public.profiles from anon;
revoke all on public.expense_requests from anon;
