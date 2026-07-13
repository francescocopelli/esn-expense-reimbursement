-- ============================================================
-- Fix: Remove hardcoded category CHECK from expense_items
-- Sentry issue: REIMBURSEMENT-SYSTEM-4
--
-- Context:
--   Migration 007 added: CHECK (category IN ('Trasporti','Catering','Materiali','Alloggio','Altro'))
--   Migration 011 added expense_categories as a dynamic admin-managed table.
--   Any category beyond the original 5 caused a 400 on INSERT into expense_items.
--
-- Fix:
--   Drop the constraint. Category validity is enforced at app-layer
--   (POST /api/reports validates against expense_categories rows before inserting).
-- ============================================================

DO $$
DECLARE
  v_constraint text;
BEGIN
  -- Find the actual constraint name dynamically (may vary by Postgres/Supabase version)
  SELECT conname INTO v_constraint
  FROM pg_constraint
  WHERE conrelid = 'public.expense_items'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%Trasporti%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.expense_items DROP CONSTRAINT ' || quote_ident(v_constraint);
    RAISE NOTICE 'Dropped constraint: %', v_constraint;
  ELSE
    RAISE NOTICE 'Constraint already removed or not found — no-op.';
  END IF;
END
$$;
