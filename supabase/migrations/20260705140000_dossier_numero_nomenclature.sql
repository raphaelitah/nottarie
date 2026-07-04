-- ============================================================
-- Nomenclature de dossiers: each étude configures the desired format for
-- its dossier numbers (default 'YYYY-MM-XXXX'). The sequential part (the
-- run of X's) increments by 1 for every new dossier and resets to 1 every
-- calendar year, tracked per étude in dossier_numero_compteurs. Numbers are
-- assigned automatically on insert; a duplicate is prevented at the
-- database level regardless of whether it came from auto-generation or a
-- manual override after creation.
-- ============================================================

alter table etudes
  add column dossier_numero_format text not null default 'YYYY-MM-XXXX'
  check (dossier_numero_format ~ 'X');

create table dossier_numero_compteurs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references etudes(id) on delete cascade,
  annee int not null,
  compteur int not null default 0,
  unique (tenant_id, annee)
);

create index on dossier_numero_compteurs (tenant_id);

alter table dossier_numero_compteurs enable row level security;

-- Read-only from the client (e.g. to preview the next number); the counter
-- is only ever incremented by the security-definer function below.
create policy "dossier_numero_compteurs_select_tenant" on dossier_numero_compteurs
  for select to authenticated
  using (tenant_id in (select current_user_tenant_ids()));

-- Atomically increments and returns this year's counter for the étude, then
-- formats it according to the étude's configured template. YYYY and MM are
-- replaced with the current year/month; the (single) run of X's is replaced
-- by the counter, zero-padded to the run's width.
create function generate_dossier_numero(p_tenant_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_annee int := extract(year from now());
  v_compteur int;
  v_format text;
  v_result text;
  v_x_match text;
begin
  -- This function is exposed as a callable RPC (SECURITY DEFINER), not just
  -- reached via the dossiers-insert trigger below, so it must enforce tenant
  -- isolation itself rather than relying on the caller already having passed
  -- the dossiers insert RLS check (ENF-01).
  if not exists (select 1 from utilisateurs where auth_user_id = auth.uid() and tenant_id = p_tenant_id) then
    raise exception 'Accès refusé à cette étude.';
  end if;

  insert into dossier_numero_compteurs (tenant_id, annee, compteur)
  values (p_tenant_id, v_annee, 1)
  on conflict (tenant_id, annee) do update set compteur = dossier_numero_compteurs.compteur + 1
  returning compteur into v_compteur;

  select dossier_numero_format into v_format from etudes where id = p_tenant_id;

  v_result := replace(v_format, 'YYYY', to_char(now(), 'YYYY'));
  v_result := replace(v_result, 'MM', to_char(now(), 'MM'));

  v_x_match := substring(v_result from 'X+');
  if v_x_match is not null then
    v_result := replace(v_result, v_x_match, lpad(v_compteur::text, length(v_x_match), '0'));
  end if;

  return v_result;
end;
$$;

revoke execute on function generate_dossier_numero(uuid) from anon, public;
grant execute on function generate_dossier_numero(uuid) to authenticated;

-- Generated numbers can collide with a number that was set manually (either
-- an override on an existing dossier, or legacy data predating this
-- feature), since the counter has no knowledge of those values. Skip past
-- any already-taken candidate rather than fail the insert — the counter
-- keeps advancing either way, so this always converges.
create function set_dossier_numero()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate text;
  v_attempts int := 0;
begin
  if new.numero is null or btrim(new.numero) = '' then
    loop
      v_candidate := generate_dossier_numero(new.tenant_id);
      v_attempts := v_attempts + 1;
      exit when v_attempts >= 1000 or not exists (
        select 1 from dossiers where tenant_id = new.tenant_id and numero = v_candidate
      );
    end loop;
    new.numero := v_candidate;
  end if;
  return new;
end;
$$;

create trigger dossiers_set_numero
before insert on dossiers
for each row execute function set_dossier_numero();

-- Prevent duplicate dossier numbers within an étude, whether assigned
-- automatically or set via a manual override. Prototype/dev data predates
-- this constraint, so dedupe first: keep the oldest row for each
-- (tenant_id, numero) pair and blank out the rest rather than fail the
-- migration outright.
update dossiers d
set numero = null
where numero is not null
  and id not in (
    select distinct on (tenant_id, numero) id
    from dossiers
    where numero is not null
    order by tenant_id, numero, created_at
  );

create unique index dossiers_tenant_numero_unique on dossiers (tenant_id, numero) where numero is not null;
