-- Allow project owners to read newly inserted projects
-- before the owner membership is visible.

create policy projects_select_owner
on public.projects
for select
to authenticated
using (
  owner_id = (select auth.uid())
);