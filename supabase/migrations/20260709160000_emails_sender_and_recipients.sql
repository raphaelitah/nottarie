-- Record who sent an email and who it went to, so the courrier detail view
-- can show "envoyé par X le ... à ..." plus the recipient list instead of
-- just a bare timestamp.
alter table emails
  add column utilisateur_id uuid references utilisateurs(id) on delete set null,
  add column destinataires text[] not null default '{}',
  add column cc text[] not null default '{}';
