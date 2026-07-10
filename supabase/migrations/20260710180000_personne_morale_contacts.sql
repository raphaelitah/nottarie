-- Contacts of a personne morale: physical people to reach at that organization
-- (e.g. the notaire or clerc handling a case at a confrère's étude), each
-- either an existing Personne or a free-text name, with their own role and
-- coordinates. Mirrors immeuble_proprietaires.
create table personne_morale_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  personne_morale_id uuid not null references personnes(id) on delete cascade,
  personne_physique_id uuid references personnes(id) on delete cascade,
  nom_libre text,
  fonction text,
  email text,
  telephone text,
  is_principal boolean not null default false,
  created_at timestamptz not null default now(),
  check (
    (personne_physique_id is not null and nom_libre is null) or
    (personne_physique_id is null and nom_libre is not null)
  )
);

create unique index personne_morale_contacts_morale_physique_key
  on personne_morale_contacts (personne_morale_id, personne_physique_id)
  where personne_physique_id is not null;

create index on personne_morale_contacts (tenant_id);
create index on personne_morale_contacts (personne_morale_id);
create index on personne_morale_contacts (personne_physique_id);

alter table personne_morale_contacts enable row level security;

create policy "personne_morale_contacts_select_tenant" on personne_morale_contacts
  for select to authenticated
  using (tenant_id in (select private.current_user_tenant_ids()));

create policy "personne_morale_contacts_insert_tenant" on personne_morale_contacts
  for insert to authenticated
  with check (tenant_id in (select private.current_user_tenant_ids()));

create policy "personne_morale_contacts_update_tenant" on personne_morale_contacts
  for update to authenticated
  using (tenant_id in (select private.current_user_tenant_ids()))
  with check (tenant_id in (select private.current_user_tenant_ids()));

create policy "personne_morale_contacts_delete_tenant" on personne_morale_contacts
  for delete to authenticated
  using (tenant_id in (select private.current_user_tenant_ids()));
