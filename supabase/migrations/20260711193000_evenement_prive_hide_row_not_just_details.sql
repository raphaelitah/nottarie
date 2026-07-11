-- Private events were still visible tenant-wide as an anonymized "Privé"
-- busy block, even to people who have nothing to do with them. That's not
-- what's wanted: a private event should only appear at all — on the shared
-- étude calendar, in "Cette semaine", anywhere evenements_agenda is read —
-- to its organizer or an invited participant. Everyone else, admin/notaire
-- included, shouldn't see any trace of it, not even a blocked slot.
--
-- This replaces the column-level redaction (case-when to 'Privé') with a
-- row-level filter in the view's WHERE clause, so peut_voir_details is no
-- longer needed — a row only ever comes back when it's true.
drop view evenements_agenda;

-- Both helper functions live in the `private` schema (moved there by
-- 20260707113111_move_rls_helper_functions_to_private_schema) and must be
-- schema-qualified here since this view isn't itself in that schema's
-- search path.
create view evenements_agenda as
select
  e.id, e.tenant_id, e.debut, e.fin, e.all_day, e.organisateur_id, e.disponibilite,
  e.rrule, e.rrule_exdates, e.recurrence_id, e.recurrence_original_start,
  e.outlook_event_id, e.created_at, e.est_prive,
  e.titre, e.description, e.lieu, e.categorie_id, e.couleur
from evenements e
where e.tenant_id in (select private.current_user_tenant_ids())
  and (not e.est_prive or private.current_user_can_view_evenement_details(e.id));

grant select on evenements_agenda to authenticated;
