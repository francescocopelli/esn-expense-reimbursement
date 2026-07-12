-- Add board review note column to expense_items
ALTER TABLE public.expense_items
  ADD COLUMN IF NOT EXISTS board_note text;
