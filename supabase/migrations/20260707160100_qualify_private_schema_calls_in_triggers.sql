-- set_dossier_numero and validate_dossier_archive_change (triggers) also call
-- private-schema helpers unqualified from public-schema, search_path=public
-- bodies; qualify both now that the callees live in private. Also lock down
-- validate_dossier_archive_change's default PUBLIC-granted EXECUTE — it's a
-- trigger function only, same class as the other trigger-function lockdowns.
create or replace function public.set_dossier_numero()
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
        v_candidate := private.generate_dossier_numero(new.tenant_id);
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

create or replace function public.validate_dossier_archive_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.archived_at is distinct from old.archived_at
     and not private.current_user_has_role(new.tenant_id, array['administrateur']::role_notarial[]) then
    raise exception 'Seul un administrateur peut archiver ou restaurer un dossier';
  end if;
  return new;
end;
$$;

revoke execute on function public.validate_dossier_archive_change() from public, anon, authenticated;
