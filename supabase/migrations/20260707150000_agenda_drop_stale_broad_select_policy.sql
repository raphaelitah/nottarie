-- evenements_select_tenant (from the original agenda_rls migration) grants
-- every tenant member unredacted SELECT on all events, including private
-- ones. It was left in place when agenda_private_events_fix_returning
-- re-granted table-level SELECT to authenticated (needed for INSERT...
-- RETURNING), silently reopening the direct-table read path that
-- agenda_private_events_lock_base_table was written to close. Only
-- evenements_select_own_write (admin/notaire or the event's own organizer)
-- should govern direct reads; everyone else must go through the redacted
-- evenements_agenda view.
drop policy "evenements_select_tenant" on evenements;
