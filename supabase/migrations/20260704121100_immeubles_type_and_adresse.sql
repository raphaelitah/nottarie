-- Immeubles need a proper type de bien and a structured address to be usable
-- beyond a free-text désignation — needed both for display and for acte
-- generation to pull structured values (ville, code postal...) automatically.
alter table immeubles
  add column type_bien text,
  add column adresse text,
  add column ville text,
  add column code_postal text,
  add column pays text not null default 'France';
