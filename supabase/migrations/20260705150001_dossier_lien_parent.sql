-- ============================================================
-- Lier un dossier à un dossier parent existant, à la création.
--
-- Quand un dossier est créé avec dossier_parent_id renseigné, son numéro
-- n'est pas généré via la nomenclature standard de l'étude (voir
-- dossier_numero_nomenclature) mais dérivé de celui du parent :
-- <numero du parent>_ZZZ, où ZZZ est un compteur propre au parent qui
-- commence à 001 et s'incrémente à chaque nouveau dossier lié à ce même
-- parent — quel que soit le format de numérotation du parent.
-- ============================================================

alter table dossiers
  add column dossier_parent_id uuid references dossiers(id),
  add column dossier_enfants_compteur int not null default 0,
  add constraint dossiers_parent_not_self check (dossier_parent_id is null or dossier_parent_id <> id);

create index on dossiers (dossier_parent_id);

create or replace function set_dossier_numero()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_candidate text;
  v_attempts int := 0;
  v_parent_numero text;
  v_seq int;
begin
  if new.dossier_parent_id is not null then
    select numero into v_parent_numero from dossiers
      where id = new.dossier_parent_id and tenant_id = new.tenant_id;

    if not found then
      raise exception 'Dossier parent introuvable.';
    end if;

    if v_parent_numero is null then
      raise exception 'Le dossier parent doit avoir un numéro de dossier pour permettre la liaison.';
    end if;
  end if;

  if new.numero is null or btrim(new.numero) = '' then
    if new.dossier_parent_id is not null then
      loop
        update dossiers
          set dossier_enfants_compteur = dossier_enfants_compteur + 1
          where id = new.dossier_parent_id
          returning dossier_enfants_compteur into v_seq;

        v_candidate := v_parent_numero || '_' || lpad(v_seq::text, 3, '0');
        v_attempts := v_attempts + 1;
        exit when v_attempts >= 1000 or not exists (
          select 1 from dossiers where tenant_id = new.tenant_id and numero = v_candidate
        );
      end loop;
    else
      loop
        v_candidate := generate_dossier_numero(new.tenant_id);
        v_attempts := v_attempts + 1;
        exit when v_attempts >= 1000 or not exists (
          select 1 from dossiers where tenant_id = new.tenant_id and numero = v_candidate
        );
      end loop;
    end if;
    new.numero := v_candidate;
  end if;
  return new;
end;
$$;
