-- GED storage (BRD 4.14): private bucket, objects live under `${tenant_id}/...`.
-- Generated actes land here now; scanned/uploaded documents (GED) reuse the same
-- bucket and folder convention later.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_bucket_select_tenant" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1]::uuid in (select current_user_tenant_ids())
  );

create policy "documents_bucket_insert_tenant" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1]::uuid in (select current_user_tenant_ids())
  );

create policy "documents_bucket_delete_tenant" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1]::uuid in (select current_user_tenant_ids())
  );
