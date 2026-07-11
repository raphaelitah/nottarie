-- Private events (est_prive) were readable in full by any administrateur/
-- notaire, even ones they didn't organize or get invited to. That's now
-- unwanted: an admin/notaire's own agenda should treat colleagues' private
-- events exactly like everyone else does — an anonymized "Privé" busy
-- block, not the real titre/description/lieu/categorie/couleur. Only the
-- organizer or an invited participant sees the details.
--
-- This updates the public-schema copy of the function. It turns out to be
-- dead code (see 20260711191100) but is kept in sync with the private-schema
-- one for consistency, matching the pattern already used elsewhere in this
-- migration set (e.g. 20260707113155_fix_private_schema_function_duplication).
create or replace function public.current_user_can_view_evenement_details(p_evenement_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from evenements e
    where e.id = p_evenement_id
    and (
      not e.est_prive
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
