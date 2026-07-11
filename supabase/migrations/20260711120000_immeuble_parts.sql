-- Track ownership as parts (shares) in addition to the existing quote-part (%),
-- so a user can enter either one and have the other derived from it.
-- nombre_parts_total is the denominator (e.g. 100, 1000) set once per immeuble;
-- nombre_parts on each propriétaire is their numerator.
alter table immeubles add column nombre_parts_total integer;

alter table immeuble_proprietaires add column nombre_parts integer;
