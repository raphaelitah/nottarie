-- Mailbox integration (Phase 1: Outlook email-send-as-user).
--
-- Each utilisateur can connect their own external mailbox so Nottarie can
-- send email through their real identity (lands in their own Sent Items,
-- shows their real address to the recipient) rather than a shared étude
-- mailbox. This is deliberately per-user, not per-tenant: visibility below
-- is owner-scoped, not the generic tenant-wide RLS loop used elsewhere.

create type mailbox_provider as enum ('outlook');

-- ------------------------------------------------------------
-- Vault wrapper functions: the only way in or out of vault.secrets for
-- this feature. Never grant these to anything but service_role — the
-- Edge Functions are the only callers, using the service-role client.
-- ------------------------------------------------------------
create function vault_store_secret(p_secret text)
returns uuid
language sql
security definer
set search_path = public, vault
as $$
  select vault.create_secret(p_secret);
$$;

create function vault_read_secret(p_secret_id uuid)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where id = p_secret_id;
$$;

create function vault_update_secret(p_secret_id uuid, p_secret text)
returns void
language sql
security definer
set search_path = public, vault
as $$
  select vault.update_secret(p_secret_id, p_secret);
$$;

create function vault_delete_secret(p_secret_id uuid)
returns void
language sql
security definer
set search_path = public, vault
as $$
  delete from vault.secrets where id = p_secret_id;
$$;

revoke all on function vault_store_secret(text) from public, authenticated;
revoke all on function vault_read_secret(uuid) from public, authenticated;
revoke all on function vault_update_secret(uuid, text) from public, authenticated;
revoke all on function vault_delete_secret(uuid) from public, authenticated;
grant execute on function vault_store_secret(text) to service_role;
grant execute on function vault_read_secret(uuid) to service_role;
grant execute on function vault_update_secret(uuid, text) to service_role;
grant execute on function vault_delete_secret(uuid) to service_role;

-- ------------------------------------------------------------
-- mailbox_connections: one row per (utilisateur, provider). Tokens
-- themselves live in Vault; only opaque secret ids are stored here.
-- ------------------------------------------------------------
create table mailbox_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  utilisateur_id uuid not null references utilisateurs(id) on delete cascade,
  provider mailbox_provider not null default 'outlook',
  email_address text not null,
  -- Nullable, not FK-enforced into vault.secrets (Vault isn't a normal join
  -- target): null once disconnect() deletes the underlying Vault secrets.
  access_token_secret_id uuid,
  refresh_token_secret_id uuid,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'revoked', 'error')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (utilisateur_id, provider),
  check (status <> 'active' or (access_token_secret_id is not null and refresh_token_secret_id is not null and token_expires_at is not null))
);

create index on mailbox_connections (tenant_id);
create index on mailbox_connections (utilisateur_id);

create function set_mailbox_connection_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger mailbox_connections_set_updated_at
before update on mailbox_connections
for each row execute function set_mailbox_connection_updated_at();

alter table mailbox_connections enable row level security;

-- Owner sees only their own connection.
create policy "mailbox_connections_select_own" on mailbox_connections
  for select to authenticated
  using (
    utilisateur_id in (select id from utilisateurs where auth_user_id = auth.uid())
  );

-- Admin/notaire of the étude can see connection status tenant-wide (for
-- onboarding/support — "who hasn't connected Outlook yet"). Safe to expose:
-- the row never holds raw tokens, only secret ids meaningless without
-- service-role access to vault.decrypted_secrets.
create policy "mailbox_connections_select_admin" on mailbox_connections
  for select to authenticated
  using (current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

-- No insert/update/delete policies for authenticated at all: every write
-- goes through an Edge Function using the service-role client (mirrors
-- utilisateurs writes via invite-user/admin-user-action).

-- ------------------------------------------------------------
-- mailbox_oauth_states: short-lived bridge between the "start" and
-- "exchange" steps of the OAuth dance. service_role-only — no policies
-- means authenticated is default-denied even with RLS enabled.
-- ------------------------------------------------------------
create table mailbox_oauth_states (
  state text primary key,
  tenant_id uuid not null references etudes(id) on delete cascade,
  utilisateur_id uuid not null references utilisateurs(id) on delete cascade,
  code_challenge text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '10 minutes'
);

alter table mailbox_oauth_states enable row level security;

-- ------------------------------------------------------------
-- emails: start recording real sends. sens/dossier_id/objet/corps already
-- existed but nothing wrote to this table before this feature.
-- ------------------------------------------------------------
alter table emails
  add column provider mailbox_provider,
  add column provider_message_id text,
  add column courrier_id uuid references courriers(id) on delete set null;
