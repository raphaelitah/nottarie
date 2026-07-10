-- Allow documents to attach to a personne (pièce d'identité, justificatif de
-- domicile, etc.) instead of, or in addition to, a dossier.
alter table documents alter column dossier_id drop not null;
alter table documents add column personne_id uuid references personnes(id) on delete cascade;

alter table documents add constraint documents_dossier_or_personne_check
  check (dossier_id is not null or personne_id is not null);

create index on documents (personne_id);
