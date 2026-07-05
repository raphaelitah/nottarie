-- ============================================================
-- evenement_categories: standard tenant select, write limited to
-- administrateur/notaire (shared taxonomy, not personal).
-- ============================================================
alter table evenement_categories enable row level security;

create policy "evenement_categories_select_tenant" on evenement_categories
  for select to authenticated
  using (tenant_id in (select current_user_tenant_ids()));

create policy "evenement_categories_insert_tenant" on evenement_categories
  for insert to authenticated
  with check (current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

create policy "evenement_categories_update_tenant" on evenement_categories
  for update to authenticated
  using (current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]))
  with check (current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

create policy "evenement_categories_delete_tenant" on evenement_categories
  for delete to authenticated
  using (current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

-- ============================================================
-- evenements: keep tenant-wide select/insert (view all, create new).
-- Tighten update/delete to organizer or administrateur/notaire.
-- ============================================================
drop policy "evenements_update_tenant" on evenements;
drop policy "evenements_delete_tenant" on evenements;

create policy "evenements_update_tenant" on evenements
  for update to authenticated
  using (
    tenant_id in (select current_user_tenant_ids())
    and (
      current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[])
      or exists (
        select 1 from utilisateurs u
        where u.id = evenements.organisateur_id and u.auth_user_id = auth.uid()
      )
    )
  )
  with check (
    tenant_id in (select current_user_tenant_ids())
    and (
      current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[])
      or exists (
        select 1 from utilisateurs u
        where u.id = evenements.organisateur_id and u.auth_user_id = auth.uid()
      )
    )
  );

create policy "evenements_delete_tenant" on evenements
  for delete to authenticated
  using (
    tenant_id in (select current_user_tenant_ids())
    and (
      current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[])
      or exists (
        select 1 from utilisateurs u
        where u.id = evenements.organisateur_id and u.auth_user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- evenement_participants: tenant-wide select. Insert/delete limited to
-- organizer or administrateur/notaire. Update: self-service RSVP OR
-- organizer/admin management (two permissive policies OR'd together).
-- ============================================================
alter table evenement_participants enable row level security;

create policy "evenement_participants_select_tenant" on evenement_participants
  for select to authenticated
  using (tenant_id in (select current_user_tenant_ids()));

create policy "evenement_participants_insert_tenant" on evenement_participants
  for insert to authenticated
  with check (
    tenant_id in (select current_user_tenant_ids())
    and (
      current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[])
      or exists (
        select 1 from evenements e
        join utilisateurs u on u.id = e.organisateur_id and u.auth_user_id = auth.uid()
        where e.id = evenement_participants.evenement_id
      )
    )
  );

create policy "evenement_participants_delete_tenant" on evenement_participants
  for delete to authenticated
  using (
    tenant_id in (select current_user_tenant_ids())
    and (
      current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[])
      or exists (
        select 1 from evenements e
        join utilisateurs u on u.id = e.organisateur_id and u.auth_user_id = auth.uid()
        where e.id = evenement_participants.evenement_id
      )
    )
  );

create policy "evenement_participants_update_self_rsvp" on evenement_participants
  for update to authenticated
  using (
    tenant_id in (select current_user_tenant_ids())
    and exists (
      select 1 from utilisateurs u
      where u.id = evenement_participants.utilisateur_id and u.auth_user_id = auth.uid()
    )
  )
  with check (
    tenant_id in (select current_user_tenant_ids())
    and exists (
      select 1 from utilisateurs u
      where u.id = evenement_participants.utilisateur_id and u.auth_user_id = auth.uid()
    )
  );

create policy "evenement_participants_update_organisateur" on evenement_participants
  for update to authenticated
  using (
    tenant_id in (select current_user_tenant_ids())
    and (
      current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[])
      or exists (
        select 1 from evenements e
        join utilisateurs u on u.id = e.organisateur_id and u.auth_user_id = auth.uid()
        where e.id = evenement_participants.evenement_id
      )
    )
  )
  with check (
    tenant_id in (select current_user_tenant_ids())
    and (
      current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[])
      or exists (
        select 1 from evenements e
        join utilisateurs u on u.id = e.organisateur_id and u.auth_user_id = auth.uid()
        where e.id = evenement_participants.evenement_id
      )
    )
  );
