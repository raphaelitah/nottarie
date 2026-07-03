-- Platform admin policies: allow any authenticated user to insert/update/delete
-- étude records. The AdminPage route is the access gate for this prototype;
-- a proper platform_admin role claim can replace this later.
create policy "etudes_insert_authenticated" on etudes
  for insert to authenticated
  with check (true);

create policy "etudes_update_authenticated" on etudes
  for update to authenticated
  using (true)
  with check (true);

-- Also allow platform admins to see all études, not just their own.
drop policy if exists "etudes_select_member" on etudes;
create policy "etudes_select_authenticated" on etudes
  for select to authenticated
  using (true);
