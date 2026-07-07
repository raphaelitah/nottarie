-- These 7 are trigger functions only (bound via CREATE TRIGGER); Postgres
-- invokes trigger functions regardless of the triggering role's EXECUTE
-- grant, so they never needed to be callable directly. Left at the default
-- PUBLIC-granted EXECUTE, they were reachable as unauthenticated/authenticated
-- PostgREST RPC endpoints for no reason.
revoke execute on function public.log_historique() from anon, authenticated;
revoke execute on function public.seed_dossier_acces() from anon, authenticated;
revoke execute on function public.seed_evenement_organisateur_participant() from anon, authenticated;
revoke execute on function public.set_dossier_creation_fields() from anon, authenticated;
revoke execute on function public.set_dossier_numero() from anon, authenticated;
revoke execute on function public.set_dossier_update_fields() from anon, authenticated;
revoke execute on function public.set_signature_request_update_fields() from anon, authenticated;

-- These are used inside RLS policy expressions evaluated for `authenticated`,
-- so authenticated must keep EXECUTE (revoking it would break every policy
-- that calls them). The app has no anonymous-access flows and never calls
-- these directly, so anon's EXECUTE (the Postgres default grant) is dead
-- weight that only widens the unauthenticated RPC surface.
revoke execute on function public.current_user_can_manage_dossier_acces(uuid) from anon;
revoke execute on function public.current_user_can_view_evenement_details(uuid) from anon;
revoke execute on function public.current_user_has_role(uuid, role_notarial[]) from anon;
revoke execute on function public.current_user_tenant_ids() from anon;
revoke execute on function public.generate_dossier_numero(uuid) from anon;
revoke execute on function public.is_platform_admin() from anon;
