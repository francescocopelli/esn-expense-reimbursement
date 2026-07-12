-- Add start_date and end_date columns to projects
-- start_date: required (date)
-- end_date:   optional (date)

alter table public.projects
  add column if not exists start_date date,
  add column if not exists end_date   date;

-- Optional constraint: end_date must be >= start_date when both are set
alter table public.projects
  drop constraint if exists projects_dates_check;
alter table public.projects
  add constraint projects_dates_check
  check (end_date is null or start_date is null or end_date >= start_date);
