-- The prototype-era policies "etudes_insert_authenticated", "etudes_update_authenticated",
-- "etudes_select_authenticated" and "utilisateurs_insert_authenticated" granted access to
-- *any* authenticated user (using/with check (true)), relying on the AdminPage route as the
-- only gate. That violates ENF-01 (RLS must be the isolation boundary, not the frontend) —
-- any authenticated user could read/create/update every étude, or insert themselves into any
-- étude's utilisateurs with any role via a direct table call. Replace them with policies that
-- actually check platform_admin / tenant-administrateur status.

drop policy if exists "etudes_insert_authenticated" on etudes;
drop policy if exists "etudes_update_authenticated" on etudes;
drop policy if exists "etudes_select_authenticated" on etudes;
drop policy if exists "utilisateurs_insert_authenticated" on utilisateurs;

-- etudes: members keep seeing their own étude; platform admins already have their own
-- select/insert policies from add_platform_admins_and_etudes_insert_policy. Platform admins
-- also need an update policy since they are not necessarily members of the étude they edit.
create policy "etudes_select_member" on etudes
  for select to authenticated
  using (id in (select current_user_tenant_ids()));

create policy "etudes_update_platform_admin" on etudes
  for update to authenticated
  using (is_platform_admin())
  with check (is_platform_admin());

-- utilisateurs: restore tenant-administrateur inserts (EF-ROL-02), and let platform admins
-- insert directly too.
create policy "utilisateurs_insert_admin" on utilisateurs
  for insert to authenticated
  with check (current_user_has_role(tenant_id, array['administrateur']::role_notarial[]) or is_platform_admin());
