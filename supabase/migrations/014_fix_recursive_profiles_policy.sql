-- ============================================================
-- Migration 014: Fix infinite recursion in profiles RLS
-- ============================================================
-- Root cause:
--   Migration 012 added policies on public.profiles and
--   public.expense_reports that used inline subqueries:
--     (SELECT role FROM public.profiles WHERE id = auth.uid())
--   When evaluated inside a policy ON public.profiles, Postgres
--   re-enters the RLS check → infinite recursion.
--
-- Fix:
--   Use SECURITY DEFINER functions (which bypass RLS internally)
--   instead of raw subqueries. Extend is_board_member() to cover
--   both 'board' and 'admin' roles via a new helper.
-- ============================================================

-- 1. Add is_board_or_admin() helper (SECURITY DEFINER = no RLS re-entry)
CREATE OR REPLACE FUNCTION public.is_board_or_admin(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role IN ('board', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_board_or_admin(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_board_or_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_board_or_admin(uuid) TO service_role;

-- Also ensure existing helpers are granted to service_role
GRANT EXECUTE ON FUNCTION public.is_board_member(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid)        TO service_role;

-- 2. Fix profiles_board_read (was recursive: policy ON profiles reading profiles)
DROP POLICY IF EXISTS profiles_board_read ON public.profiles;
CREATE POLICY profiles_board_read ON public.profiles
  FOR SELECT
  USING (public.is_board_or_admin(auth.uid()));

-- 3. Fix reports_board_read (inline subquery on profiles)
DROP POLICY IF EXISTS reports_board_read ON public.expense_reports;
CREATE POLICY reports_board_read ON public.expense_reports
  FOR SELECT
  USING (public.is_board_or_admin(auth.uid()));

-- 4. Fix reports_update_board if it uses inline subquery too
DROP POLICY IF EXISTS reports_update_board ON public.expense_reports;
CREATE POLICY reports_update_board ON public.expense_reports
  FOR UPDATE
  USING (public.is_board_or_admin(auth.uid()));

-- 5. Verify: list all policies on profiles and expense_reports
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('profiles', 'expense_reports', 'expense_items')
ORDER BY tablename, policyname;
