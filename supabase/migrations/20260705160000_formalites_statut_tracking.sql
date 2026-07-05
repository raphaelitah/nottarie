-- Formalités (BRD §10 MVP): manual status tracking through the formality's
-- lifecycle, no direct ADSN/registry integration yet. Constrain statut to a
-- known set and track when it last changed so the UI can show "à jour" info
-- without inferring it from historique.
alter table formalites alter column statut set default 'a_envoyer';

update formalites set statut = 'a_envoyer' where statut = 'envoyee';

alter table formalites add constraint formalites_statut_check
  check (statut in ('a_envoyer', 'envoyee', 'relancee', 'recue', 'annulee'));

alter table formalites add column updated_at timestamptz not null default now();

create function set_formalite_update_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger formalites_set_update_fields
before update on formalites
for each row execute function set_formalite_update_fields();
