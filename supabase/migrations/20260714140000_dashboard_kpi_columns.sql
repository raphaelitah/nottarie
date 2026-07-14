-- Dashboard KPI groundwork (clerc test-week assessment, "Dashboard relevance
-- assessment"): "dossiers clôturés per period" can't be derived reliably
-- from updated_at (it changes on any edit, not just closure), and
-- "formalités en retard" has no due-date column to compare against at all.
-- Adds the two columns the assessment recommended before building KPI
-- tiles on top of them.
alter table dossiers add column clos_at timestamptz;
alter table formalites add column echeance date;

-- clos_at is derived automatically from the statut transition, not
-- manually entered, so it can't drift from what "closed" actually means:
-- set the first time statut becomes 'clos', cleared if ever reopened.
create function set_dossier_clos_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.statut = 'cloture' and old.statut <> 'cloture' then
    new.clos_at := now();
  elsif new.statut <> 'cloture' and old.statut = 'cloture' then
    new.clos_at := null;
  end if;
  return new;
end;
$$;

create trigger dossiers_set_clos_at
before update of statut on dossiers
for each row execute function set_dossier_clos_at();
