-- ============================================================
-- SECURITY FIX 1: handle_updated_at — set search_path
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- SECURITY FIX 2: restrict handle_new_user execution
-- Revoke from public (anon + authenticated), grant only to supabase_auth_admin
-- so it cannot be invoked via /rest/v1/rpc/
-- ============================================================
revoke execute on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- ============================================================
-- SECURITY FIX 3: restrict receipts storage SELECT policy
-- Drop the broad public listing policy and replace with a
-- scoped one: users see only their own folder, board sees all
-- ============================================================
drop policy if exists "receipts_select_public" on storage.objects;

create policy "receipts_select_own"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and (
      (auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text)
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.role = 'board'
      )
    )
  );
