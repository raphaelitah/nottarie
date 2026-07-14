-- Every write made via a service-role Edge Function (generate-acte,
-- acte-signature, send-email, create-calendar-event, and anything using
-- the mock signature provider) lost attribution in historique: auth.uid()
-- is null for the service-role connection, so utilisateur_id was always
-- NULL for actes/signature_requests/documents/emails/evenement_dossiers
-- writes made this way, even though the Edge Function already authenticated
-- the caller via their JWT.
--
-- Those functions now set an 'x-acting-user-id' header (the caller's
-- auth_user_id) on the admin client they use for writes. PostgREST exposes
-- request headers via the request.headers GUC, so the trigger can fall
-- back to it exactly like it already does for auth.uid() - same lookup,
-- same tenant scoping, just a different source for the raw auth id. This
-- fallback only matters for service-role connections (auth.uid() is only
-- null there); it changes nothing for ordinary client-side writes.
create or replace function log_historique()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_tenant_id uuid;
  v_dossier_id uuid;
  v_utilisateur_id uuid;
  v_details jsonb;
  v_auth_id uuid;
begin
  if TG_OP = 'DELETE' then
    v_row := old;
  else
    v_row := new;
  end if;

  v_tenant_id := v_row.tenant_id;
  if TG_TABLE_NAME = 'dossiers' then
    v_dossier_id := v_row.id;
  else
    v_dossier_id := v_row.dossier_id;
  end if;

  v_auth_id := auth.uid();
  if v_auth_id is null then
    begin
      v_auth_id := nullif(
        current_setting('request.headers', true)::json ->> 'x-acting-user-id',
        ''
      )::uuid;
    exception when others then
      v_auth_id := null;
    end;
  end if;

  select id into v_utilisateur_id from utilisateurs
  where auth_user_id = v_auth_id and tenant_id = v_tenant_id
  limit 1;

  if TG_OP = 'DELETE' then
    v_details := to_jsonb(old);
  elsif TG_OP = 'UPDATE' then
    v_details := jsonb_build_object('avant', to_jsonb(old), 'apres', to_jsonb(new));
  else
    v_details := to_jsonb(new);
  end if;

  insert into historique (tenant_id, utilisateur_id, dossier_id, action, details)
  values (v_tenant_id, v_utilisateur_id, v_dossier_id, TG_TABLE_NAME || '_' || lower(TG_OP), v_details);

  return v_row;
end;
$$;
