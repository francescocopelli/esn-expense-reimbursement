-- ============================================================
-- DEV SEED: demo accounts for local development
-- ============================================================
-- ⚠️  IMPORTANT: run this ONLY in your local / staging Supabase.
--     Never run on production.
--
-- These accounts match the quick-select buttons in LoginForm.tsx
-- (visible only when NODE_ENV === 'development').
--
-- Passwords are set via Supabase Dashboard or CLI after creation
-- since auth.users passwords cannot be set directly from SQL.
-- Use: supabase auth create-user (CLI) or Dashboard > Authentication > Users
-- ============================================================

-- Create profiles for dev users IF they already exist in auth.users
-- (insert via Dashboard/CLI first, then run this to set profile metadata)

DO $$
DECLARE
  mario_id  uuid;
  giulia_id uuid;
BEGIN

  -- Resolve user IDs from auth.users by email
  SELECT id INTO mario_id  FROM auth.users WHERE email = 'mario@esn-dev.local'  LIMIT 1;
  SELECT id INTO giulia_id FROM auth.users WHERE email = 'giulia@esn-dev.local' LIMIT 1;

  -- Insert/update Mario Rossi (member)
  IF mario_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, section, role)
    VALUES (mario_id, 'Mario Rossi', 'ESN Pisa', 'member')
    ON CONFLICT (id) DO UPDATE
      SET full_name = 'Mario Rossi',
          section   = 'ESN Pisa',
          role      = 'member',
          updated_at = now();
    RAISE NOTICE 'Profile upserted for mario@esn-dev.local (%)', mario_id;
  ELSE
    RAISE NOTICE 'mario@esn-dev.local not found in auth.users — create the user first via Dashboard or CLI';
  END IF;

  -- Insert/update Giulia Bianchi (board)
  IF giulia_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, section, role)
    VALUES (giulia_id, 'Giulia Bianchi', 'ESN Pisa', 'board')
    ON CONFLICT (id) DO UPDATE
      SET full_name = 'Giulia Bianchi',
          section   = 'ESN Pisa',
          role      = 'board',
          updated_at = now();
    RAISE NOTICE 'Profile upserted for giulia@esn-dev.local (%)', giulia_id;
  ELSE
    RAISE NOTICE 'giulia@esn-dev.local not found in auth.users — create the user first via Dashboard or CLI';
  END IF;

END;
$$;
