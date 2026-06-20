revoke execute on function current_user_tenant_ids() from anon, public;
revoke execute on function current_user_has_role(uuid, role_notarial[]) from anon, public;
grant execute on function current_user_tenant_ids() to authenticated;
grant execute on function current_user_has_role(uuid, role_notarial[]) to authenticated;
