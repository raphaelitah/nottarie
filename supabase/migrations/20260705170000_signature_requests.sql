-- ============================================================
-- Signature / AAE (ADR-02): schema backing the SignatureProvider
-- abstraction. One signature_requests row per signing process for an
-- acte; one signature_signataires row per comparant designated to sign.
-- Until ADSN/MICEN specs (EI-12) land, the only provider is 'mock' —
-- see supabase/functions/_shared/signature/.
-- ============================================================
create table signature_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  acte_id uuid not null references actes(id) on delete cascade,
  provider text not null default 'mock',
  statut text not null default 'brouillon'
    check (statut in ('brouillon', 'en_cours', 'signee', 'refusee', 'annulee')),
  external_reference text,
  document_signe_storage_path text,
  accuse_reception_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on signature_requests (acte_id);

create table signature_signataires (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  signature_request_id uuid not null references signature_requests(id) on delete cascade,
  comparant_id uuid not null references comparants(id),
  statut text not null default 'en_attente'
    check (statut in ('en_attente', 'signe', 'refuse')),
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (signature_request_id, comparant_id)
);

create index on signature_signataires (signature_request_id);

create function set_signature_request_update_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger signature_requests_set_update_fields
before update on signature_requests
for each row execute function set_signature_request_update_fields();

-- Tenant RLS, mirroring the generic policy shape from the initial RLS
-- migration (that migration's do-block already ran, so new tenant-scoped
-- tables need their own copy here).
do $$
declare
  t text;
  tenant_tables text[] := array['signature_requests', 'signature_signataires'];
begin
  foreach t in array tenant_tables loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I on %I for select to authenticated using (tenant_id in (select current_user_tenant_ids()))',
      t || '_select_tenant', t
    );
    execute format(
      'create policy %I on %I for insert to authenticated with check (tenant_id in (select current_user_tenant_ids()))',
      t || '_insert_tenant', t
    );
    execute format(
      'create policy %I on %I for update to authenticated using (tenant_id in (select current_user_tenant_ids())) with check (tenant_id in (select current_user_tenant_ids()))',
      t || '_update_tenant', t
    );
    execute format(
      'create policy %I on %I for delete to authenticated using (tenant_id in (select current_user_tenant_ids()))',
      t || '_delete_tenant', t
    );
  end loop;
end $$;

-- Historique: reuse the existing generic trigger-driven audit log.
do $$
declare
  t text;
  logged_tables text[] := array['signature_requests', 'signature_signataires'];
begin
  foreach t in array logged_tables loop
    execute format(
      'create trigger %I after insert or update or delete on %I for each row execute function log_historique()',
      t || '_log_historique', t
    );
  end loop;
end $$;
