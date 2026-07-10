-- Store the Tiptap JSON that produced an acte's document, so a brouillon
-- acte can be reopened in the composer and edited instead of only ever
-- being downloadable.
alter table actes add column content jsonb;
