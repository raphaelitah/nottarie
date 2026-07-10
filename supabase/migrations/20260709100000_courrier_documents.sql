-- Join table linking documents attached to a courrier (either picked from the
-- dossier's existing documents, or uploaded fresh alongside the courrier —
-- either way the file itself always lives as a row in `documents`).
create table courrier_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  courrier_id uuid not null references courriers(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (courrier_id, document_id)
);

alter table courrier_documents enable row level security;

create policy courrier_documents_select_tenant on courrier_documents
  for select to authenticated
  using (tenant_id in (select private.current_user_tenant_ids()));

create policy courrier_documents_insert_tenant on courrier_documents
  for insert to authenticated
  with check (tenant_id in (select private.current_user_tenant_ids()));

create policy courrier_documents_delete_tenant on courrier_documents
  for delete to authenticated
  using (tenant_id in (select private.current_user_tenant_ids()));
