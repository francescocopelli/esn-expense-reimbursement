-- ============================================================
-- 012 — Security & completeness fixes
-- ============================================================

-- 1. RLS SELECT policy for board role on expense_reports
--    (previously only admin had reports_admin_read; board relied entirely on adminClient bypass)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='expense_reports' AND policyname='reports_board_read'
  ) THEN
    CREATE POLICY reports_board_read ON public.expense_reports
      FOR SELECT
      USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('board', 'admin')
      );
  END IF;
END $$;

-- 2. RLS SELECT policy for board role on profiles
--    (board needs to read all profiles to show submitter names)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_board_read'
  ) THEN
    CREATE POLICY profiles_board_read ON public.profiles
      FOR SELECT
      USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('board', 'admin')
      );
  END IF;
END $$;

-- 3. Add reviewed_at timestamp to expense_reports
ALTER TABLE public.expense_reports
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz DEFAULT NULL;

-- 4. Remove dev seed data if accidentally applied in production
--    (safe: only deletes test accounts created by 005_dev_seed_accounts.sql)
--    Identify by known test emails from seed file
DELETE FROM auth.users
  WHERE email IN (
    'member@test.esn.it',
    'board@test.esn.it',
    'admin@test.esn.it'
  );
-- Note: profiles are cascade-deleted via FK if auth.users row is removed.
-- If no seed was applied this is a no-op.
