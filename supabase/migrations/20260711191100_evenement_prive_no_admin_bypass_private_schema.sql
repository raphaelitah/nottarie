-- The evenements_agenda view and the evenement_dossiers/evenement_participants
-- RLS policies actually resolve current_user_can_view_evenement_details by
-- OID, and that OID lives in the `private` schema since the
-- 20260707113111_move_rls_helper_functions_to_private_schema migration moved
-- it there. This is the copy of the previous migration's fix that the view
-- and policies actually pick up: drops the administrateur/notaire bypass so
-- a colleague's private event only shows full details to its organizer or
-- an invited participant — everyone else, including admin/notaire, sees the
-- anonymized "Privé" busy block like any other tenant member.
create or replace function private.current_user_can_view_evenement_details(p_evenement_id uuid)
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
