-- ============================================================
-- Migration 007: Expense Reports + Items
-- Run in Supabase SQL Editor
-- ============================================================

-- Sequence for human-readable report numbers per year
create sequence if not exists public.expense_report_seq;

-- ============================================================
-- EXPENSE REPORTS (contenitore rimborso)
-- ============================================================
create table if not exists public.expense_reports (
  id             uuid primary key default uuid_generate_v4(),
  report_number  text not null unique, -- ESN-YYYY-NNNN
  user_id        uuid references public.profiles(id) on delete cascade not null,
  event_name     text not null,
  status         text not null default 'pending'
                   check (status in ('pending', 'approved', 'rejected')),
  board_note     text,
  reviewed_by    uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Auto report_number: ESN-2026-0001, ESN-2026-0002 ...
create or replace function public.generate_report_number()
returns trigger language plpgsql as $$
begin
  new.report_number := 'ESN-' || to_char(now(), 'YYYY') || '-'
    || lpad(nextval('public.expense_report_seq')::text, 4, '0');
  return new;
end;
$$;

create trigger set_report_number
  before insert on public.expense_reports
  for each row
  when (new.report_number is null or new.report_number = '')
  execute procedure public.generate_report_number();

-- updated_at trigger
create trigger on_expense_reports_updated
  before update on public.expense_reports
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- EXPENSE ITEMS (voci di spesa)
-- ============================================================
create table if not exists public.expense_items (
  id           uuid primary key default uuid_generate_v4(),
  report_id    uuid references public.expense_reports(id) on delete cascade not null,
  title        text not null,
  category     text not null
                 check (category in ('Trasporti', 'Catering', 'Materiali', 'Alloggio', 'Altro')),
  amount       numeric(10, 2) not null check (amount > 0),
  receipt_url  text,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- GRANTS
-- ============================================================
grant select, insert, update on public.expense_reports to authenticated;
grant select, insert on public.expense_items to authenticated;
grant usage on sequence public.expense_report_seq to authenticated;

-- ============================================================
-- RLS
-- ============================================================
alter table public.expense_reports enable row level security;
alter table public.expense_items enable row level security;

-- Reports: member vede i propri
create policy "reports_select_own" on public.expense_reports
  for select using (auth.uid() = user_id);

-- Reports: member (e board) possono inserire i propri
create policy "reports_insert_own" on public.expense_reports
  for insert with check (auth.uid() = user_id);

-- Reports: board vede tutto
create policy "reports_select_board" on public.expense_reports
  for select using (public.is_board_member(auth.uid()));

-- Reports: board può aggiornare (approve/reject)
create policy "reports_update_board" on public.expense_reports
  for update using (public.is_board_member(auth.uid()));

-- Items: member vede i propri (tramite report)
create policy "items_select_own" on public.expense_items
  for select using (
    exists (
      select 1 from public.expense_reports r
      where r.id = report_id and r.user_id = auth.uid()
    )
  );

-- Items: member inserisce nel proprio report
create policy "items_insert_own" on public.expense_items
  for insert with check (
    exists (
      select 1 from public.expense_reports r
      where r.id = report_id and r.user_id = auth.uid()
    )
  );

-- Items: board vede tutto
create policy "items_select_board" on public.expense_items
  for select using (public.is_board_member(auth.uid()));
