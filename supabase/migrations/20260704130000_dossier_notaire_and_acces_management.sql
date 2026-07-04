-- Every dossier is assigned to a specific notaire of the étude (responsible
-- notaire), and tracks which utilisateur created it. Access when a dossier
-- is later marked acces_restreint defaults to these two people; the
-- notaire/creator/administrateur can then grant access to anyone else in
-- the étude via dossier_acces.
alter table dossiers
  add column notaire_id uuid references utilisateurs(id),
  add column cree_par uuid references utilisateurs(id);

-- Backfill: dev/prototype data predates this column. Assign the tenant's
-- first notaire so the upcoming NOT NULL constraint holds.
update dossiers d
set notaire_id = (
  select u.id from utilisateurs u
  where u.tenant_id = d.tenant_id and 'notaire' = any(u.roles)
  order by u.created_at
  limit 1
)
where notaire_id is null;

alter table dossiers alter column notaire_id set not null;

create index on dossiers (notaire_id);
create index on dossiers (cree_par);

-- notaire_id must reference a user holding the notaire role in the same étude.
create function validate_dossier_notaire()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from utilisateurs
    where id = new.notaire_id
      and tenant_id = new.tenant_id
      and 'notaire' = any(roles)
  ) then
    raise exception 'notaire_id must reference a user with the notaire role in the same étude';
  end if;
  return new;
end;
$$;

create trigger dossiers_validate_notaire
before insert or update of notaire_id, tenant_id on dossiers
for each row execute function validate_dossier_notaire();

-- cree_par is derived server-side from the inserting user's own membership
-- row, never trusted from the client, and immutable after creation.
create function set_dossier_creation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.cree_par := (
    select id from utilisateurs
    where auth_user_id = auth.uid() and tenant_id = new.tenant_id
    limit 1
  );
  return new;
end;
$$;

create trigger dossiers_set_creation_fields
before insert on dossiers
for each row execute function set_dossier_creation_fields();

create function lock_dossier_cree_par()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.cree_par := old.cree_par;
  return new;
end;
$$;

create trigger dossiers_lock_cree_par
before update on dossiers
for each row execute function lock_dossier_cree_par();

-- Whenever a dossier is created (or reassigned to a different notaire),
-- make sure the assigned notaire and the creator hold a dossier_acces grant
-- so they keep access once the dossier is marked acces_restreint.
create function seed_dossier_acces()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.notaire_id is not null then
    insert into dossier_acces (tenant_id, dossier_id, utilisateur_id)
    values (new.tenant_id, new.id, new.notaire_id)
    on conflict (dossier_id, utilisateur_id) do nothing;
  end if;
  if new.cree_par is not null then
    insert into dossier_acces (tenant_id, dossier_id, utilisateur_id)
    values (new.tenant_id, new.id, new.cree_par)
    on conflict (dossier_id, utilisateur_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger dossiers_seed_acces_insert
after insert on dossiers
for each row execute function seed_dossier_acces();

create trigger dossiers_seed_acces_notaire_update
after update of notaire_id on dossiers
for each row execute function seed_dossier_acces();

-- Managing who has explicit access to a dossier (dossier_acces) is reserved
-- to the dossier's assigned notaire, its creator, or an administrateur —
-- not to every tenant member as the generic tenant policy would allow.
create function current_user_can_manage_dossier_acces(p_dossier_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from dossiers d
    join utilisateurs u on u.auth_user_id = auth.uid() and u.tenant_id = d.tenant_id
    where d.id = p_dossier_id
      and (
        current_user_has_role(d.tenant_id, array['administrateur']::role_notarial[])
        or u.id = d.notaire_id
        or u.id = d.cree_par
      )
  );
$$;

drop policy "dossier_acces_insert_tenant" on dossier_acces;
drop policy "dossier_acces_update_tenant" on dossier_acces;
drop policy "dossier_acces_delete_tenant" on dossier_acces;

create policy "dossier_acces_insert_managers" on dossier_acces
  for insert to authenticated
  with check (
    tenant_id in (select current_user_tenant_ids())
    and current_user_can_manage_dossier_acces(dossier_id)
  );

create policy "dossier_acces_update_managers" on dossier_acces
  for update to authenticated
  using (current_user_can_manage_dossier_acces(dossier_id))
  with check (
    tenant_id in (select current_user_tenant_ids())
    and current_user_can_manage_dossier_acces(dossier_id)
  );

create policy "dossier_acces_delete_managers" on dossier_acces
  for delete to authenticated
  using (current_user_can_manage_dossier_acces(dossier_id));
