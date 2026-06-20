-- Enums
create type role_notarial as enum ('notaire', 'redacteur', 'formaliste', 'assistant', 'administrateur');
create type branche_droit as enum ('immobilier', 'famille', 'entreprise_societes');
create type regime_bien as enum ('propre', 'communaute');

-- ============================================================
-- Tenant root
-- ============================================================
create table etudes (
  id uuid primary key default gen_random_uuid(),
  raison_sociale text not null,
  adresse text,
  siret text,
  numero_chambre text,
  created_at timestamptz not null default now()
);

-- Membership: links an auth.users identity to an étude with one or more roles
create table utilisateurs (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references etudes(id) on delete cascade,
  nom text,
  prenom text,
  roles role_notarial[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (auth_user_id, tenant_id)
);

-- Security-definer helper: tenant ids the current auth user belongs to.
-- Used by every tenant-scoped RLS policy below; security definer is required
-- so the policy check can read utilisateurs without recursing into its own RLS.
create function current_user_tenant_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select tenant_id from utilisateurs where auth_user_id = auth.uid();
$$;

create function current_user_has_role(p_tenant_id uuid, p_roles role_notarial[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from utilisateurs
    where auth_user_id = auth.uid()
      and tenant_id = p_tenant_id
      and roles && p_roles
  );
$$;

-- ============================================================
-- Shared, non-tenant-scoped reference data (national library)
-- ============================================================
create table trames (
  id uuid primary key default gen_random_uuid(),
  branche branche_droit not null,
  type_acte text not null,
  nom text not null,
  contenu_docx_path text, -- path into Supabase Storage for the .docx template
  version int not null default 1,
  created_at timestamptz not null default now()
);

create table baremes (
  id uuid primary key default gen_random_uuid(),
  version int not null default 1,
  libelle text not null,
  bareme jsonb not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Tenant-scoped domain tables
-- ============================================================
create table personnes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  type text not null check (type in ('physique', 'morale', 'tiers_partenaire')),
  civilite text,
  nom text,
  prenom text,
  raison_sociale text,
  email text,
  telephone text,
  adresse text,
  created_at timestamptz not null default now()
);

create table dossiers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  numero text,
  branche branche_droit not null,
  type_acte text not null,
  statut text not null default 'ouvert',
  acces_restreint boolean not null default false,
  created_at timestamptz not null default now()
);

-- Restricts a sensitive dossier to a subset of utilisateurs (EF-ACC-01 / EF-ROL-05)
create table dossier_acces (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  utilisateur_id uuid not null references utilisateurs(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (dossier_id, utilisateur_id)
);

create table immeubles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  regime regime_bien,
  references_cadastrales text,
  designation text,
  created_at timestamptz not null default now()
);

create table dossier_immeubles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  immeuble_id uuid not null references immeubles(id) on delete cascade,
  unique (dossier_id, immeuble_id)
);

-- Comparant: join entity Personne <-> Dossier with a qualité; self-referencing
-- liens table covers contextual family links (EF-CMP-02)
create table comparants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  personne_id uuid not null references personnes(id) on delete cascade,
  qualite text not null,
  created_at timestamptz not null default now(),
  unique (dossier_id, personne_id, qualite)
);

create table comparant_liens_familiaux (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  comparant_id uuid not null references comparants(id) on delete cascade,
  comparant_lie_id uuid not null references comparants(id) on delete cascade,
  type_lien text not null,
  check (comparant_id <> comparant_lie_id)
);

-- Per-étude customization of a shared trame (EF-ADM-05) — never mutate the
-- shared trame row itself, store the override here.
create table trame_customizations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  trame_id uuid not null references trames(id) on delete cascade,
  entete text,
  clauses_specifiques jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, trame_id)
);

create table actes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  trame_id uuid not null references trames(id),
  numero text,
  statut text not null default 'brouillon',
  donnees jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table courriers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  acte_id uuid references actes(id),
  objet text,
  contenu text,
  created_at timestamptz not null default now()
);

create table formalites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  type text not null check (type in ('casier_judiciaire', 'etat_hypothecaire', 'dia', 'publicite_fonciere', 'copie_document')),
  statut text not null default 'envoyee',
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  acte_id uuid references actes(id),
  nom text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table emails (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  sens text not null check (sens in ('entrant', 'sortant')),
  objet text,
  corps text,
  created_at timestamptz not null default now()
);

create table evenements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  titre text not null,
  lieu text,
  debut timestamptz not null,
  fin timestamptz,
  outlook_event_id text,
  created_at timestamptz not null default now()
);

create table evenement_dossiers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  evenement_id uuid not null references evenements(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  unique (evenement_id, dossier_id)
);

create table simulations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  dossier_id uuid not null references dossiers(id) on delete cascade,
  type text not null check (type in ('succession', 'donation_partage')),
  donnees jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table historique (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  utilisateur_id uuid references utilisateurs(id),
  dossier_id uuid references dossiers(id),
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Indexes on tenant_id (every tenant-scoped table is filtered by it constantly)
-- ============================================================
create index on utilisateurs (tenant_id);
create index on personnes (tenant_id);
create index on dossiers (tenant_id);
create index on dossier_acces (tenant_id);
create index on immeubles (tenant_id);
create index on dossier_immeubles (tenant_id);
create index on comparants (tenant_id);
create index on comparant_liens_familiaux (tenant_id);
create index on trame_customizations (tenant_id);
create index on actes (tenant_id);
create index on courriers (tenant_id);
create index on formalites (tenant_id);
create index on documents (tenant_id);
create index on emails (tenant_id);
create index on evenements (tenant_id);
create index on evenement_dossiers (tenant_id);
create index on simulations (tenant_id);
create index on historique (tenant_id);
