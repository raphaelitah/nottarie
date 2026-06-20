-- ============================================================
-- etudes: a user can see/update only the étude(s) they belong to.
-- Creation of new étude tenants is an admin/back-office operation,
-- not exposed to regular authenticated users.
-- ============================================================
alter table etudes enable row level security;

create policy "etudes_select_member" on etudes
  for select to authenticated
  using (id in (select current_user_tenant_ids()));

create policy "etudes_update_admin" on etudes
  for update to authenticated
  using (current_user_has_role(id, array['administrateur']::role_notarial[]))
  with check (current_user_has_role(id, array['administrateur']::role_notarial[]));

-- ============================================================
-- utilisateurs: members can see other members of their own étude(s).
-- Role assignment restricted to administrateur (EF-ROL-02).
-- ============================================================
alter table utilisateurs enable row level security;

create policy "utilisateurs_select_same_tenant" on utilisateurs
  for select to authenticated
  using (tenant_id in (select current_user_tenant_ids()));

create policy "utilisateurs_insert_admin" on utilisateurs
  for insert to authenticated
  with check (current_user_has_role(tenant_id, array['administrateur']::role_notarial[]));

create policy "utilisateurs_update_admin" on utilisateurs
  for update to authenticated
  using (current_user_has_role(tenant_id, array['administrateur']::role_notarial[]))
  with check (current_user_has_role(tenant_id, array['administrateur']::role_notarial[]));

create policy "utilisateurs_delete_admin" on utilisateurs
  for delete to authenticated
  using (current_user_has_role(tenant_id, array['administrateur']::role_notarial[]));

-- ============================================================
-- Shared reference data: readable by every authenticated user,
-- writable only by the editor back-office (service_role / EF-PLT-01/02).
-- ============================================================
alter table trames enable row level security;

create policy "trames_select_all_authenticated" on trames
  for select to authenticated
  using (true);

alter table baremes enable row level security;

create policy "baremes_select_all_authenticated" on baremes
  for select to authenticated
  using (true);

-- ============================================================
-- Generic tenant-scoped policy generator: every table below follows the
-- same shape (full CRUD restricted to members of tenant_id). Declared
-- per-table (RLS policies can't be parameterized) rather than via a loop.
-- ============================================================
do $$
declare
  t text;
  tenant_tables text[] := array[
    'personnes', 'dossiers', 'dossier_acces', 'immeubles', 'dossier_immeubles',
    'comparants', 'comparant_liens_familiaux', 'trame_customizations', 'actes',
    'courriers', 'formalites', 'documents', 'emails', 'evenements',
    'evenement_dossiers', 'simulations', 'historique'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for select to authenticated using (tenant_id in (select current_user_tenant_ids()))',
      t || '_select_tenant', t
    );
    execute format(
      'create policy %I on %I for insert to authenticated with check (tenant_id in (select current_user_tenant_ids()))',
      t || '_insert_tenant', t
    );
    execute format(
      'create policy %I on %I for update to authenticated using (tenant_id in (select current_user_tenant_ids())) with check (tenant_id in (select current_user_tenant_ids()))',
      t || '_update_tenant', t
    );
    execute format(
      'create policy %I on %I for delete to authenticated using (tenant_id in (select current_user_tenant_ids()))',
      t || '_delete_tenant', t
    );
  end loop;
end $$;

-- ============================================================
-- Tighter overrides beyond the generic tenant policy:
-- ============================================================

-- Dossier with acces_restreint = true: only users explicitly granted via
-- dossier_acces (or an administrateur/notaire) may see it (EF-ACC-01/EF-ROL-05).
drop policy "dossiers_select_tenant" on dossiers;
create policy "dossiers_select_tenant" on dossiers
  for select to authenticated
  using (
    tenant_id in (select current_user_tenant_ids())
    and (
      not acces_restreint
      or current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[])
      or exists (
        select 1 from dossier_acces da
        join utilisateurs u on u.id = da.utilisateur_id
        where da.dossier_id = dossiers.id and u.auth_user_id = auth.uid()
      )
    )
  );

-- Signing an acte authentique is reserved to the notaire role (EF-ROL-04/EF-SIG-04).
-- Generic update policy above covers all other tenant members updating an acte's
-- draft fields; this additionally blocks non-notaire from flipping statut to 'signe'.
drop policy "actes_update_tenant" on actes;
create policy "actes_update_tenant" on actes
  for update to authenticated
  using (tenant_id in (select current_user_tenant_ids()))
  with check (
    tenant_id in (select current_user_tenant_ids())
    and (
      statut <> 'signe'
      or current_user_has_role(tenant_id, array['notaire']::role_notarial[])
    )
  );

-- Maintenance of trame customizations restricted to admin/notaire (EF-ROL-07).
drop policy "trame_customizations_insert_tenant" on trame_customizations;
drop policy "trame_customizations_update_tenant" on trame_customizations;
drop policy "trame_customizations_delete_tenant" on trame_customizations;

create policy "trame_customizations_insert_tenant" on trame_customizations
  for insert to authenticated
  with check (current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

create policy "trame_customizations_update_tenant" on trame_customizations
  for update to authenticated
  using (current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]))
  with check (current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

create policy "trame_customizations_delete_tenant" on trame_customizations
  for delete to authenticated
  using (current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

-- historique is an audit log: insert-only for tenant members, no update/delete
-- (immutability matters for ENF-06 traceability).
drop policy "historique_update_tenant" on historique;
drop policy "historique_delete_tenant" on historique;
