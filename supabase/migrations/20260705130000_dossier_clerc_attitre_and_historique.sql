-- ============================================================
-- Clerc attitré: every dossier must have an assigned clerc (redacteur).
-- Defaults to the creator when the creator holds the redacteur role;
-- otherwise the client must supply one explicitly at creation time.
-- ============================================================
alter table dossiers add column clerc_attitre_id uuid references utilisateurs(id);

-- Backfill: prefer the existing creator when they're already a clerc.
update dossiers d
set clerc_attitre_id = d.cree_par
from utilisateurs u
where u.id = d.cree_par and 'redacteur' = any(u.roles) and d.clerc_attitre_id is null;

-- Remaining rows (creator wasn't a clerc, or predate cree_par): assign the
-- tenant's first clerc so the upcoming NOT NULL constraint holds.
update dossiers d
set clerc_attitre_id = (
  select u.id from utilisateurs u
  where u.tenant_id = d.tenant_id and 'redacteur' = any(u.roles)
  order by u.created_at
  limit 1
)
where clerc_attitre_id is null;

alter table dossiers alter column clerc_attitre_id set not null;

create index on dossiers (clerc_attitre_id);

-- clerc_attitre_id must reference a user holding the redacteur role in the same étude.
create function validate_dossier_clerc()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1 from utilisateurs
    where id = new.clerc_attitre_id
      and tenant_id = new.tenant_id
      and 'redacteur' = any(roles)
  ) then
    raise exception 'clerc_attitre_id must reference a user with the redacteur role in the same étude';
  end if;
  return new;
end;
$$;

create trigger dossiers_validate_clerc
before insert or update of clerc_attitre_id, tenant_id on dossiers
for each row execute function validate_dossier_clerc();

-- Extend creation-field defaulting: cree_par is still derived server-side;
-- clerc_attitre_id defaults to the creator only if the creator is a clerc.
-- If the client already supplied a clerc_attitre_id (creator isn't a clerc,
-- so the UI asked them to pick one), that explicit choice is kept.
create or replace function set_dossier_creation_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_utilisateur_id uuid;
begin
  select id into v_utilisateur_id from utilisateurs
  where auth_user_id = auth.uid() and tenant_id = new.tenant_id
  limit 1;

  new.cree_par := v_utilisateur_id;

  if new.clerc_attitre_id is null then
    select id into new.clerc_attitre_id from utilisateurs
    where id = v_utilisateur_id and 'redacteur' = any(roles);
  end if;

  return new;
end;
$$;

-- Extend implicit-access seeding: the assigned clerc keeps access once a
-- dossier is later marked acces_restreint, same as the notaire and creator.
create or replace function seed_dossier_acces()
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
  if new.clerc_attitre_id is not null then
    insert into dossier_acces (tenant_id, dossier_id, utilisateur_id)
    values (new.tenant_id, new.id, new.clerc_attitre_id)
    on conflict (dossier_id, utilisateur_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger dossiers_seed_acces_clerc_update
after update of clerc_attitre_id on dossiers
for each row execute function seed_dossier_acces();

-- Managing dossier_acces (the "Accès" tab) is reserved to any Notaire, any
-- Administrateur, or the dossier's assigned Clerc (clerc_attitre_id) — not
-- to every tenant member, and no longer to an arbitrary creator who holds
-- neither role, now that the dedicated clerc_attitre_id field exists.
create or replace function current_user_can_manage_dossier_acces(p_dossier_id uuid)
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
        current_user_has_role(d.tenant_id, array['administrateur', 'notaire']::role_notarial[])
        or u.id = d.clerc_attitre_id
      )
  );
$$;

-- ============================================================
-- Historique: generic, trigger-driven audit log. Every insert/update/delete
-- on a dossier or one of its aggregated entities writes a row here, so the
-- "Log" tab can show a complete, tamper-resistant trace of who did what and
-- when at the dossier level (ENF-06 / EF-ACC-02). Rows are never written by
-- client code directly — only by this security-definer trigger — so the
-- generic "any tenant member can insert" policy is dropped below.
-- ============================================================
create function log_historique()
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

  select id into v_utilisateur_id from utilisateurs
  where auth_user_id = auth.uid() and tenant_id = v_tenant_id
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

do $$
declare
  t text;
  logged_tables text[] := array[
    'dossiers', 'dossier_acces', 'comparants', 'dossier_immeubles', 'actes',
    'courriers', 'formalites', 'documents', 'emails', 'simulations', 'evenement_dossiers'
  ];
begin
  foreach t in array logged_tables loop
    execute format(
      'create trigger %I after insert or update or delete on %I for each row execute function log_historique()',
      t || '_log_historique', t
    );
  end loop;
end $$;

-- historique is now system-written only (via the trigger above), never
-- inserted directly by client code.
drop policy "historique_insert_tenant" on historique;

-- A restricted dossier's log entries must respect the same visibility rule
-- as the dossier itself; entries not tied to a dossier stay tenant-wide.
drop policy "historique_select_tenant" on historique;
create policy "historique_select_tenant" on historique
  for select to authenticated
  using (
    tenant_id in (select current_user_tenant_ids())
    and (
      dossier_id is null
      or exists (
        select 1 from dossiers d
        where d.id = historique.dossier_id
          and (
            not d.acces_restreint
            or current_user_has_role(d.tenant_id, array['administrateur', 'notaire']::role_notarial[])
            or exists (
              select 1 from dossier_acces da
              join utilisateurs u on u.id = da.utilisateur_id
              where da.dossier_id = d.id and u.auth_user_id = auth.uid()
            )
          )
      )
    )
  );
