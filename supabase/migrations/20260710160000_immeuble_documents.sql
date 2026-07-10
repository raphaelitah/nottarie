-- Allow documents to attach to an immeuble (plans, justificatif de
-- valorisation, etc.) instead of, or in addition to, a dossier/personne.
alter table documents drop constraint documents_dossier_or_personne_check;
alter table documents add column immeuble_id uuid references immeubles(id) on delete cascade;

alter table documents add constraint documents_dossier_or_personne_or_immeuble_check
  check (dossier_id is not null or personne_id is not null or immeuble_id is not null);

create index on documents (immeuble_id);
