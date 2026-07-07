-- Per Supabase's own guidance ("Do I need to expose 'security definer'
-- Functions in Row Level Security Policies?"): functions only used inside
-- RLS policies/views don't need to live in an API-exposed schema at all,
-- as long as callers reference them with an explicit schema qualifier.
-- Existing RLS policies and the evenements_agenda view resolve function
-- calls by OID at creation time, not by name, so moving these functions'
-- schema does not break any of the ~80 policies that reference them.
create schema if not exists private;

grant usage on schema private to authenticated, service_role;

alter function public.current_user_can_manage_dossier_acces(uuid) set schema private;
alter function public.current_user_can_view_evenement_details(uuid) set schema private;
alter function public.current_user_has_role(uuid, role_notarial[]) set schema private;
alter function public.current_user_tenant_ids() set schema private;
alter function public.generate_dossier_numero(uuid) set schema private;
alter function public.is_platform_admin() set schema private;

-- These 4 public-schema functions call the ones above by unqualified name,
-- and their search_path is deliberately hardened to `public` only (search-path
-- injection defense), so they need explicit private. qualification now that
-- the callees no longer live in public.
create or replace function public.current_user_can_manage_dossier_acces(p_dossier_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from dossiers d
    join utilisateurs u on u.auth_user_id = auth.uid() and u.tenant_id = d.tenant_id
    where d.id = p_dossier_id
      and (
        private.current_user_has_role(d.tenant_id, array['administrateur', 'notaire']::role_notarial[])
        or u.id = d.clerc_attitre_id
      )
  );
$$;

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
      or private.current_user_has_role(e.tenant_id, array['administrateur', 'notaire']::role_notarial[])
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
