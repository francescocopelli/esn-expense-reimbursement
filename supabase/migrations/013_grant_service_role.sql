-- ============================================================
-- Migration 013: GRANT service_role full access to app tables
-- ============================================================
-- Root cause of "permission denied for table expense_reports":
--
-- PostgREST does NOT execute queries as the Postgres superuser.
-- When the service_role JWT is used, PostgREST switches to the
-- "service_role" Postgres role. That role still needs explicit
-- SQL GRANTs on each table — bypassing RLS is not enough.
--
-- Previous migrations only granted to "authenticated", leaving
-- service_role without any table-level privilege → permission denied.
-- ============================================================

grant usage on schema public to service_role;

-- Core app tables
grant all on public.expense_reports          to service_role;
grant all on public.expense_items            to service_role;
grant all on public.profiles                 to service_role;

-- Projects (added in 20260713_projects.sql)
grant all on public.projects                 to service_role;
grant all on public.project_supervisors      to service_role;
grant all on public.project_allowed_categories to service_role;

-- Supporting tables
grant all on public.expense_categories       to service_role;

-- Sequences
grant usage, select on sequence public.expense_report_seq to service_role;

-- Verify
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'service_role'
  and table_schema = 'public'
order by table_name, privilege_type;
