-- signature_requests/signature_signataires previously used the generic
-- tenant-only insert/update/delete policies (any role, just tenant
-- membership). Since statut transitions here are legally significant
-- (e.g. statut = 'signee' represents an executed AAE), any staff member —
-- not just a notaire/administrateur — could forge a "document signed"
-- state with a direct PostgREST call, bypassing the SignatureProvider
-- abstraction entirely. Restrict writes to notaire/administrateur; reads
-- stay tenant-wide so any staff member can still see signature status.
drop policy signature_requests_insert_tenant on signature_requests;
drop policy signature_requests_update_tenant on signature_requests;
drop policy signature_requests_delete_tenant on signature_requests;

create policy signature_requests_insert_notaire_admin on signature_requests
  for insert to authenticated
  with check (private.current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

create policy signature_requests_update_notaire_admin on signature_requests
  for update to authenticated
  using (private.current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]))
  with check (private.current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

create policy signature_requests_delete_notaire_admin on signature_requests
  for delete to authenticated
  using (private.current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

drop policy signature_signataires_insert_tenant on signature_signataires;
drop policy signature_signataires_update_tenant on signature_signataires;
drop policy signature_signataires_delete_tenant on signature_signataires;

create policy signature_signataires_insert_notaire_admin on signature_signataires
  for insert to authenticated
  with check (private.current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

create policy signature_signataires_update_notaire_admin on signature_signataires
  for update to authenticated
  using (private.current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]))
  with check (private.current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

create policy signature_signataires_delete_notaire_admin on signature_signataires
  for delete to authenticated
  using (private.current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));
