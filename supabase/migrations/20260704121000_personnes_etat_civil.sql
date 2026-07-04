-- Comparant identity data (date de naissance, situation matrimoniale, etc.) belongs
-- on the personne, entered once when the comparant is linked to a dossier — not
-- retyped every time an acte is generated. These are only meaningful for
-- type = 'physique' but kept nullable on the shared table, consistent with the
-- existing sparse-nullable design (raison_sociale is likewise physique-irrelevant).
alter table personnes
  add column date_naissance date,
  add column lieu_naissance text,
  add column nationalite text,
  add column situation_matrimoniale text,
  add column regime_matrimonial text,
  add column date_deces date,
  add column lieu_deces text;
