-- For testing: a tenant member with the 'administrateur' role satisfies any
-- role check within their étude, i.e. they can act as a user of any type
-- (notaire, redacteur, formaliste, assistant). Only the role-check helper
-- changes — tenant isolation (current_user_tenant_ids) is untouched.
create or replace function current_user_has_role(p_tenant_id uuid, p_roles role_notarial[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from utilisateurs
    where auth_user_id = auth.uid()
      and tenant_id = p_tenant_id
      and ('administrateur' = any(roles) or roles && p_roles)
  );
$$;
