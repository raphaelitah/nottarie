-- Retroactively tag the seeded succession/donation standard models' "auto" champ
-- nodes with an explicit source (see frontend/src/trames/champSource.ts), so acte
-- generation can resolve them from the dossier's comparants/étude/session instead
-- of asking the rédacteur to retype them. Relational facts (conjoint survivant,
-- lien de parenté) and narrative clauses stay manual — no comparant-linking UI
-- exists yet to resolve those automatically.
create or replace function patch_champ_source(node jsonb, mapping jsonb) returns jsonb
language plpgsql
immutable
as $$
declare
  k text;
begin
  if node->>'type' = 'champ' then
    k := node->'attrs'->>'key';
    if mapping ? k then
      return jsonb_set(node, '{attrs,source}', mapping->k);
    end if;
    return node;
  end if;

  if node ? 'content' then
    return jsonb_set(node, '{content}', (
      select coalesce(jsonb_agg(patch_champ_source(elem, mapping)), '[]'::jsonb)
      from jsonb_array_elements(node->'content') as elem
    ));
  end if;

  return node;
end;
$$;

update trame_sections
set content = patch_champ_source(content, '{
  "date_acte": "session:date_acte",
  "lieu_acte": "etude:ville",
  "notaire_nom": "session:notaire_nom",
  "etude_raison_sociale": "etude:raison_sociale",
  "etude_ville": "etude:ville",
  "etude_adresse": "etude:adresse",
  "defunt_civilite": "comparant:Défunt:civilite",
  "defunt_nom": "comparant:Défunt:nom",
  "defunt_prenoms": "comparant:Défunt:prenom",
  "defunt_date_naissance": "comparant:Défunt:date_naissance",
  "defunt_lieu_naissance": "comparant:Défunt:lieu_naissance",
  "defunt_nationalite": "comparant:Défunt:nationalite",
  "defunt_derniere_adresse": "comparant:Défunt:adresse",
  "defunt_situation_matrimoniale": "comparant:Défunt:situation_matrimoniale",
  "regime_matrimonial": "comparant:Défunt:regime_matrimonial",
  "defunt_date_deces": "comparant:Défunt:date_deces",
  "defunt_lieu_deces": "comparant:Défunt:lieu_deces"
}'::jsonb)
where type_acte = 'succession' and is_standard = true;

update trame_sections
set content = patch_champ_source(content, '{
  "date_acte": "session:date_acte",
  "lieu_acte": "etude:ville",
  "notaire_nom": "session:notaire_nom",
  "etude_raison_sociale": "etude:raison_sociale",
  "etude_ville": "etude:ville",
  "etude_adresse": "etude:adresse",
  "donateur_civilite": "comparant:Donateur:civilite",
  "donateur_nom": "comparant:Donateur:nom",
  "donateur_prenoms": "comparant:Donateur:prenom",
  "donateur_date_naissance": "comparant:Donateur:date_naissance",
  "donateur_lieu_naissance": "comparant:Donateur:lieu_naissance",
  "donateur_nationalite": "comparant:Donateur:nationalite",
  "donateur_adresse": "comparant:Donateur:adresse",
  "donateur_situation_matrimoniale": "comparant:Donateur:situation_matrimoniale",
  "donateur_regime_matrimonial": "comparant:Donateur:regime_matrimonial",
  "donataire_civilite": "comparant:Donataire:civilite",
  "donataire_nom": "comparant:Donataire:nom",
  "donataire_prenoms": "comparant:Donataire:prenom",
  "donataire_date_naissance": "comparant:Donataire:date_naissance",
  "donataire_lieu_naissance": "comparant:Donataire:lieu_naissance",
  "donataire_adresse": "comparant:Donataire:adresse"
}'::jsonb)
where type_acte = 'donation' and is_standard = true;

-- Keep the derived `variables` column in sync with the newly-tagged content —
-- same shape extractVariablesFromDoc produces client-side, deduplicated by key
-- since a few keys (date_acte, etude_ville) intentionally appear in more than
-- one champ node (e.g. the opening clause and the closing "DONT ACTE" line).
create or replace function extract_champ_variables(node jsonb, acc jsonb) returns jsonb
language plpgsql
immutable
as $$
declare
  child jsonb;
  k text;
begin
  if node->>'type' = 'champ' then
    k := node->'attrs'->>'key';
    return jsonb_set(acc, array[k], jsonb_build_object(
      'key', k,
      'label', node->'attrs'->>'label',
      'field_type', case when node->'attrs'->>'fieldType' = 'manuel' then 'manuel' else 'auto' end,
      'source', node->'attrs'->'source'
    ));
  end if;

  if node ? 'content' then
    for child in select * from jsonb_array_elements(node->'content')
    loop
      acc := extract_champ_variables(child, acc);
    end loop;
  end if;

  return acc;
end;
$$;

update trame_sections
set variables = coalesce(
  (select jsonb_agg(value) from jsonb_each(extract_champ_variables(content, '{}'::jsonb))),
  '[]'::jsonb
)
where type_acte in ('succession', 'donation') and is_standard = true;

drop function extract_champ_variables(jsonb, jsonb);
drop function patch_champ_source(jsonb, jsonb);
