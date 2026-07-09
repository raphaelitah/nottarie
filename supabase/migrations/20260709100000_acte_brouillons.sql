-- The acte composer previously had no persistence at all before "Générer":
-- closing the tab mid-edit silently lost the work. Store one draft per
-- dossier so the composer can autosave as the user types.
create table acte_brouillons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade unique,
  content jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table acte_brouillons enable row level security;

create policy "acte_brouillons_select_tenant" on acte_brouillons
  for select to authenticated
  using (tenant_id in (select private.current_user_tenant_ids()));

create policy "acte_brouillons_insert_tenant" on acte_brouillons
  for insert to authenticated
  with check (tenant_id in (select private.current_user_tenant_ids()));

create policy "acte_brouillons_update_tenant" on acte_brouillons
  for update to authenticated
  using (tenant_id in (select private.current_user_tenant_ids()))
  with check (tenant_id in (select private.current_user_tenant_ids()));

create policy "acte_brouillons_delete_tenant" on acte_brouillons
  for delete to authenticated
  using (tenant_id in (select private.current_user_tenant_ids()));
