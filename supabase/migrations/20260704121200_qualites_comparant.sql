-- Comparant "qualité" moves from freeform text to a per-étude managed list —
-- a fixed set of MVP defaults (in app code) plus whatever the étude adds via the
-- "Ajouter une qualité" flow. Renaming an existing libellé isn't supported (would
-- silently change the meaning of past comparants), so this table only supports
-- insert/select/delete, not update.
create table qualites_comparant (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  libelle text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, libelle)
);

create index on qualites_comparant (tenant_id);

alter table qualites_comparant enable row level security;

create policy "qualites_comparant_select_tenant" on qualites_comparant
  for select to authenticated
  using (tenant_id in (select current_user_tenant_ids()));

create policy "qualites_comparant_insert_tenant" on qualites_comparant
  for insert to authenticated
  with check (tenant_id in (select current_user_tenant_ids()));

create policy "qualites_comparant_delete_tenant" on qualites_comparant
  for delete to authenticated
  using (tenant_id in (select current_user_tenant_ids()));
