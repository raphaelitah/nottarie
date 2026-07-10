-- The composer had no naming step: actes were identified only by their
-- generated document's filename. Let the user give the acte a name when
-- they start drafting it, carried from the pre-generation brouillon
-- through to the final acte row.
alter table acte_brouillons add column nom text;
alter table actes add column nom text;
