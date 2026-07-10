-- Persist email-send failures on the courrier itself so the UI can show a
-- lasting "échec" badge (previously only a transient in-memory error banner).
alter table courriers add column dernier_envoi_echec_at timestamptz;
alter table courriers add column dernier_envoi_erreur text;
