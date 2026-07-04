-- Add structured address fields to personnes (code postal, ville, pays),
-- alongside the existing freeform 'adresse' (street address) column.
alter table personnes
  add column if not exists code_postal text,
  add column if not exists ville text,
  add column if not exists pays text not null default 'France';
