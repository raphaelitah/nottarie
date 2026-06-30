-- Expand etudes table with contact info and structured address fields.
-- The single 'adresse' text column is kept for backwards compatibility but
-- will be superseded by the four structured columns below.
alter table etudes
  add column if not exists telephone text,
  add column if not exists email text,
  add column if not exists adresse_ligne1 text,
  add column if not exists code_postal text,
  add column if not exists ville text,
  add column if not exists pays text not null default 'France';
