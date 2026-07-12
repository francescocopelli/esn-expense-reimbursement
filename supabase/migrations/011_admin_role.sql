-- ============================================================
-- 011 — Admin role + config tables
-- ============================================================

-- 1. Extend profiles.role CHECK
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('member', 'board', 'admin'));

-- 2. ESN Sections table
CREATE TABLE IF NOT EXISTS public.esn_sections (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.esn_sections ENABLE ROW LEVEL SECURITY;

-- Everyone can read sections (needed for signup form)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='esn_sections' AND policyname='sections_read_all') THEN
    CREATE POLICY sections_read_all ON public.esn_sections FOR SELECT USING (true);
  END IF;
END $$;

-- Only admin can write
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='esn_sections' AND policyname='sections_write_admin') THEN
    CREATE POLICY sections_write_admin ON public.esn_sections FOR ALL USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 3. Expense Categories table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  max_amount numeric(10,2) DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expense_categories' AND policyname='categories_read_all') THEN
    CREATE POLICY categories_read_all ON public.expense_categories FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expense_categories' AND policyname='categories_write_admin') THEN
    CREATE POLICY categories_write_admin ON public.expense_categories FOR ALL USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 4. is_admin() helper
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin'
  );
$$;

-- 5. Admin can read/update ALL profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='profiles_admin_all') THEN
    CREATE POLICY profiles_admin_all ON public.profiles FOR ALL USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 6. Admin can read ALL expense_reports
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='expense_reports' AND policyname='reports_admin_read') THEN
    CREATE POLICY reports_admin_read ON public.expense_reports FOR SELECT USING (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 7. Seed default sections (idempotent)
INSERT INTO public.esn_sections (name) VALUES
  ('ESN Italia'),
  ('ESN Milano'),
  ('ESN Roma'),
  ('ESN Torino'),
  ('ESN Bologna'),
  ('ESN Napoli'),
  ('ESN Firenze'),
  ('ESN Padova')
ON CONFLICT (name) DO NOTHING;

-- 8. Seed default categories (idempotent)
INSERT INTO public.expense_categories (name) VALUES
  ('Trasporti'),
  ('Catering'),
  ('Materiali'),
  ('Alloggio'),
  ('Altro')
ON CONFLICT (name) DO NOTHING;

GRANT SELECT ON public.esn_sections       TO authenticated, anon;
GRANT SELECT ON public.expense_categories TO authenticated, anon;
GRANT ALL    ON public.esn_sections       TO authenticated;
GRANT ALL    ON public.expense_categories TO authenticated;
