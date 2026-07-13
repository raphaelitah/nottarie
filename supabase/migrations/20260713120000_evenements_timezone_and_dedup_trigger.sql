-- Per-event IANA timezone. evenements.debut/fin remain absolute UTC
-- instants (timestamptz) — this column is purely for interpreting/
-- displaying the wall-clock time the user actually typed (e.g. a staff
-- member scheduling an 8pm New York call while sitting in Paris), not a
-- second source of truth. The Outlook sync doesn't need to read this: it
-- already sends the absolute instant with timeZone 'UTC', and Outlook
-- displays it correctly converted to each viewer's own timezone.
alter table evenements add column timezone text not null default 'Europe/Paris';

-- The duplicate-Outlook-event trigger fix (evenement_participants_outlook_sync
-- split into insert-when-not-organisateur / delete-unconditionally) is baked
-- directly into 20260712180000_evenement_outlook_syncs.sql already — a fresh
-- replay creates the correct split triggers from that file directly, so
-- there is nothing to redo here. This migration only adds the timezone
-- column; see that file's comments for the trigger race this was fixing.
