-- Track when a dossier's own row was last modified and by whom, so the UI
-- can show "Mis à jour : ... par ..." without inferring it from other
-- tables. Scoped to the dossiers row itself (numero/statut/type_acte/
-- notaire_id), not cascaded from child entities (comparants/immeubles/
-- actes) — those already carry their own timestamps.
alter table dossiers
  add column updated_at timestamptz not null default now(),
  add column mis_a_jour_par uuid references utilisateurs(id);

-- Backfill: prototype data predates these columns. Use créé le / créé par
-- as the initial values rather than "now" for every historical row.
update dossiers set updated_at = created_at, mis_a_jour_par = cree_par;

create index on dossiers (mis_a_jour_par);

-- updated_at/mis_a_jour_par are derived server-side, never trusted from the
-- client, and refreshed on every insert or update of the row.
create function set_dossier_update_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  new.mis_a_jour_par := (
    select id from utilisateurs
    where auth_user_id = auth.uid() and tenant_id = new.tenant_id
    limit 1
  );
  return new;
end;
$$;

create trigger dossiers_set_update_fields
before insert or update on dossiers
for each row execute function set_dossier_update_fields();
