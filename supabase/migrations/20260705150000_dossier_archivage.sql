-- ============================================================
-- Dossier archiving (soft delete): a dossier is never actually deleted.
-- An admin can archive it from the Dossiers list or from within the
-- dossier itself; it then disappears from normal listings/search and
-- shows up in the Administration > Archive tab, where an admin can
-- restore it. Both actions are just an update of archived_at, so they
-- are already captured by the existing generic historique trigger
-- (log_historique) as a "dossiers_update" entry — no extra logging code
-- needed. mis_a_jour_par (set on every update by set_dossier_update_fields)
-- doubles as "archived/restored by" for display purposes.
-- ============================================================
alter table dossiers add column archived_at timestamptz;

create index on dossiers (archived_at);

-- Archiving/restoring is reserved to administrateur (EF-ROL-01) — every
-- other field on the row stays editable by any tenant member per the
-- generic dossiers_update_tenant policy, so this is enforced with a
-- trigger rather than narrowing that policy.
create function validate_dossier_archive_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.archived_at is distinct from old.archived_at
     and not current_user_has_role(new.tenant_id, array['administrateur']::role_notarial[]) then
    raise exception 'Seul un administrateur peut archiver ou restaurer un dossier';
  end if;
  return new;
end;
$$;

create trigger dossiers_validate_archive_change
before update of archived_at on dossiers
for each row execute function validate_dossier_archive_change();
