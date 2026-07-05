-- ============================================================
-- Agenda: categories, participants, and evenements extensions
-- ============================================================

create type evenement_disponibilite as enum ('disponible', 'occupe', 'indisponible');
create type evenement_participant_statut as enum ('en_attente', 'accepte', 'decline');

-- ------------------------------------------------------------
-- Colored, tenant-scoped categories (e.g. "RDV client", "Signature", "Interne")
-- ------------------------------------------------------------
create table evenement_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  nom text not null,
  couleur text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, nom)
);

create index on evenement_categories (tenant_id);

-- ------------------------------------------------------------
-- Extend evenements
-- ------------------------------------------------------------
alter table evenements
  add column description text,
  add column categorie_id uuid references evenement_categories(id) on delete set null,
  add column all_day boolean not null default false,
  add column rrule text,
  add column rrule_exdates jsonb not null default '[]'::jsonb,
  add column recurrence_id uuid references evenements(id) on delete cascade,
  add column recurrence_original_start timestamptz,
  add column disponibilite evenement_disponibilite not null default 'occupe',
  add column organisateur_id uuid references utilisateurs(id),
  add column couleur text;

create index on evenements (categorie_id);
create index on evenements (organisateur_id);
create index on evenements (recurrence_id);

alter table evenements add constraint evenements_exception_requires_original_start
  check (recurrence_id is null or recurrence_original_start is not null);

-- ------------------------------------------------------------
-- Participants / invitees
-- ------------------------------------------------------------
create table evenement_participants (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  evenement_id uuid not null references evenements(id) on delete cascade,
  utilisateur_id uuid not null references utilisateurs(id) on delete cascade,
  is_organisateur boolean not null default false,
  statut evenement_participant_statut not null default 'en_attente',
  created_at timestamptz not null default now(),
  unique (evenement_id, utilisateur_id)
);

create index on evenement_participants (tenant_id);
create index on evenement_participants (utilisateur_id);

-- ------------------------------------------------------------
-- Keep the organizer's own participant row in sync automatically
-- (mirrors the seed_dossier_acces()-style pattern already used elsewhere)
-- ------------------------------------------------------------
create or replace function seed_evenement_organisateur_participant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.organisateur_id is not null then
    insert into evenement_participants (tenant_id, evenement_id, utilisateur_id, is_organisateur, statut)
    values (new.tenant_id, new.id, new.organisateur_id, true, 'accepte')
    on conflict (evenement_id, utilisateur_id)
    do update set is_organisateur = true, statut = 'accepte';
  end if;
  return new;
end;
$$;

create trigger evenements_seed_organisateur_participant
after insert or update of organisateur_id on evenements
for each row execute function seed_evenement_organisateur_participant();
