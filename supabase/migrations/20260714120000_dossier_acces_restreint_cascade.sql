-- Restricting a dossier's access (acces_restreint) only protected the
-- dossier row itself via dossiers_select_tenant. Every child table
-- (comparants, actes, courriers, formalites, documents, emails) granted
-- select to any tenant member regardless of the parent dossier's
-- restriction, so restricted comparant identities, generated acts,
-- correspondence, and ID scans were still readable tenant-wide. Also,
-- only dossiers_select_tenant checked acces_restreint - update/delete on
-- the dossier row itself did not.
--
-- Fixed with one shared helper (in the private schema, alongside the
-- other RLS-only helpers) so this can't drift table-by-table again.
create function private.current_user_can_access_dossier(p_dossier_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from dossiers d
    where d.id = p_dossier_id
      and d.tenant_id in (select private.current_user_tenant_ids())
      and (
        not d.acces_restreint
        or private.current_user_has_role(d.tenant_id, array['administrateur', 'notaire']::role_notarial[])
        or exists (
          select 1 from dossier_acces da
          join utilisateurs u on u.id = da.utilisateur_id
          where da.dossier_id = d.id and u.auth_user_id = auth.uid()
        )
      )
  );
$$;

grant usage on schema private to authenticated;
grant execute on function private.current_user_can_access_dossier(uuid) to authenticated;

drop policy "comparants_select_tenant" on comparants;
create policy "comparants_select_tenant" on comparants
  for select to authenticated
  using (
    tenant_id in (select private.current_user_tenant_ids())
    and private.current_user_can_access_dossier(dossier_id)
  );

drop policy "actes_select_tenant" on actes;
create policy "actes_select_tenant" on actes
  for select to authenticated
  using (
    tenant_id in (select private.current_user_tenant_ids())
    and private.current_user_can_access_dossier(dossier_id)
  );

drop policy "courriers_select_tenant" on courriers;
create policy "courriers_select_tenant" on courriers
  for select to authenticated
  using (
    tenant_id in (select private.current_user_tenant_ids())
    and private.current_user_can_access_dossier(dossier_id)
  );

drop policy "formalites_select_tenant" on formalites;
create policy "formalites_select_tenant" on formalites
  for select to authenticated
  using (
    tenant_id in (select private.current_user_tenant_ids())
    and private.current_user_can_access_dossier(dossier_id)
  );

drop policy "documents_select_tenant" on documents;
create policy "documents_select_tenant" on documents
  for select to authenticated
  using (
    tenant_id in (select private.current_user_tenant_ids())
    and private.current_user_can_access_dossier(dossier_id)
  );

-- emails carries the same dossier_id shape and the same exposure risk,
-- even though it wasn't explicitly called out in the assessment.
drop policy "emails_select_tenant" on emails;
create policy "emails_select_tenant" on emails
  for select to authenticated
  using (
    tenant_id in (select private.current_user_tenant_ids())
    and private.current_user_can_access_dossier(dossier_id)
  );

-- dossiers: only SELECT checked acces_restreint. An excluded user who
-- has/guesses a restricted dossier's UUID could still update or delete it.
drop policy "dossiers_update_tenant" on dossiers;
create policy "dossiers_update_tenant" on dossiers
  for update to authenticated
  using (
    tenant_id in (select private.current_user_tenant_ids())
    and private.current_user_can_access_dossier(id)
  )
  with check (
    tenant_id in (select private.current_user_tenant_ids())
    and private.current_user_can_access_dossier(id)
  );

drop policy "dossiers_delete_tenant" on dossiers;
create policy "dossiers_delete_tenant" on dossiers
  for delete to authenticated
  using (
    tenant_id in (select private.current_user_tenant_ids())
    and private.current_user_can_access_dossier(id)
  );
