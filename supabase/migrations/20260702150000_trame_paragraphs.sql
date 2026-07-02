-- Platform-level paragraph library (national trame paragraphs), not tenant-scoped.
-- Accessible only to platform admins; no per-étude customization at this stage.

create table trame_paragraphs (
  id uuid primary key default gen_random_uuid(),
  branche branche_droit not null,
  type_acte text not null,
  category text not null,
  title text not null,
  content jsonb not null default '{}'::jsonb,
  variables jsonb not null default '[]'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trame_paragraphs_branche_type_acte_idx on trame_paragraphs (branche, type_acte, category);

create function set_trame_paragraphs_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trame_paragraphs_set_updated_at
  before update on trame_paragraphs
  for each row execute function set_trame_paragraphs_updated_at();

alter table trame_paragraphs enable row level security;

-- Platform-admin-only access (not exposed to étude tenants at all, unlike trames).
create policy "trame_paragraphs_platform_admin_all" on trame_paragraphs
  for all to authenticated
  using (exists (select 1 from platform_admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from platform_admins where auth_user_id = auth.uid()));
