-- Dossiers were identified only by their numéro in lists and headers. Let the
-- user name a dossier (auto-suggested from comparants client-side, editable).
alter table dossiers add column nom text;
