-- Splits birth location into structured pays/département fields (in addition to the
-- existing freeform lieu_naissance) so the "Nouvelle personne" form can offer country
-- and French département dropdowns instead of freeform text.
alter table personnes
  add column pays_naissance text,
  add column departement_naissance text;
