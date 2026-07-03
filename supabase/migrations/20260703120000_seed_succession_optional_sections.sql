-- Optional/addable trame_sections for type_acte = 'succession' (Droit de la famille).
-- Covers the categories of scenarios a notaire/clerc may need to add on top of the
-- standard acte de notoriété model: representation variants, cross-border elements,
-- devolution edge cases, successoral option variants, asset inventories, foncier
-- publicity variants, tax/legal mentions, free observations and fee arrangements.
-- Authored as Tiptap JSON (see frontend/src/admin/trames/editor); 'variables' is
-- derived from the 'champ' nodes exactly as extractVariablesFromDoc() would.

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Comparution / représentation des parties',
  'Comparution par mandataire (procuration)',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Comparution par mandataire","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"mandant_nom","label":"Nom et qualité du mandant représenté","fieldType":"manuel"}},{"type":"text","text":", ci-après désigné, non comparant, a donné pouvoir à "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"mandataire_identification","label":"Identification complète du mandataire (nom, prénoms, adresse)","fieldType":"manuel"}},{"type":"text","text":", ci-après désigné, aux termes d'une procuration en date du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"procuration_date","label":"Date de la procuration","fieldType":"manuel"}},{"type":"text","text":", dont une copie authentique demeure ci-annexée après avoir été signée « ne varietur » par le mandataire et le notaire soussigné."}]},{"type":"paragraph","content":[{"type":"text","text":"Le mandataire, ès qualités, déclare que les pouvoirs de son mandant n'ont fait l'objet d'aucune révocation à sa connaissance."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"mandant_nom","label":"Nom et qualité du mandant représenté","field_type":"manuel"},{"key":"mandataire_identification","label":"Identification complète du mandataire (nom, prénoms, adresse)","field_type":"manuel"},{"key":"procuration_date","label":"Date de la procuration","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Comparution / représentation des parties',
  'Comparution du représentant légal d''un mineur',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Représentation d'un héritier mineur","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"mineur_nom","label":"Identification de l'héritier mineur","fieldType":"manuel"}},{"type":"text","text":", héritier en la succession, est représenté aux présentes par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"representant_legal_identification","label":"Identification du ou des représentants légaux (parents titulaires de l'autorité parentale)","fieldType":"manuel"}},{"type":"text","text":", agissant en qualité d'administrateur légal de ses biens, conformément aux articles 382 et suivants du Code civil."}]},{"type":"paragraph","content":[{"type":"text","text":"Le représentant légal déclare ne pas être placé sous un régime restreignant l'exercice de l'administration légale et affirme agir dans l'intérêt exclusif du mineur."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"mineur_nom","label":"Identification de l'héritier mineur","field_type":"manuel"},{"key":"representant_legal_identification","label":"Identification du ou des représentants légaux (parents titulaires de l'autorité parentale)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Comparution / représentation des parties',
  'Comparution du tuteur d''un majeur protégé',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Représentation d'un héritier majeur sous tutelle","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"protege_nom","label":"Identification de l'héritier majeur protégé","fieldType":"manuel"}},{"type":"text","text":", héritier en la succession, placé sous le régime de la tutelle par jugement du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"jugement_tutelle_date","label":"Date et juridiction du jugement de tutelle","fieldType":"manuel"}},{"type":"text","text":", est représenté aux présentes par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"tuteur_identification","label":"Identification du tuteur","fieldType":"manuel"}},{"type":"text","text":", agissant en qualité de tuteur."}]},{"type":"paragraph","content":[{"type":"text","text":"Le tuteur déclare intervenir en vertu de l'autorisation du conseil de famille, ou à défaut du juge des tutelles, en date du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"autorisation_tutelle_date","label":"Date de l'autorisation du conseil de famille ou du juge des tutelles","fieldType":"manuel"}},{"type":"text","text":", dont une copie demeure ci-annexée, conformément à l'article 507 du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"protege_nom","label":"Identification de l'héritier majeur protégé","field_type":"manuel"},{"key":"jugement_tutelle_date","label":"Date et juridiction du jugement de tutelle","field_type":"manuel"},{"key":"tuteur_identification","label":"Identification du tuteur","field_type":"manuel"},{"key":"autorisation_tutelle_date","label":"Date de l'autorisation du conseil de famille ou du juge des tutelles","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Comparution / représentation des parties',
  'Comparution du curateur assistant un majeur en curatelle',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Assistance d'un héritier majeur sous curatelle","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"protege_nom","label":"Identification de l'héritier majeur protégé","fieldType":"manuel"}},{"type":"text","text":", héritier en la succession, placé sous le régime de la curatelle par jugement du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"jugement_curatelle_date","label":"Date et juridiction du jugement de curatelle","fieldType":"manuel"}},{"type":"text","text":", intervient aux présentes assisté de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"curateur_identification","label":"Identification du curateur","fieldType":"manuel"}},{"type":"text","text":", son curateur, conformément à l'article 467 du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"protege_nom","label":"Identification de l'héritier majeur protégé","field_type":"manuel"},{"key":"jugement_curatelle_date","label":"Date et juridiction du jugement de curatelle","field_type":"manuel"},{"key":"curateur_identification","label":"Identification du curateur","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Comparution / représentation des parties',
  'Comparution de l''habilité familial',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Représentation par un habilité familial","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"protege_nom","label":"Identification de l'héritier majeur protégé","fieldType":"manuel"}},{"type":"text","text":", héritier en la succession, est représenté aux présentes par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"habilite_identification","label":"Identification de la personne habilitée","fieldType":"manuel"}},{"type":"text","text":", habilité(e) à cet effet par décision du juge des tutelles en date du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"habilitation_date","label":"Date et étendue de l'habilitation familiale","fieldType":"manuel"}},{"type":"text","text":", conformément aux articles 494-1 et suivants du Code civil, dont une copie demeure ci-annexée."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"protege_nom","label":"Identification de l'héritier majeur protégé","field_type":"manuel"},{"key":"habilite_identification","label":"Identification de la personne habilitée","field_type":"manuel"},{"key":"habilitation_date","label":"Date et étendue de l'habilitation familiale","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Comparution / représentation des parties',
  'Comparution d''un mandataire successoral',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Intervention du mandataire successoral","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"mandataire_successoral_identification","label":"Identification du mandataire successoral","fieldType":"manuel"}},{"type":"text","text":", désigné en qualité de mandataire successoral "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"mandataire_successoral_origine","label":"Origine du mandat (mandat conventionnel post mortem ou désignation judiciaire) et étendue des pouvoirs","fieldType":"manuel"}},{"type":"text","text":", intervient aux présentes dans la limite des pouvoirs qui lui ont été conférés."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"mandataire_successoral_identification","label":"Identification du mandataire successoral","field_type":"manuel"},{"key":"mandataire_successoral_origine","label":"Origine du mandat (mandat conventionnel post mortem ou désignation judiciaire) et étendue des pouvoirs","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Comparution / représentation des parties',
  'Comparution d''un légataire personne morale',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Comparution du légataire personne morale","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"legataire_personne_morale_denomination","label":"Dénomination, forme et siège du légataire personne morale (association, fondation, collectivité publique)","fieldType":"manuel"}},{"type":"text","text":", légataire aux termes du testament du défunt, est représenté(e) aux présentes par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"representant_personne_morale_identification","label":"Identification du représentant légal de la personne morale et justification de ses pouvoirs","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Le représentant déclare que la personne morale légataire dispose de la capacité de recevoir à titre gratuit et, le cas échéant, que l'autorisation administrative requise a été obtenue."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"legataire_personne_morale_denomination","label":"Dénomination, forme et siège du légataire personne morale (association, fondation, collectivité publique)","field_type":"manuel"},{"key":"representant_personne_morale_identification","label":"Identification du représentant légal de la personne morale et justification de ses pouvoirs","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Comparution / représentation des parties',
  'Comparution de l''État ou du curateur à succession vacante',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Représentation de la succession vacante","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"En l'absence d'héritier connu, ou en présence d'une renonciation de l'ensemble des héritiers, la succession a été déclarée vacante par ordonnance du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"ordonnance_vacance_date","label":"Date et juridiction de l'ordonnance constatant la vacance","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"curateur_succession_identification","label":"Identité du curateur désigné à la succession vacante (Direction nationale d'interventions domaniales ou mandataire judiciaire)","fieldType":"manuel"}},{"type":"text","text":", curateur, intervient aux présentes ès qualités."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"ordonnance_vacance_date","label":"Date et juridiction de l'ordonnance constatant la vacance","field_type":"manuel"},{"key":"curateur_succession_identification","label":"Identité du curateur désigné à la succession vacante (Direction nationale d'interventions domaniales ou mandataire judiciaire)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Comparution / représentation des parties',
  'Comparution d''un héritier présumé absent',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Situation d'un héritier présumé absent","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"absent_nom","label":"Identification de l'héritier présumé absent","fieldType":"manuel"}},{"type":"text","text":", héritier en la succession, fait l'objet d'une présomption d'absence constatée par jugement du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"jugement_absence_date","label":"Date et juridiction du jugement de présomption d'absence","fieldType":"manuel"}},{"type":"text","text":", conformément à l'article 112 du Code civil."}]},{"type":"paragraph","content":[{"type":"text","text":"Ses droits dans la présente succession sont, dans l'attente, gérés par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"representant_absent_identification","label":"Identification du représentant de l'absent","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"absent_nom","label":"Identification de l'héritier présumé absent","field_type":"manuel"},{"key":"jugement_absence_date","label":"Date et juridiction du jugement de présomption d'absence","field_type":"manuel"},{"key":"representant_absent_identification","label":"Identification du représentant de l'absent","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Comparution / représentation des parties',
  'Signature à distance (visioconférence)',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Comparution par voie de visioconférence","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Conformément aux dispositions autorisant le recours à la signature à distance en matière d'acte authentique électronique, "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"comparant_distance_nom","label":"Identification du comparant intervenant à distance","fieldType":"manuel"}},{"type":"text","text":" a comparu par le moyen d'une visioconférence, dans les conditions garantissant l'identification certaine de son consentement, la retransmission continue et simultanée des images et du son, ainsi que la confidentialité de la transmission."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"comparant_distance_nom","label":"Identification du comparant intervenant à distance","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Identification du défunt — cas particuliers',
  'Défunt de nationalité étrangère ou résidant à l''étranger',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Résidence habituelle à l'étranger et loi applicable","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt avait, au jour de son décès, sa résidence habituelle à "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"defunt_residence_habituelle_etranger","label":"Pays de résidence habituelle du défunt au jour du décès","fieldType":"auto"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"En application de l'article 21 du Règlement (UE) n° 650/2012 du 4 juillet 2012, la loi applicable à l'ensemble de la succession est celle de l'État de la résidence habituelle du défunt au jour du décès, sauf rattachement manifestement plus étroit avec un autre État ou exercice d'une professio juris."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"professio_juris","label":"Choix de loi (professio juris) éventuellement exercé par le défunt en faveur de sa loi nationale","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"defunt_residence_habituelle_etranger","label":"Pays de résidence habituelle du défunt au jour du décès","field_type":"auto"},{"key":"professio_juris","label":"Choix de loi (professio juris) éventuellement exercé par le défunt en faveur de sa loi nationale","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Identification du défunt — cas particuliers',
  'Historique des unions successives',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Historique matrimonial du défunt","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt a été marié successivement ainsi qu'il suit :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"historique_unions","label":"Détail des unions successives du défunt (identité des conjoints, dates de mariage, régimes matrimoniaux, dates et causes de dissolution)","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"historique_unions","label":"Détail des unions successives du défunt (identité des conjoints, dates de mariage, régimes matrimoniaux, dates et causes de dissolution)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Identification du défunt — cas particuliers',
  'Défunt pacsé',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Pacte civil de solidarité du défunt","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt était lié par un pacte civil de solidarité conclu le "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"pacs_date","label":"Date de conclusion du PACS","fieldType":"auto"}},{"type":"text","text":" avec "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"partenaire_pacs_nom","label":"Identification du partenaire de PACS survivant","fieldType":"auto"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Il est rappelé que le partenaire lié par un pacte civil de solidarité n'a pas la qualité d'héritier légal du défunt et ne recueille de droits dans la présente succession qu'en vertu d'une disposition testamentaire ou d'une donation."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"pacs_date","label":"Date de conclusion du PACS","field_type":"auto"},{"key":"partenaire_pacs_nom","label":"Identification du partenaire de PACS survivant","field_type":"auto"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Identification du défunt — cas particuliers',
  'Défunt en concubinage',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Situation de concubinage","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt vivait en concubinage notoire avec "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"concubin_nom","label":"Identification du concubin survivant","fieldType":"manuel"}},{"type":"text","text":" depuis le "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"concubinage_date_debut","label":"Date de début du concubinage","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Il est rappelé que le concubin survivant n'a pas la qualité d'héritier et ne peut recueillir de droits dans la succession qu'en vertu d'une disposition testamentaire à son profit."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"concubin_nom","label":"Identification du concubin survivant","field_type":"manuel"},{"key":"concubinage_date_debut","label":"Date de début du concubinage","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Identification du défunt — cas particuliers',
  'Changement de régime matrimonial en cours d''union',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Changement de régime matrimonial","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Les époux ont modifié leur régime matrimonial initial aux termes d'un acte reçu par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"changement_regime_notaire","label":"Notaire et date de l'acte de changement de régime matrimonial","fieldType":"manuel"}},{"type":"text","text":", adoptant le régime de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"nouveau_regime_matrimonial","label":"Régime matrimonial adopté à la suite du changement","fieldType":"manuel"}},{"type":"text","text":", homologué s'il y a lieu par le tribunal judiciaire compétent."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"changement_regime_notaire","label":"Notaire et date de l'acte de changement de régime matrimonial","field_type":"manuel"},{"key":"nouveau_regime_matrimonial","label":"Régime matrimonial adopté à la suite du changement","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Identification du défunt — cas particuliers',
  'Absence ou disparition du défunt',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Jugement déclaratif de décès ou d'absence","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"En l'absence de constat matériel du décès, la succession s'ouvre sur le fondement d'un jugement déclaratif de décès rendu le "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"jugement_declaratif_deces_date","label":"Date et juridiction du jugement déclaratif de décès (ou d'absence transformée en déclaration de décès)","fieldType":"manuel"}},{"type":"text","text":", transcrit sur les registres de l'état civil, qui produit les effets d'un acte de décès conformément à l'article 91 du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"jugement_declaratif_deces_date","label":"Date et juridiction du jugement déclaratif de décès (ou d'absence transformée en déclaration de décès)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Identification du défunt — cas particuliers',
  'Délivrance d''un certificat successoral européen',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Certificat successoral européen","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"À la demande des comparants, et la succession présentant un élément d'extranéité au sens du Règlement (UE) n° 650/2012, le notaire soussigné établira, en sus du présent acte, un certificat successoral européen destiné à être utilisé par les héritiers, légataires ou exécuteurs testamentaires dans un autre État membre."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"csi_usage_prevu","label":"État membre et usage prévu du certificat successoral européen","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"csi_usage_prevu","label":"État membre et usage prévu du certificat successoral européen","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Identification du défunt — cas particuliers',
  'Rectification d''état civil du défunt',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Rectification de l'état civil du défunt","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il a été constaté une discordance entre les pièces d'état civil produites et l'identité du défunt telle qu'elle résulte des documents fonciers ou bancaires, à savoir : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"rectification_etat_civil_detail","label":"Nature de la discordance et pièce justifiant la rectification ou l'identité réelle du défunt","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"rectification_etat_civil_detail","label":"Nature de la discordance et pièce justifiant la rectification ou l'identité réelle du défunt","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dispositions de dernières volontés — variations',
  'Testament olographe',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Présence d'un testament olographe","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt a laissé un testament olographe daté du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"testament_olographe_date","label":"Date du testament olographe","fieldType":"auto"}},{"type":"text","text":", déposé au rang des minutes de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"testament_olographe_notaire_depositaire","label":"Notaire dépositaire du testament olographe","fieldType":"auto"}},{"type":"text","text":" aux termes d'un procès-verbal d'ouverture et de description en date du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"testament_olographe_pv_date","label":"Date du procès-verbal d'ouverture et de description","fieldType":"auto"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Les dispositions de ce testament sont rappelées ci-après : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"testament_olographe_dispositions","label":"Résumé des dispositions testamentaires","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"testament_olographe_date","label":"Date du testament olographe","field_type":"auto"},{"key":"testament_olographe_notaire_depositaire","label":"Notaire dépositaire du testament olographe","field_type":"auto"},{"key":"testament_olographe_pv_date","label":"Date du procès-verbal d'ouverture et de description","field_type":"auto"},{"key":"testament_olographe_dispositions","label":"Résumé des dispositions testamentaires","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dispositions de dernières volontés — variations',
  'Testament authentique ou mystique',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Présence d'un testament authentique ou mystique","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt a laissé un testament "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"testament_forme","label":"Forme du testament (authentique ou mystique)","fieldType":"auto"}},{"type":"text","text":" reçu par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"testament_notaire_redacteur","label":"Notaire rédacteur ou dépositaire du testament","fieldType":"auto"}},{"type":"text","text":" le "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"testament_date","label":"Date du testament","fieldType":"auto"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Les dispositions de ce testament sont rappelées ci-après : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"testament_dispositions","label":"Résumé des dispositions testamentaires","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"testament_forme","label":"Forme du testament (authentique ou mystique)","field_type":"auto"},{"key":"testament_notaire_redacteur","label":"Notaire rédacteur ou dépositaire du testament","field_type":"auto"},{"key":"testament_date","label":"Date du testament","field_type":"auto"},{"key":"testament_dispositions","label":"Résumé des dispositions testamentaires","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dispositions de dernières volontés — variations',
  'Donation-partage antérieure',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation-partage antérieure","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt avait consenti, du vivant des donataires, une donation-partage reçue par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donation_partage_notaire","label":"Notaire rédacteur de la donation-partage antérieure","fieldType":"manuel"}},{"type":"text","text":" le "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donation_partage_date","label":"Date de la donation-partage antérieure","fieldType":"manuel"}},{"type":"text","text":", au profit de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donation_partage_beneficiaires","label":"Bénéficiaires et objet de la donation-partage","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Il conviendra de tenir compte de cette donation-partage pour la liquidation de la présente succession, notamment au regard de la réévaluation éventuelle des biens allotis en application de l'article 1078 du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donation_partage_notaire","label":"Notaire rédacteur de la donation-partage antérieure","field_type":"manuel"},{"key":"donation_partage_date","label":"Date de la donation-partage antérieure","field_type":"manuel"},{"key":"donation_partage_beneficiaires","label":"Bénéficiaires et objet de la donation-partage","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dispositions de dernières volontés — variations',
  'Donation entre époux / institution contractuelle',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation entre époux (donation au dernier vivant)","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Les époux s'étaient consenti une donation entre époux (donation au dernier vivant) aux termes d'un acte reçu par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donation_dernier_vivant_notaire","label":"Notaire rédacteur de la donation entre époux","fieldType":"auto"}},{"type":"text","text":" le "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donation_dernier_vivant_date","label":"Date de la donation entre époux","fieldType":"auto"}},{"type":"text","text":", comportant les avantages suivants au profit du conjoint survivant : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donation_dernier_vivant_teneur","label":"Teneur des avantages consentis (quotité disponible spéciale entre époux, article 1094-1 du Code civil)","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donation_dernier_vivant_notaire","label":"Notaire rédacteur de la donation entre époux","field_type":"auto"},{"key":"donation_dernier_vivant_date","label":"Date de la donation entre époux","field_type":"auto"},{"key":"donation_dernier_vivant_teneur","label":"Teneur des avantages consentis (quotité disponible spéciale entre époux, article 1094-1 du Code civil)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dispositions de dernières volontés — variations',
  'Pacte successoral',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Pacte successoral","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il a été constaté l'existence d'un pacte successoral, à savoir : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"pacte_successoral_nature","label":"Nature du pacte (renonciation anticipée à l'action en réduction, pacte Dutreil, pacte de famille) et parties concernées","fieldType":"manuel"}},{"type":"text","text":", reçu par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"pacte_successoral_notaire_date","label":"Notaire rédacteur et date du pacte successoral","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"pacte_successoral_nature","label":"Nature du pacte (renonciation anticipée à l'action en réduction, pacte Dutreil, pacte de famille) et parties concernées","field_type":"manuel"},{"key":"pacte_successoral_notaire_date","label":"Notaire rédacteur et date du pacte successoral","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dispositions de dernières volontés — variations',
  'Mandat à effet posthume',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Mandat à effet posthume","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt avait donné mandat, à effet posthume, à "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"mandataire_posthume_identification","label":"Identification du mandataire à effet posthume","fieldType":"manuel"}},{"type":"text","text":", aux termes d'un acte reçu par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"mandat_posthume_notaire_date","label":"Notaire rédacteur et date du mandat à effet posthume","fieldType":"manuel"}},{"type":"text","text":", aux fins d'administrer ou de gérer, pour le compte des héritiers, tout ou partie de la succession, conformément aux articles 812 et suivants du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"mandataire_posthume_identification","label":"Identification du mandataire à effet posthume","field_type":"manuel"},{"key":"mandat_posthume_notaire_date","label":"Notaire rédacteur et date du mandat à effet posthume","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dispositions de dernières volontés — variations',
  'Clause bénéficiaire d''assurance-vie',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Contrats d'assurance-vie hors succession","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt était titulaire du ou des contrats d'assurance-vie suivants, dont le capital est stipulé payable, en dehors des règles de la dévolution successorale, au(x) bénéficiaire(s) désigné(s) : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"assurance_vie_beneficiaires_detail","label":"Détail des contrats d'assurance-vie, assureurs, et bénéficiaires désignés","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Il est précisé que ce capital n'entre pas dans l'actif successoral, sous réserve de l'application des articles L. 132-13 et L. 132-14 du Code des assurances en cas de primes manifestement exagérées."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"assurance_vie_beneficiaires_detail","label":"Détail des contrats d'assurance-vie, assureurs, et bénéficiaires désignés","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dispositions de dernières volontés — variations',
  'Révocation ou caducité d''un testament antérieur',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Révocation ou caducité d'un testament antérieur","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il a été établi que le défunt avait antérieurement rédigé un testament en date du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"testament_anterieur_date","label":"Date du testament antérieur révoqué ou caduc","fieldType":"manuel"}},{"type":"text","text":", lequel a été "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"testament_anterieur_sort","label":"Cause de révocation ou de caducité (testament postérieur incompatible, prédécès du légataire, révocation expresse)","fieldType":"manuel"}},{"type":"text","text":" et ne saurait en conséquence recevoir application."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"testament_anterieur_date","label":"Date du testament antérieur révoqué ou caduc","field_type":"manuel"},{"key":"testament_anterieur_sort","label":"Cause de révocation ou de caducité (testament postérieur incompatible, prédécès du légataire, révocation expresse)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Enfants issus de plusieurs lits',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Enfants issus de plusieurs unions","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt laisse pour lui succéder des enfants issus de plusieurs unions, à savoir : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"enfants_plusieurs_lits_detail","label":"Détail des enfants par union (filiation, union d'origine)","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"enfants_plusieurs_lits_detail","label":"Détail des enfants par union (filiation, union d'origine)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Enfant adopté',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Filiation adoptive","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"enfant_adopte_nom","label":"Identification de l'enfant adopté","fieldType":"manuel"}},{"type":"text","text":" a fait l'objet d'une adoption "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"adoption_forme","label":"Forme de l'adoption (simple ou plénière) et date du jugement ou de l'acte","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Il est rappelé qu'en cas d'adoption plénière, l'adopté a, dans la famille de l'adoptant, les mêmes droits et obligations qu'un enfant dont la filiation est établie, et perd tout lien de filiation avec sa famille d'origine (article 356 du Code civil), tandis qu'en cas d'adoption simple, l'adopté conserve ses droits héréditaires dans sa famille d'origine en sus de ceux acquis dans la famille adoptante (article 368 du Code civil)."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"enfant_adopte_nom","label":"Identification de l'enfant adopté","field_type":"manuel"},{"key":"adoption_forme","label":"Forme de l'adoption (simple ou plénière) et date du jugement ou de l'acte","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Enfant né sous X',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Filiation incertaine — accouchement sous le secret","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il a été porté à la connaissance du notaire soussigné l'existence possible d'un enfant né dans le secret de la naissance (accouchement « sous X ») dont la filiation à l'égard du défunt reste à établir ou à écarter."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"accouchement_secret_situation","label":"Situation exposée et démarches entreprises (recherche auprès du CNAOP, action en établissement ou contestation de filiation)","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"accouchement_secret_situation","label":"Situation exposée et démarches entreprises (recherche auprès du CNAOP, action en établissement ou contestation de filiation)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Enfant posthume',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Enfant posthume","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Au jour du décès du défunt, son épouse ou sa compagne était enceinte d'un enfant à naître, lequel, s'il naît viable, sera appelé à la succession en application de l'article 725 du Code civil, sous réserve d'être conçu avant le décès."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"enfant_posthume_situation","label":"Date prévue de naissance et suites données à la présente succession","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"enfant_posthume_situation","label":"Date prévue de naissance et suites données à la présente succession","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Représentation successorale',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Représentation successorale","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"representant_descendant_identification","label":"Identification du ou des descendants venant par représentation","fieldType":"manuel"}},{"type":"text","text":" viennent à la présente succession par représentation de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"represente_identification","label":"Identification de l'enfant prédécédé ou renonçant représenté","fieldType":"manuel"}},{"type":"text","text":", conformément aux articles 751 et suivants du Code civil, et recueillent ensemble la part que celui-ci aurait recueillie s'il avait survécu ou n'avait pas renoncé."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"representant_descendant_identification","label":"Identification du ou des descendants venant par représentation","field_type":"manuel"},{"key":"represente_identification","label":"Identification de l'enfant prédécédé ou renonçant représenté","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Indignité successorale',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Indignité successorale","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"indigne_identification","label":"Identification de l'héritier exclu pour indignité","fieldType":"manuel"}},{"type":"text","text":" a été déclaré indigne de succéder par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"indignite_fondement","label":"Fondement de l'indignité (indignité de plein droit ou facultative, décision judiciaire le cas échéant) en application des articles 726 et suivants du Code civil","fieldType":"manuel"}},{"type":"text","text":" et se trouve, en conséquence, exclu de la succession, sans préjudice du droit à représentation de ses propres descendants."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"indigne_identification","label":"Identification de l'héritier exclu pour indignité","field_type":"manuel"},{"key":"indignite_fondement","label":"Fondement de l'indignité (indignité de plein droit ou facultative, décision judiciaire le cas échéant) en application des articles 726 et suivants du Code civil","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Exhérédation, réserve héréditaire et quotité disponible',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Réserve héréditaire et quotité disponible","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"En présence d'héritiers réservataires, la quotité disponible dont le défunt pouvait librement disposer à titre gratuit s'établit, conformément aux articles 912 et suivants du Code civil, à : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"quotite_disponible_calcul","label":"Calcul de la réserve héréditaire globale et de la quotité disponible selon le nombre d'enfants ou la présence du conjoint","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Les dispositions à titre gratuit consenties par le défunt excédant cette quotité disponible seraient, le cas échéant, sujettes à réduction dans les conditions prévues aux articles 920 et suivants du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"quotite_disponible_calcul","label":"Calcul de la réserve héréditaire globale et de la quotité disponible selon le nombre d'enfants ou la présence du conjoint","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Légataire universel en présence d''héritiers réservataires',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Légataire universel et héritiers réservataires","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"legataire_universel_nom","label":"Identification du légataire universel institué par testament","fieldType":"manuel"}},{"type":"text","text":" a été institué légataire universel par le défunt. La succession comportant des héritiers réservataires, ce légataire ne recueillera que la quotité disponible et devra, pour entrer en possession de son legs, obtenir la délivrance amiable des héritiers réservataires ou, à défaut, l'exercer en justice, conformément à l'article 1004 du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"legataire_universel_nom","label":"Identification du légataire universel institué par testament","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Légataire à titre universel',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Légataire à titre universel","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"legataire_titre_universel_nom","label":"Identification du légataire à titre universel","fieldType":"manuel"}},{"type":"text","text":" a été institué légataire à titre universel d'une quote-part de la succession, à savoir : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"legataire_titre_universel_quotite","label":"Quotité ou catégorie de biens visée par le legs à titre universel","fieldType":"manuel"}},{"type":"text","text":", conformément à l'article 1010 du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"legataire_titre_universel_nom","label":"Identification du légataire à titre universel","field_type":"manuel"},{"key":"legataire_titre_universel_quotite","label":"Quotité ou catégorie de biens visée par le legs à titre universel","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Légataire à titre particulier',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Légataire à titre particulier","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"legataire_particulier_nom","label":"Identification du légataire à titre particulier","fieldType":"manuel"}},{"type":"text","text":" est bénéficiaire d'un legs particulier portant sur : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"legataire_particulier_objet","label":"Désignation du ou des biens légués à titre particulier","fieldType":"manuel"}},{"type":"text","text":", conformément à l'article 1002 du Code civil. Ce legs devra être délivré par les héritiers tenus de la délivrance."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"legataire_particulier_nom","label":"Identification du légataire à titre particulier","field_type":"manuel"},{"key":"legataire_particulier_objet","label":"Désignation du ou des biens légués à titre particulier","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Rapport des libéralités antérieures',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Rapport des libéralités","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il a été porté à la connaissance du notaire soussigné les libéralités antérieures suivantes, consenties par le défunt à des héritiers présomptifs venant à la succession, sujettes à rapport en application des articles 843 et suivants du Code civil, sauf dispense de rapport expresse : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"libéralités_rapportables_detail","label":"Détail des libéralités antérieures rapportables (nature, date, bénéficiaire, valeur)","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"libéralités_rapportables_detail","label":"Détail des libéralités antérieures rapportables (nature, date, bénéficiaire, valeur)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Réduction des libéralités excessives',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Action en réduction","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Les libéralités consenties par le défunt excédant la quotité disponible, les héritiers réservataires lésés disposent de l'action en réduction prévue aux articles 920 et suivants du Code civil, dans le délai de cinq ans à compter de l'ouverture de la succession ou de deux ans à compter du jour où ils en ont eu connaissance."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"action_reduction_situation","label":"Position exprimée par les héritiers réservataires quant à l'exercice ou la renonciation à cette action","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"action_reduction_situation","label":"Position exprimée par les héritiers réservataires quant à l'exercice ou la renonciation à cette action","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Option du conjoint survivant : usufruit total ou quart en propriété',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Option du conjoint survivant","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"En présence d'enfants tous issus des deux époux, le conjoint survivant dispose, en application de l'article 757 du Code civil, d'une option entre l'usufruit de la totalité des biens existants et la propriété du quart des biens, en présence d'enfants non communs."}]},{"type":"paragraph","content":[{"type":"text","text":"Le conjoint survivant déclare opter pour : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"option_conjoint_survivant_choix","label":"Option exercée par le conjoint survivant (usufruit total ou quart en propriété) et modalités","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"option_conjoint_survivant_choix","label":"Option exercée par le conjoint survivant (usufruit total ou quart en propriété) et modalités","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Droit temporaire et droit viager au logement',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Droits au logement du conjoint survivant","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le conjoint survivant bénéficie de plein droit, pendant l'année suivant le décès, de la jouissance gratuite du logement qu'il occupait effectivement à titre d'habitation principale ainsi que du mobilier le garnissant, en application de l'article 763 du Code civil."}]},{"type":"paragraph","content":[{"type":"text","text":"Le conjoint survivant déclare, le cas échéant, exercer son droit viager au logement conformément à l'article 764 du Code civil : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"droit_viager_logement_exercice","label":"Exercice et modalités du droit viager au logement, délai d'un an suivant le décès","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"droit_viager_logement_exercice","label":"Exercice et modalités du droit viager au logement, délai d'un an suivant le décès","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Partenaire pacsé survivant légataire',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Legs au profit du partenaire pacsé survivant","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"partenaire_pacs_legataire_nom","label":"Identification du partenaire de PACS survivant, légataire","fieldType":"auto"}},{"type":"text","text":" a été institué légataire par le défunt aux termes du testament susvisé, ce partenaire n'ayant pas, à défaut de disposition testamentaire, vocation héréditaire légale."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"partenaire_pacs_legs_objet","label":"Objet et étendue du legs consenti au partenaire de PACS","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"partenaire_pacs_legataire_nom","label":"Identification du partenaire de PACS survivant, légataire","field_type":"auto"},{"key":"partenaire_pacs_legs_objet","label":"Objet et étendue du legs consenti au partenaire de PACS","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Éléments d''extranéité',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Successions internationales","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente succession comporte les éléments d'extranéité suivants : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"elements_extraneite_detail","label":"Détail des éléments d'extranéité (nationalité, résidence, biens situés à l'étranger des parties ou du défunt)","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"En conséquence, il conviendra de déterminer la loi applicable à la succession, ainsi que, le cas échéant, la loi applicable aux biens immobiliers situés à l'étranger, ceux-ci demeurant soumis à la loi du lieu de leur situation pour les aspects relevant de la publicité foncière locale."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"elements_extraneite_detail","label":"Détail des éléments d'extranéité (nationalité, résidence, biens situés à l'étranger des parties ou du défunt)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Succession vacante ou en déshérence',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Succession vacante ou en déshérence","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Aucun héritier ne s'étant présenté, ou l'ensemble des héritiers connus ayant renoncé, la succession a été déclarée vacante conformément à l'article 809 du Code civil."}]},{"type":"paragraph","content":[{"type":"text","text":"À défaut de tout héritier, la succession est dévolue à l'État en déshérence, conformément à l'article 539 du Code civil, sous réserve de la procédure d'envoi en possession requise."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Dévolution successorale — cas particuliers',
  'Dévolution aux collatéraux et ascendants',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Dévolution aux collatéraux et ascendants","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"À défaut de descendant et de conjoint survivant, la succession est dévolue aux ascendants et collatéraux du défunt selon l'ordre et les degrés fixés par les articles 734 et suivants du Code civil, à savoir : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"collateraux_ascendants_detail","label":"Détail des héritiers par ordre et par degré (père et mère, frères et sœurs, ascendants et collatéraux ordinaires) et répartition entre les lignes paternelle et maternelle","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"collateraux_ascendants_detail","label":"Détail des héritiers par ordre et par degré (père et mère, frères et sœurs, ascendants et collatéraux ordinaires) et répartition entre les lignes paternelle et maternelle","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Option successorale — variations',
  'Acceptation pure et simple',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Acceptation pure et simple","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"heritier_acceptant_ps_nom","label":"Identification du ou des héritiers acceptants purement et simplement","fieldType":"manuel"}},{"type":"text","text":" déclare(nt) accepter purement et simplement la succession, conformément à l'article 782 du Code civil, et répondre indéfiniment du passif successoral, y compris sur ses (leurs) biens personnels."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"heritier_acceptant_ps_nom","label":"Identification du ou des héritiers acceptants purement et simplement","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Option successorale — variations',
  'Acceptation à concurrence de l''actif net',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Acceptation à concurrence de l'actif net","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"heritier_acceptant_can_nom","label":"Identification du ou des héritiers optant pour l'acceptation à concurrence de l'actif net","fieldType":"manuel"}},{"type":"text","text":" déclare(nt) accepter la succession à concurrence de l'actif net, conformément aux articles 787 et suivants du Code civil."}]},{"type":"paragraph","content":[{"type":"text","text":"Cette déclaration fera l'objet d'un dépôt au greffe du tribunal judiciaire compétent et d'une publicité au sein du Bulletin officiel des annonces civiles et commerciales (BODACC), et sera suivie de l'établissement d'un inventaire de la succession par un commissaire de justice ou un notaire dans les délais légaux."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"inventaire_can_modalites","label":"Modalités et calendrier de l'inventaire à établir","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"heritier_acceptant_can_nom","label":"Identification du ou des héritiers optant pour l'acceptation à concurrence de l'actif net","field_type":"manuel"},{"key":"inventaire_can_modalites","label":"Modalités et calendrier de l'inventaire à établir","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Option successorale — variations',
  'Renonciation à la succession',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Renonciation à la succession","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"heritier_renoncant_nom","label":"Identification du ou des héritiers renonçants","fieldType":"manuel"}},{"type":"text","text":" déclare(nt) renoncer purement et simplement à la succession, conformément à l'article 804 du Code civil, cette renonciation ayant fait ou devant faire l'objet d'une déclaration au greffe du tribunal judiciaire dans le ressort duquel la succession s'est ouverte."}]},{"type":"paragraph","content":[{"type":"text","text":"Le renonçant est réputé n'avoir jamais été héritier ; sa part accroît à ses représentants ou, à défaut, à ses cohéritiers."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"heritier_renoncant_nom","label":"Identification du ou des héritiers renonçants","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Option successorale — variations',
  'Renonciation en faveur de cohéritiers désignés',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Renonciation en faveur d'un ou plusieurs cohéritiers","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"renoncant_faveur_nom","label":"Identification de l'héritier renonçant","fieldType":"manuel"}},{"type":"text","text":" déclare renoncer à ses droits dans la succession au profit exclusif de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"beneficiaires_renonciation_nom","label":"Identification du ou des cohéritiers bénéficiaires de la renonciation","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Il est précisé que, sur le plan civil, cette renonciation emporte les effets d'une renonciation pure et simple assortie d'une libéralité au profit des bénéficiaires désignés, dont le régime fiscal propre devra être examiné."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"renoncant_faveur_nom","label":"Identification de l'héritier renonçant","field_type":"manuel"},{"key":"beneficiaires_renonciation_nom","label":"Identification du ou des cohéritiers bénéficiaires de la renonciation","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Option successorale — variations',
  'Renonciation anticipée à l''action en réduction (RAAR)',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Renonciation anticipée à l'action en réduction","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il a été constaté qu'un ou plusieurs héritiers réservataires avaient antérieurement consenti une renonciation anticipée à l'action en réduction (RAAR), conformément aux articles 929 et suivants du Code civil, aux termes d'un acte reçu par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"raar_notaire_date","label":"Notaire rédacteur et date de la renonciation anticipée à l'action en réduction","fieldType":"manuel"}},{"type":"text","text":", au profit de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"raar_beneficiaire","label":"Bénéficiaire et étendue de la renonciation anticipée","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"raar_notaire_date","label":"Notaire rédacteur et date de la renonciation anticipée à l'action en réduction","field_type":"manuel"},{"key":"raar_beneficiaire","label":"Bénéficiaire et étendue de la renonciation anticipée","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Option successorale — variations',
  'Sommation d''opter',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Sommation de prendre parti","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"heritier_somme_nom","label":"Identification de l'héritier sommé de prendre parti","fieldType":"manuel"}},{"type":"text","text":" a fait l'objet d'une sommation de prendre parti sur son option successorale, à la requête de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"requerant_sommation","label":"Identification de la partie ayant fait délivrer la sommation (créancier, cohéritier)","fieldType":"manuel"}},{"type":"text","text":", conformément à l'article 771 du Code civil, ouvrant un délai de deux mois pour opter, à l'expiration duquel l'héritier est réputé acceptant pur et simple à défaut de réponse."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"heritier_somme_nom","label":"Identification de l'héritier sommé de prendre parti","field_type":"manuel"},{"key":"requerant_sommation","label":"Identification de la partie ayant fait délivrer la sommation (créancier, cohéritier)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Option successorale — variations',
  'Option pour un mineur ou un majeur protégé',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Option successorale exercée pour un héritier protégé","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"L'option successorale de l'héritier mineur ou majeur protégé ne peut être exercée qu'à concurrence de l'actif net, conformément à l'article 461 (par renvoi) et à l'article 507-1 du Code civil, sauf autorisation du juge des tutelles ou du conseil de famille pour accepter purement et simplement ou pour renoncer."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"autorisation_option_protege","label":"Décision d'autorisation obtenue (juge des tutelles ou conseil de famille), date et teneur","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"autorisation_option_protege","label":"Décision d'autorisation obtenue (juge des tutelles ou conseil de famille), date et teneur","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Option successorale — variations',
  'Succession insolvable / bénéfice d''inventaire',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Succession manifestement insolvable","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il apparaît que le passif de la succession excède manifestement son actif. Les héritiers sont informés de la faculté d'accepter à concurrence de l'actif net ou de renoncer, afin de ne pas répondre du passif sur leurs biens personnels."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"insolvabilite_situation","label":"Détail de la situation d'insolvabilité et décision envisagée par les héritiers","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"insolvabilite_situation","label":"Détail de la situation d'insolvabilité et décision envisagée par les héritiers","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Option successorale — variations',
  'Faculté de cantonnement',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Faculté de cantonnement","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"beneficiaire_cantonnement_nom","label":"Identification du conjoint survivant ou du légataire exerçant la faculté de cantonnement","fieldType":"manuel"}},{"type":"text","text":" déclare exercer la faculté de cantonner son émolument sur une partie seulement des biens dont il a été disposé en sa faveur, conformément à l'article 1002-1 du Code civil, la portion non recueillie profitant aux autres successibles sans qu'il en résulte de leur part une libéralité."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"cantonnement_biens_retenus","label":"Désignation des biens sur lesquels le cantonnement est exercé","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"beneficiaire_cantonnement_nom","label":"Identification du conjoint survivant ou du légataire exerçant la faculté de cantonnement","field_type":"manuel"},{"key":"cantonnement_biens_retenus","label":"Désignation des biens sur lesquels le cantonnement est exercé","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Attestation de notoriété — variations',
  'Recours à des attestations testimoniales',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Attestations testimoniales","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La preuve de la qualité d'héritier ne pouvant être rapportée avec certitude par les seules pièces d'état civil, il a été recueilli les attestations de deux témoins, n'ayant aucun intérêt à la succession, à savoir : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"temoins_identification","label":"Identification des deux témoins et teneur de leurs attestations","fieldType":"manuel"}},{"type":"text","text":", conformément à l'article 730-1 du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"temoins_identification","label":"Identification des deux témoins et teneur de leurs attestations","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Attestation de notoriété — variations',
  'Rectification d''un acte de notoriété antérieur',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Rectification d'un acte de notoriété antérieur","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il a été précédemment dressé un acte de notoriété en date du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"notoriete_anterieure_date","label":"Date et notaire rédacteur de l'acte de notoriété antérieur à rectifier","fieldType":"manuel"}},{"type":"text","text":", lequel comportait l'erreur ou l'omission suivante : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"notoriete_anterieure_erreur","label":"Nature de l'erreur ou de l'omission à rectifier","fieldType":"manuel"}},{"type":"text","text":". Le présent acte a pour objet de rectifier et, en tant que de besoin, de compléter les énonciations de l'acte de notoriété susvisé."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"notoriete_anterieure_date","label":"Date et notaire rédacteur de l'acte de notoriété antérieur à rectifier","field_type":"manuel"},{"key":"notoriete_anterieure_erreur","label":"Nature de l'erreur ou de l'omission à rectifier","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Comptes bancaires et produits d''épargne',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Comptes bancaires et produits d'épargne","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt était titulaire des comptes et produits d'épargne suivants (comptes courants, livrets réglementés, plans d'épargne logement, plans d'épargne en actions) :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"comptes_bancaires_detail","label":"Détail des comptes bancaires et produits d'épargne (établissement, numéro, solde au jour du décès)","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"comptes_bancaires_detail","label":"Détail des comptes bancaires et produits d'épargne (établissement, numéro, solde au jour du décès)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Valeurs mobilières',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Valeurs mobilières et portefeuille-titres","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt était titulaire du ou des portefeuilles de valeurs mobilières suivants :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"valeurs_mobilieres_detail","label":"Détail du portefeuille-titres (établissement teneur de compte, composition, valorisation au jour du décès)","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"valeurs_mobilieres_detail","label":"Détail du portefeuille-titres (établissement teneur de compte, composition, valorisation au jour du décès)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Contrats d''assurance-vie',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Contrats d'assurance-vie recensés dans la succession","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il est fait état, à titre informatif et sans préjudice de leur qualification hors succession, des contrats d'assurance-vie souscrits par le défunt :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"contrats_assurance_vie_inventaire","label":"Inventaire des contrats d'assurance-vie souscrits par le défunt (compagnie, numéro, valeur de rachat)","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"contrats_assurance_vie_inventaire","label":"Inventaire des contrats d'assurance-vie souscrits par le défunt (compagnie, numéro, valeur de rachat)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Entreprise individuelle',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Entreprise individuelle du défunt","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt exploitait, à titre individuel, l'entreprise ou le fonds suivant :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"entreprise_individuelle_detail","label":"Désignation de l'entreprise individuelle (nature de l'activité, numéro SIREN, valeur estimée du fonds)","fieldType":"manuel"}}]},{"type":"paragraph","content":[{"type":"text","text":"Les héritiers seront informés des modalités de poursuite, de cession ou de dissolution de cette entreprise, ainsi que, le cas échéant, des dispositifs d'exonération partielle des droits de mutation applicables (pacte Dutreil, article 787 C du Code général des impôts)."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"entreprise_individuelle_detail","label":"Désignation de l'entreprise individuelle (nature de l'activité, numéro SIREN, valeur estimée du fonds)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Parts sociales et actions',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Parts sociales et actions de sociétés","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt détenait les parts sociales ou actions suivantes :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"parts_sociales_detail","label":"Détail des parts sociales/actions détenues (société, forme, nombre de titres, valeur)","fieldType":"manuel"}}]},{"type":"paragraph","content":[{"type":"text","text":"Il conviendra de vérifier les clauses statutaires applicables (agrément, préemption, continuation) régissant la transmission de ces titres aux héritiers."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"parts_sociales_detail","label":"Détail des parts sociales/actions détenues (société, forme, nombre de titres, valeur)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Immeubles situés en France',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Immeubles dépendant de la succession — désignation cadastrale","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Dépend de la succession le ou les immeubles ci-après désignés :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"immeubles_designation_cadastrale","label":"Désignation cadastrale complète des immeubles (commune, section, numéro, lieudit, contenance, nature)","fieldType":"manuel"}}]},{"type":"paragraph","content":[{"type":"text","text":"Origine de propriété : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"immeubles_origine_propriete","label":"Origine de propriété de chaque immeuble","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"immeubles_designation_cadastrale","label":"Désignation cadastrale complète des immeubles (commune, section, numéro, lieudit, contenance, nature)","field_type":"manuel"},{"key":"immeubles_origine_propriete","label":"Origine de propriété de chaque immeuble","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Immeubles situés à l''étranger',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Immeubles situés à l'étranger","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Dépend de la succession le ou les immeubles suivants, situés à l'étranger :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"immeubles_etranger_detail","label":"Désignation des immeubles situés à l'étranger et pays de situation","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Il est rappelé que la transmission de ces biens demeure régie, quant aux modalités de publicité et de mutation, par la loi du lieu de leur situation, indépendamment de la loi applicable au règlement civil de la succession."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"immeubles_etranger_detail","label":"Désignation des immeubles situés à l'étranger et pays de situation","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Meubles meublants et objets de valeur',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Meubles meublants et objets de valeur","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Dépendent en outre de la succession les meubles meublants, bijoux et objets d'art suivants :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"meubles_objets_valeur_detail","label":"Inventaire des meubles meublants et objets de valeur, avec estimation","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"meubles_objets_valeur_detail","label":"Inventaire des meubles meublants et objets de valeur, avec estimation","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Véhicules',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Véhicules","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Dépend(ent) de la succession le ou les véhicules suivants :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"vehicules_detail","label":"Désignation des véhicules (marque, modèle, numéro d'immatriculation, valeur)","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"vehicules_detail","label":"Désignation des véhicules (marque, modèle, numéro d'immatriculation, valeur)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Actifs numériques et cryptoactifs',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Actifs numériques et cryptoactifs","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt détenait les actifs numériques suivants, dont l'accès et le transfert appelleront des diligences particulières auprès des prestataires de services concernés :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"actifs_numeriques_detail","label":"Détail des cryptoactifs, comptes en ligne, portefeuilles numériques et de leurs modalités d'accès connues","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"actifs_numeriques_detail","label":"Détail des cryptoactifs, comptes en ligne, portefeuilles numériques et de leurs modalités d'accès connues","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Droits de propriété intellectuelle',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Droits de propriété intellectuelle","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt était titulaire des droits de propriété intellectuelle suivants, transmis à ses héritiers ou légataires dans les conditions de droit commun ou selon les règles particulières du Code de la propriété intellectuelle :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"droits_propriete_intellectuelle_detail","label":"Détail des droits d'auteur, brevets, marques ou autres droits de propriété intellectuelle du défunt","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"droits_propriete_intellectuelle_detail","label":"Détail des droits d'auteur, brevets, marques ou autres droits de propriété intellectuelle du défunt","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Dettes et passif de la succession',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Passif de la succession","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La succession supporte le passif suivant, sous réserve de vérification définitive :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"passif_succession_detail","label":"Détail du passif (emprunts en cours, dettes fiscales, frais funéraires, autres dettes)","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Les frais funéraires sont, conformément à l'usage, prélevés par priorité sur l'actif successoral."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"passif_succession_detail","label":"Détail du passif (emprunts en cours, dettes fiscales, frais funéraires, autres dettes)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Indivision successorale préexistante',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Indivision préexistant au décès","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt était déjà titulaire, avant son décès, de droits indivis sur les biens suivants, en concours avec des tiers ou avec un ou plusieurs des héritiers :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"indivision_preexistante_detail","label":"Détail des biens détenus en indivision antérieurement au décès et identité des autres indivisaires","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"indivision_preexistante_detail","label":"Détail des biens détenus en indivision antérieurement au décès et identité des autres indivisaires","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Comptes joints et solidarité bancaire',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Comptes joints","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le défunt était cotitulaire des comptes joints suivants, lesquels continuent, sauf stipulation contraire, à fonctionner sous la seule signature du ou des cotitulaires survivants, sans préjudice de l'obligation de porter le solde du compte, pour la part présumée appartenir au défunt, à l'actif de la succession :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"comptes_joints_detail","label":"Détail des comptes joints (établissement, cotitulaire survivant, quote-part présumée du défunt)","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"comptes_joints_detail","label":"Détail des comptes joints (établissement, cotitulaire survivant, quote-part présumée du défunt)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Consistance de la succession / actifs',
  'Contrats de prévoyance et capital décès',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Contrats de prévoyance et capital décès","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il est fait état des contrats de prévoyance ou capitaux décès suivants, souscrits par le défunt à titre individuel ou au titre d'un contrat collectif d'entreprise :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"prevoyance_capital_deces_detail","label":"Détail des contrats de prévoyance et capitaux décès et de leurs bénéficiaires","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"prevoyance_capital_deces_detail","label":"Détail des contrats de prévoyance et capitaux décès et de leurs bénéficiaires","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Publicité foncière — variations',
  'Attestation immobilière séparée',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Établissement d'une attestation immobilière séparée","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La succession comprenant des immeubles ou droits immobiliers, le présent acte de notoriété ne valant pas titre publiable, il sera établi une attestation immobilière séparée reprenant les effets du présent acte quant à la dévolution de ces biens, laquelle sera publiée au service de la publicité foncière compétent conformément au décret n° 55-22 du 4 janvier 1955."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Publicité foncière — variations',
  'Immeuble sous statut de copropriété',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Immeuble soumis au statut de la copropriété","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"L'immeuble dépendant de la succession est soumis au statut de la copropriété des immeubles bâtis (loi n° 65-557 du 10 juillet 1965)."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"copropriete_reglement_reference","label":"Référence de publication du règlement de copropriété et de l'état descriptif de division","fieldType":"auto"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Le syndic de la copropriété a été informé du décès du copropriétaire aux fins de mise à jour du carnet d'entretien et de la répartition des charges."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"copropriete_reglement_reference","label":"Référence de publication du règlement de copropriété et de l'état descriptif de division","field_type":"auto"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Publicité foncière — variations',
  'Immeuble grevé d''hypothèque ou de privilège',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Sûretés grevant les immeubles de la succession","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"L'immeuble susdésigné demeure grevé de l'inscription suivante, prise au profit de : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"surete_immeuble_detail","label":"Nature de la sûreté (hypothèque, privilège de prêteur de deniers), bénéficiaire, montant garanti et référence de publication","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"surete_immeuble_detail","label":"Nature de la sûreté (hypothèque, privilège de prêteur de deniers), bénéficiaire, montant garanti et référence de publication","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Publicité foncière — variations',
  'Bien démembré antérieurement au décès',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Bien préalablement démembré","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"L'immeuble susdésigné faisait l'objet, antérieurement au décès, d'un démembrement de propriété entre le défunt et un tiers, à savoir :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"demembrement_anterieur_detail","label":"Répartition de l'usufruit et de la nue-propriété avant le décès, et effet du décès sur la réunion des attributs de la propriété","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"demembrement_anterieur_detail","label":"Répartition de l'usufruit et de la nue-propriété avant le décès, et effet du décès sur la réunion des attributs de la propriété","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Mentions légales et fiscales',
  'Déclaration de succession — délai et modalités',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Déclaration de succession","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Les héritiers sont informés qu'une déclaration de succession devra être déposée auprès du service des impôts compétent dans un délai de six mois à compter du décès lorsque celui-ci est survenu en France métropolitaine, et de douze mois dans les autres cas, conformément à l'article 641 du Code général des impôts."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"declaration_succession_modalites","label":"Modalités retenues (dépôt par un héritier mandaté, recours à l'assistance du notaire)","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"declaration_succession_modalites","label":"Modalités retenues (dépôt par un héritier mandaté, recours à l'assistance du notaire)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Mentions légales et fiscales',
  'Régime fiscal et abattements',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Régime fiscal applicable et abattements","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Les droits de mutation par décès dus par chaque héritier ou légataire seront calculés selon le barème progressif prévu à l'article 777 du Code général des impôts, après application des abattements personnels prévus à l'article 779 du même code selon le lien de parenté avec le défunt."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"abattements_fiscaux_detail","label":"Détail des abattements applicables par héritier ou légataire","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"abattements_fiscaux_detail","label":"Détail des abattements applicables par héritier ou légataire","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Mentions légales et fiscales',
  'Rappel des donations antérieures',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Rappel fiscal des donations antérieures","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Conformément à l'article 784 du Code général des impôts, il est rappelé les donations antérieures suivantes, consenties par le défunt aux héritiers ou légataires, dont il devra être tenu compte pour l'application des abattements et du barème progressif :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donations_anterieures_fiscal_detail","label":"Détail des donations antérieures consenties par le défunt (bénéficiaire, date, valeur, droits acquittés)","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donations_anterieures_fiscal_detail","label":"Détail des donations antérieures consenties par le défunt (bénéficiaire, date, valeur, droits acquittés)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Mentions légales et fiscales',
  'Exonérations spécifiques',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Exonérations spécifiques de droits de mutation","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il est rappelé que certaines transmissions bénéficient d'une exonération totale ou partielle de droits de mutation par décès, notamment la part recueillie par le conjoint survivant ou le partenaire de PACS survivant (article 796-0 bis du Code général des impôts), ou celle des victimes de certains actes de guerre ou de terrorisme."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"exoneration_specifique_applicable","label":"Exonération spécifique invoquée et bénéficiaire concerné","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"exoneration_specifique_applicable","label":"Exonération spécifique invoquée et bénéficiaire concerné","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Mentions légales et fiscales',
  'Gel des avoirs et sanctions internationales',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Vigilance renforcée — gel des avoirs","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le notaire soussigné a procédé à la vérification de l'absence d'inscription des comparants et du défunt sur les listes de personnes faisant l'objet de mesures de gel des avoirs ou de sanctions financières internationales, conformément à ses obligations de vigilance renforcée en matière de lutte contre le blanchiment de capitaux et le financement du terrorisme."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Mentions légales et fiscales',
  'Déclaration de soupçon TRACFIN',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Obligation déclarative TRACFIN","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Conformément aux articles L. 561-1 et suivants du Code monétaire et financier, le notaire soussigné rappelle qu'il est tenu, en cas de soupçon relatif à l'origine ou à la destination des sommes en cause, d'effectuer une déclaration auprès du service TRACFIN, sans que cette obligation ne puisse être portée à la connaissance des parties."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Observations et clauses particulières',
  'Clauses particulières libres',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Clauses particulières","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"clause_particuliere_libre","label":"Clause particulière librement rédigée pour les besoins du dossier","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"clause_particuliere_libre","label":"Clause particulière librement rédigée pour les besoins du dossier","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Observations et clauses particulières',
  'Réserve ou contestation exprimée par un comparant',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Réserve ou contestation d'un comparant","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"comparant_reserve_nom","label":"Identification du comparant émettant une réserve ou une contestation","fieldType":"manuel"}},{"type":"text","text":" déclare formuler la réserve ou la contestation suivante, dont le notaire soussigné donne acte sans en apprécier le bien-fondé : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"reserve_contestation_teneur","label":"Teneur de la réserve ou de la contestation exprimée","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"comparant_reserve_nom","label":"Identification du comparant émettant une réserve ou une contestation","field_type":"manuel"},{"key":"reserve_contestation_teneur","label":"Teneur de la réserve ou de la contestation exprimée","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Observations et clauses particulières',
  'Procédure judiciaire en cours',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Procédure judiciaire en cours relative à la succession","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il est porté à la connaissance des parties qu'une procédure judiciaire est actuellement pendante devant "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"procedure_judiciaire_juridiction","label":"Juridiction saisie et objet de la procédure (contestation de testament, action en réduction, contestation de qualité d'héritier)","fieldType":"manuel"}},{"type":"text","text":", susceptible d'affecter la présente succession. Le notaire soussigné en donne acte sans que cela ne fasse obstacle à l'établissement du présent acte, sous les réserves d'usage."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"procedure_judiciaire_juridiction","label":"Juridiction saisie et objet de la procédure (contestation de testament, action en réduction, contestation de qualité d'héritier)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Frais',
  'Répartition des frais entre héritiers selon quote-part',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Répartition des frais entre héritiers","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Par dérogation à la clause de frais figurant dans le modèle standard, les frais, droits et émoluments des présentes seront répartis entre les héritiers au prorata de leurs droits respectifs dans la succession."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Frais',
  'Prise en charge des frais par un héritier désigné',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Prise en charge des frais par un héritier désigné","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"heritier_payeur_frais_nom","label":"Identification de l'héritier prenant à sa charge exclusive les frais de l'acte","fieldType":"manuel"}},{"type":"text","text":" déclare prendre à sa charge exclusive l'intégralité des frais, droits et émoluments des présentes, à titre de simple modalité de paiement, sans que cette prise en charge ne constitue une libéralité au profit des autres héritiers."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"heritier_payeur_frais_nom","label":"Identification de l'héritier prenant à sa charge exclusive les frais de l'acte","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'succession',
  'Frais',
  'Séquestre des fonds',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Séquestre des fonds dans l'attente du règlement définitif","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Dans l'attente du règlement définitif de la succession, notamment de l'issue d'une contestation ou de la détermination définitive des quotes-parts, les fonds dépendant de la succession seront conservés en séquestre par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"sequestre_depositaire","label":"Identité du séquestre (notaire, CARPA) et conditions de la libération des fonds","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"sequestre_depositaire","label":"Identité du séquestre (notaire, CARPA) et conditions de la libération des fonds","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

