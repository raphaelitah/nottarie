-- Ownership of an immeuble: one or more propriétaires, each either an
-- existing Personne or a free-text name (owner not tracked as a Personne),
-- with an optional quote-part (% share). Mirrors the comparants join entity.
create table immeuble_proprietaires (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  immeuble_id uuid not null references immeubles(id) on delete cascade,
  personne_id uuid references personnes(id) on delete cascade,
  nom_libre text,
  quote_part numeric,
  created_at timestamptz not null default now(),
  check (
    (personne_id is not null and nom_libre is null) or
    (personne_id is null and nom_libre is not null)
  )
);

create unique index immeuble_proprietaires_immeuble_personne_key
  on immeuble_proprietaires (immeuble_id, personne_id)
  where personne_id is not null;

create index on immeuble_proprietaires (tenant_id);
create index on immeuble_proprietaires (immeuble_id);
create index on immeuble_proprietaires (personne_id);

alter table immeuble_proprietaires enable row level security;

create policy "immeuble_proprietaires_select_tenant" on immeuble_proprietaires
  for select to authenticated
  using (tenant_id in (select private.current_user_tenant_ids()));

create policy "immeuble_proprietaires_insert_tenant" on immeuble_proprietaires
  for insert to authenticated
  with check (tenant_id in (select private.current_user_tenant_ids()));

create policy "immeuble_proprietaires_update_tenant" on immeuble_proprietaires
  for update to authenticated
  using (tenant_id in (select private.current_user_tenant_ids()))
  with check (tenant_id in (select private.current_user_tenant_ids()));

create policy "immeuble_proprietaires_delete_tenant" on immeuble_proprietaires
  for delete to authenticated
  using (tenant_id in (select private.current_user_tenant_ids()));
