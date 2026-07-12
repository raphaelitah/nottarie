-- Outlook calendar sync (phase 1: Nottarie -> Outlook, one-way).
--
-- Each evenement can be pushed to several users' own Outlook calendars (the
-- organisateur, plus participants for private events, or every connected
-- tenant user for étude-wide events) — so unlike `evenements.outlook_event_id`
-- (populated only by the narrower create-calendar-event function, for the
-- single-organizer dossier-meeting-invite flow — untouched here), this
-- needs a per-(evenement, utilisateur) row to track each fan-out target's
-- own Graph event id independently.

create table evenement_outlook_syncs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  evenement_id uuid not null references evenements(id) on delete cascade,
  utilisateur_id uuid not null references utilisateurs(id) on delete cascade,
  outlook_event_id text,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (evenement_id, utilisateur_id)
);

create index on evenement_outlook_syncs (tenant_id);
create index on evenement_outlook_syncs (utilisateur_id);

alter table evenement_outlook_syncs enable row level security;

-- Visible to the target user themselves (so a future "synced to your
-- Outlook" indicator can query it) and to admin/notaire for support.
create policy "evenement_outlook_syncs_select_own" on evenement_outlook_syncs
  for select to authenticated
  using (
    utilisateur_id in (select id from utilisateurs where auth_user_id = auth.uid())
  );

create policy "evenement_outlook_syncs_select_admin" on evenement_outlook_syncs
  for select to authenticated
  using (private.current_user_has_role(tenant_id, array['administrateur', 'notaire']::role_notarial[]));

-- No insert/update/delete policies for authenticated: every write happens
-- from the sync-outlook-calendar Edge Function via the service-role client,
-- mirroring mailbox_connections.

-- ------------------------------------------------------------
-- DB webhook triggers: notify the sync-outlook-calendar Edge Function on
-- every change that can affect what should be on someone's Outlook
-- calendar. Fire-and-forget (pg_net async) so event writes never block on
-- an external Graph call.
--
-- The project has no pre-existing app.settings.* GUCs for the functions URL
-- / service key (checked — neither is set), so rather than depend on GUCs
-- that would need manual `ALTER DATABASE ... SET` setup outside of any
-- migration, this reuses the Vault pattern already established for mailbox
-- tokens: a random shared secret is minted once into Vault (by name, so it
-- can be looked up again without storing its uuid anywhere), sent as a
-- custom header, and the Edge Function (deployed with verify_jwt=false,
-- since a DB trigger has no user JWT to present) checks it via the same
-- Vault secret looked up by that same name.
-- ------------------------------------------------------------
create extension if not exists pg_net;

create function vault_read_secret_by_name(p_name text)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where name = p_name;
$$;

-- Postgres grants EXECUTE to PUBLIC by default on function creation, which
-- on this project cascades to anon/authenticated too — revoke from all of
-- them explicitly (checked via information_schema.routine_privileges after
-- deploy; a plain "revoke ... from public, authenticated" left anon able to
-- call this over PostgREST, caught by the security advisor).
revoke all on function vault_read_secret_by_name(text) from public, anon, authenticated, postgres;
grant execute on function vault_read_secret_by_name(text) to service_role;

do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'outlook_calendar_sync_webhook_secret') then
    perform vault.create_secret(gen_random_uuid()::text, 'outlook_calendar_sync_webhook_secret');
  end if;
end $$;

create or replace function notify_outlook_calendar_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
  webhook_secret text;
begin
  webhook_secret := vault_read_secret_by_name('outlook_calendar_sync_webhook_secret');

  payload := jsonb_build_object(
    'type', tg_op,
    'table', tg_table_name,
    'record', case when tg_op <> 'DELETE' then to_jsonb(new) else null end,
    'old_record', case when tg_op <> 'INSERT' then to_jsonb(old) else null end
  );

  perform net.http_post(
    url := 'https://pmdjlfemsnfdpcagvdjh.supabase.co/functions/v1/sync-outlook-calendar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    ),
    body := payload
  );

  return coalesce(new, old);
end;
$$;

revoke all on function notify_outlook_calendar_sync() from public, anon, authenticated;

create trigger evenements_outlook_sync
after insert or update on evenements
for each row execute function notify_outlook_calendar_sync();

create trigger evenement_participants_outlook_sync
after insert or delete on evenement_participants
for each row execute function notify_outlook_calendar_sync();

-- evenement_outlook_syncs has "on delete cascade" from evenements, so by the
-- time an AFTER DELETE trigger on evenements would run, Postgres has already
-- cascade-deleted the sync rows carrying each Outlook event's id — the async
-- webhook would then have nothing left to tell it what to delete on the
-- Outlook side, silently orphaning events. A BEFORE DELETE trigger runs
-- before that cascade, so it can snapshot the pending syncs into the
-- payload itself instead of relying on the (still-async) function to query
-- a table that will already be empty by the time it runs.
create or replace function notify_outlook_calendar_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
  webhook_secret text;
  syncs jsonb;
begin
  webhook_secret := vault_read_secret_by_name('outlook_calendar_sync_webhook_secret');

  select coalesce(jsonb_agg(jsonb_build_object('utilisateur_id', utilisateur_id, 'outlook_event_id', outlook_event_id)), '[]'::jsonb)
  into syncs
  from evenement_outlook_syncs
  where evenement_id = old.id;

  payload := jsonb_build_object(
    'type', 'DELETE',
    'table', 'evenements',
    'record', null,
    'old_record', to_jsonb(old),
    'syncs', syncs
  );

  perform net.http_post(
    url := 'https://pmdjlfemsnfdpcagvdjh.supabase.co/functions/v1/sync-outlook-calendar',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    ),
    body := payload
  );

  return old;
end;
$$;

revoke all on function notify_outlook_calendar_delete() from public, anon, authenticated;

create trigger evenements_outlook_sync_delete
before delete on evenements
for each row execute function notify_outlook_calendar_delete();
