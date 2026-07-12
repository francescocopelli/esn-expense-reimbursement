-- Add optional note column to expense_items
ALTER TABLE public.expense_items
  ADD COLUMN IF NOT EXISTS note text;
