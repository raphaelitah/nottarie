-- Personne/immeuble archiving (soft delete), mirroring dossier archiving
-- (20260705150000_dossier_archivage.sql). Unlike dossiers — reserved to
-- administrateur — archiving a personne or immeuble is allowed to both
-- notaire and administrateur, since these records are day-to-day working
-- data rather than the legally-scoped dossier itself.
alter table personnes add column archived_at timestamptz;
alter table immeubles add column archived_at timestamptz;

create index on personnes (archived_at);
create index on immeubles (archived_at);

-- security definer + private.current_user_has_role qualification mirrors
-- the fix applied to validate_dossier_archive_change in
-- 20260707160100_qualify_private_schema_calls_in_triggers.sql — the helper
-- lives in the private schema, not public where this trigger runs.
create function validate_personne_archive_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.archived_at is distinct from old.archived_at
     and not private.current_user_has_role(new.tenant_id, array['administrateur', 'notaire']::role_notarial[]) then
    raise exception 'Seul un notaire ou un administrateur peut archiver ou restaurer une personne';
  end if;
  return new;
end;
$$;

revoke execute on function validate_personne_archive_change() from public, anon, authenticated;

create trigger personnes_validate_archive_change
before update of archived_at on personnes
for each row execute function validate_personne_archive_change();

create function validate_immeuble_archive_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.archived_at is distinct from old.archived_at
     and not private.current_user_has_role(new.tenant_id, array['administrateur', 'notaire']::role_notarial[]) then
    raise exception 'Seul un notaire ou un administrateur peut archiver ou restaurer un immeuble';
  end if;
  return new;
end;
$$;

revoke execute on function validate_immeuble_archive_change() from public, anon, authenticated;

create trigger immeubles_validate_archive_change
before update of archived_at on immeubles
for each row execute function validate_immeuble_archive_change();
