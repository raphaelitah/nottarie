-- The previous migration (restrict_security_definer_function_execute) only
-- revoked EXECUTE from the anon/authenticated roles directly, but these
-- functions actually had EXECUTE granted to the PUBLIC pseudo-role (Postgres's
-- default for newly created functions), which every role — including
-- anon/authenticated — inherits regardless of role-specific revokes. Also
-- missed set_formalite_update_fields (a trigger function) in that pass.
revoke execute on function public.current_user_can_manage_dossier_acces(uuid) from public;
revoke execute on function public.current_user_can_view_evenement_details(uuid) from public;
revoke execute on function public.is_platform_admin() from public;
revoke execute on function public.log_historique() from public;
revoke execute on function public.seed_dossier_acces() from public;
revoke execute on function public.seed_evenement_organisateur_participant() from public;
revoke execute on function public.set_dossier_creation_fields() from public;
revoke execute on function public.set_dossier_numero() from public;
revoke execute on function public.set_dossier_update_fields() from public;
revoke execute on function public.set_signature_request_update_fields() from public;
revoke execute on function public.set_formalite_update_fields() from public, anon, authenticated;

-- Re-grant to authenticated on the ones actually used inside RLS policies /
-- app logic evaluated as authenticated (revoking PUBLIC also strips any
-- access authenticated only had by inheriting from PUBLIC).
grant execute on function public.current_user_can_manage_dossier_acces(uuid) to authenticated;
grant execute on function public.current_user_can_view_evenement_details(uuid) to authenticated;
grant execute on function public.is_platform_admin() to authenticated;
