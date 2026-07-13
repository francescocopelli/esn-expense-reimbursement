-- =============================================================
-- FIX: expense_reports RLS for service_role
-- =============================================================
-- Run this in Supabase SQL Editor if ReviewPage still gets
-- "permission denied for table expense_reports" despite using
-- the service_role key (adminClient).
--
-- Background:
--   Normally the service_role bypasses RLS automatically.
--   The exception is when the table has FORCE ROW LEVEL SECURITY,
--   which applies RLS even to the service_role.
-- =============================================================

-- Step 1: Check current state (run this SELECT first and read the output)
SELECT
  relname           AS table_name,
  relrowsecurity    AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname IN ('expense_reports', 'expense_items')
  AND relnamespace = 'public'::regnamespace;

-- Step 2a: If relforcerowsecurity = true, remove FORCE:
-- ALTER TABLE public.expense_reports NO FORCE ROW LEVEL SECURITY;
-- ALTER TABLE public.expense_items   NO FORCE ROW LEVEL SECURITY;

-- Step 2b: Alternative — add an explicit permissive policy for service_role
--          (safer: keeps RLS on for other roles)
DO $$
BEGIN
  -- expense_reports
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'expense_reports'
      AND policyname = 'service_role_all_expense_reports'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY service_role_all_expense_reports
        ON public.expense_reports
        TO service_role
        USING (true)
        WITH CHECK (true);
    $policy$;
    RAISE NOTICE 'Created policy: service_role_all_expense_reports';
  ELSE
    RAISE NOTICE 'Policy already exists: service_role_all_expense_reports';
  END IF;

  -- expense_items (joined in the same query)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'expense_items'
      AND policyname = 'service_role_all_expense_items'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY service_role_all_expense_items
        ON public.expense_items
        TO service_role
        USING (true)
        WITH CHECK (true);
    $policy$;
    RAISE NOTICE 'Created policy: service_role_all_expense_items';
  ELSE
    RAISE NOTICE 'Policy already exists: service_role_all_expense_items';
  END IF;
END;
$$;

-- Step 3: Verify policies after running
SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('expense_reports', 'expense_items')
ORDER BY tablename, policyname;
