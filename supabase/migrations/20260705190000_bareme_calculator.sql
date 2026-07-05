-- Barème calculator: notary émoluments estimate for succession/donation dossiers.
-- Scope is the regulated notary tariff only (émoluments + TVA + a rough débours
-- estimate) — droits de mutation à titre gratuit (inheritance/gift tax) are a
-- separate progressive scale and are explicitly out of scope here.

-- Auto-populate basis: déclared value on an Immeuble, summed across a dossier's
-- linked immeubles by the calculator.
alter table immeubles add column valeur_declaree numeric;

-- Manual top-up for assets/liabilities this system doesn't model as entities
-- (cash, comptes, meubles, parts sociales for either type; passif only meaningful
-- for successions).
alter table dossiers add column autres_actifs numeric;
alter table dossiers add column passif numeric;

-- baremes previously had no way to say which acte type / tariff variant a row
-- applies to. sous_type distinguishes the 4 donation variants from Article
-- A444-67 (null for succession, which has a single scale under A444-63).
alter table baremes add column type_acte text not null default 'succession';
alter table baremes alter column type_acte drop default;
alter table baremes add column sous_type text
  check (sous_type in ('acceptee', 'non_acceptee', 'sur_acceptation', 'valeurs_mobilieres'));
alter table baremes add constraint baremes_type_acte_check
  check (type_acte in ('succession', 'donation'));
alter table baremes add constraint baremes_sous_type_only_for_donation
  check (sous_type is null or type_acte = 'donation');

create index baremes_type_acte_idx on baremes (type_acte, sous_type, version desc);

-- Writes restricted to platform admins (mirrors trame_paragraphs); the existing
-- baremes_select_all_authenticated policy already lets every tenant read rates.
create policy "baremes_platform_admin_all" on baremes
  for all to authenticated
  using (exists (select 1 from platform_admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from platform_admins where auth_user_id = auth.uid()));

-- Seed v1 rates. Source: Code de commerce, Section 3 "Tarifs des notaires"
-- (Articles A444-63 for successions, A444-67 for donations), cross-checked
-- against legifrance.gouv.fr direct article text and the notaires.fr-sourced
-- 2026 tariff summary (weblex.fr "Chiffres clés" page) on 2026-07-05; both
-- agreed on the figures below. Cited effective date on the underlying arrêté
-- varied between sources (28 Feb 2020 structural arrêté vs. a later indexation
-- arrêté) — re-verify against legifrance.gouv.fr before relying on this for a
-- rate change, since these are revalued periodically.
insert into baremes (version, libelle, type_acte, sous_type, bareme) values
(1, 'Succession — déclaration (Article A444-63)', 'succession', null, '{
  "source": "Code de commerce, Article A444-63",
  "effective_date": "2020-03-01",
  "tva_taux": 0.20,
  "csi_taux": 0.001,
  "debours_estimation_defaut": 300,
  "tranches": [
    { "jusqu_a": 6500, "taux": 0.01548 },
    { "jusqu_a": 17000, "taux": 0.00851 },
    { "jusqu_a": 30000, "taux": 0.00580 },
    { "jusqu_a": null, "taux": 0.00426 }
  ]
}'::jsonb),
(1, 'Donation acceptée (Article A444-67)', 'donation', 'acceptee', '{
  "source": "Code de commerce, Article A444-67",
  "effective_date": "2020-03-01",
  "tva_taux": 0.20,
  "csi_taux": 0.001,
  "debours_estimation_defaut": 300,
  "tranches": [
    { "jusqu_a": 6500, "taux": 0.04837 },
    { "jusqu_a": 17000, "taux": 0.01995 },
    { "jusqu_a": 60000, "taux": 0.01330 },
    { "jusqu_a": null, "taux": 0.00998 }
  ]
}'::jsonb),
(1, 'Donation non acceptée (Article A444-67)', 'donation', 'non_acceptee', '{
  "source": "Code de commerce, Article A444-67",
  "effective_date": "2020-03-01",
  "tva_taux": 0.20,
  "csi_taux": 0.001,
  "debours_estimation_defaut": 300,
  "tranches": [
    { "jusqu_a": 6500, "taux": 0.03483 },
    { "jusqu_a": 17000, "taux": 0.01437 },
    { "jusqu_a": 60000, "taux": 0.00957 },
    { "jusqu_a": null, "taux": 0.00718 }
  ]
}'::jsonb),
(1, 'Donation — sur acceptation (Article A444-67)', 'donation', 'sur_acceptation', '{
  "source": "Code de commerce, Article A444-67",
  "effective_date": "2020-03-01",
  "tva_taux": 0.20,
  "csi_taux": 0.001,
  "debours_estimation_defaut": 300,
  "tranches": [
    { "jusqu_a": 6500, "taux": 0.01355 },
    { "jusqu_a": 17000, "taux": 0.00559 },
    { "jusqu_a": 60000, "taux": 0.00373 },
    { "jusqu_a": null, "taux": 0.00280 }
  ]
}'::jsonb),
(1, 'Donation — valeurs mobilières et sommes d''argent (Article A444-67)', 'donation', 'valeurs_mobilieres', '{
  "source": "Code de commerce, Article A444-67",
  "effective_date": "2020-03-01",
  "tva_taux": 0.20,
  "csi_taux": 0.001,
  "debours_estimation_defaut": 300,
  "tranches": [
    { "jusqu_a": 6500, "taux": 0.02322 },
    { "jusqu_a": 17000, "taux": 0.00958 },
    { "jusqu_a": 60000, "taux": 0.00639 },
    { "jusqu_a": null, "taux": 0.00479 }
  ]
}'::jsonb);
