-- Extend status CHECK constraint on expense_reports
ALTER TABLE public.expense_reports
  DROP CONSTRAINT IF EXISTS expense_reports_status_check;

ALTER TABLE public.expense_reports
  ADD CONSTRAINT expense_reports_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'needs_info'));

-- Board message to the member when requesting integration
ALTER TABLE public.expense_reports
  ADD COLUMN IF NOT EXISTS integration_note text;

-- Grant UPDATE on expense_items to authenticated
GRANT UPDATE ON public.expense_items TO authenticated;

-- Member can UPDATE their own items (needed to add receipts on resubmit)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'expense_items'
      AND policyname = 'items_update_own'
  ) THEN
    CREATE POLICY "items_update_own" ON public.expense_items
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM public.expense_reports r
          WHERE r.id = report_id AND r.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Board can update items (board_note)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'expense_items'
      AND policyname = 'items_update_board'
  ) THEN
    CREATE POLICY "items_update_board" ON public.expense_items
      FOR UPDATE USING (public.is_board_member(auth.uid()));
  END IF;
END $$;
