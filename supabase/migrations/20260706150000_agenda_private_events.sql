-- ============================================================
-- Private events: an organizer can mark an evenement as est_prive so
-- colleagues still see it as a busy block (row stays visible, tenant-wide)
-- but cannot see its titre/description/lieu/categorie/couleur — only the
-- organizer, invited participants, or admin/notaire may see those.
--
-- RLS alone can't redact individual columns (only filter whole rows), so
-- this is done via a view (evenements_agenda) that all reads go through.
-- ============================================================

alter table evenements add column est_prive boolean not null default false;

create function current_user_can_view_evenement_details(p_evenement_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from evenements e
    where e.id = p_evenement_id
    and (
      not e.est_prive
      or current_user_has_role(e.tenant_id, array['administrateur', 'notaire']::role_notarial[])
      or exists (
        select 1 from utilisateurs u
        where u.id = e.organisateur_id and u.auth_user_id = auth.uid()
      )
      or exists (
        select 1 from evenement_participants ep
        join utilisateurs u on u.id = ep.utilisateur_id
        where ep.evenement_id = e.id and u.auth_user_id = auth.uid()
      )
    )
  );
$$;

-- Not security_invoker: this view intentionally runs with the view owner's
-- privileges so it can be read by any tenant member even though direct
-- SELECT on the base table is revoked below (see rationale there). Tenant
-- scoping is therefore enforced explicitly in the WHERE clause rather than
-- inherited from the base table's RLS.
create view evenements_agenda as
select
  e.id, e.tenant_id, e.debut, e.fin, e.all_day, e.organisateur_id, e.disponibilite,
  e.rrule, e.rrule_exdates, e.recurrence_id, e.recurrence_original_start,
  e.outlook_event_id, e.created_at, e.est_prive,
  current_user_can_view_evenement_details(e.id) as peut_voir_details,
  case when current_user_can_view_evenement_details(e.id) then e.titre else 'Privé' end as titre,
  case when current_user_can_view_evenement_details(e.id) then e.description else null end as description,
  case when current_user_can_view_evenement_details(e.id) then e.lieu else null end as lieu,
  case when current_user_can_view_evenement_details(e.id) then e.categorie_id else null end as categorie_id,
  case when current_user_can_view_evenement_details(e.id) then e.couleur else null end as couleur
from evenements e
where e.tenant_id in (select current_user_tenant_ids());

grant select on evenements_agenda to authenticated;

-- Without this, a direct PostgREST call to /evenements would still return
-- the real titre/description/lieu, defeating est_prive entirely — the base
-- table's own SELECT must not be a general read path.
revoke select on evenements from authenticated, anon;

-- INSERT ... RETURNING (used by the frontend to get a new row's id back)
-- requires SELECT privilege on the table in Postgres. Restore it, scoped by
-- RLS to only the organizer or admin/notaire — exactly whoever is allowed to
-- write the row anyway. Any other tenant member still gets zero rows from a
-- direct `evenements` query and must go through evenements_agenda instead.
grant select on evenements to authenticated;

create policy "evenements_select_own_write" on evenements
  for select to authenticated
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

-- Tighten evenement_dossiers / evenement_participants: for a private event,
-- only the organizer, its participants, or an admin/notaire may see the
-- linked dossiers or the participant list — otherwise these would leak
-- exactly the "what/who" information est_prive is meant to hide.
drop policy "evenement_dossiers_select_tenant" on evenement_dossiers;
create policy "evenement_dossiers_select_tenant" on evenement_dossiers
  for select to authenticated
  using (
    tenant_id in (select current_user_tenant_ids())
    and current_user_can_view_evenement_details(evenement_id)
  );

drop policy "evenement_participants_select_tenant" on evenement_participants;
create policy "evenement_participants_select_tenant" on evenement_participants
  for select to authenticated
  using (
    tenant_id in (select current_user_tenant_ids())
    and current_user_can_view_evenement_details(evenement_id)
  );
