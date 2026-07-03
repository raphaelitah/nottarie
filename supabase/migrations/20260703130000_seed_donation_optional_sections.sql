-- Optional/addable trame_sections for type_acte = 'donation' (Droit de la famille).
-- Mirrors 20260703120000_seed_succession_optional_sections.sql: representation
-- variants, matrimonial/patrimonial situations, asset origin & nature, the many
-- special clauses a donation can carry (démembrement, charges, retour conventionnel,
-- inaliénabilité, donation-partage, graduelle/résiduelle...), réserve/rapport,
-- donation-specific tax mechanisms, foncier publicity variants, legal mentions,
-- free observations and fee arrangements.
-- Authored as Tiptap JSON (see frontend/src/admin/trames/editor); 'variables' is
-- derived from the 'champ' nodes exactly as extractVariablesFromDoc() would.

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Comparution / représentation des parties',
  'Comparution du donateur par mandataire (procuration)',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Comparution du donateur par mandataire","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donateur_represente_nom","label":"Nom et qualité du donateur représenté","fieldType":"manuel"}},{"type":"text","text":", non comparant, a donné pouvoir à "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"mandataire_donateur_identification","label":"Identification complète du mandataire du donateur","fieldType":"manuel"}},{"type":"text","text":", aux termes d'une procuration spéciale et authentique en date du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"procuration_donateur_date","label":"Date de la procuration","fieldType":"manuel"}},{"type":"text","text":", dont une copie demeure ci-annexée après avoir été signée « ne varietur » par le mandataire et le notaire soussigné."}]},{"type":"paragraph","content":[{"type":"text","text":"Le mandataire, ès qualités, déclare que les pouvoirs de son mandant n'ont fait l'objet d'aucune révocation à sa connaissance et qu'ils l'autorisent expressément à consentir la libéralité, objet des présentes."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donateur_represente_nom","label":"Nom et qualité du donateur représenté","field_type":"manuel"},{"key":"mandataire_donateur_identification","label":"Identification complète du mandataire du donateur","field_type":"manuel"},{"key":"procuration_donateur_date","label":"Date de la procuration","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Comparution / représentation des parties',
  'Comparution du représentant légal d''un donataire mineur',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Acceptation de la donation pour le compte d'un donataire mineur","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donataire_mineur_nom","label":"Identification du donataire mineur","fieldType":"manuel"}},{"type":"text","text":" accepte la présente donation par l'intermédiaire de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"representant_legal_donataire_identification","label":"Identification du ou des représentants légaux acceptant pour le mineur","fieldType":"manuel"}},{"type":"text","text":", agissant en qualité d'administrateur légal, conformément à l'article 935 du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donataire_mineur_nom","label":"Identification du donataire mineur","field_type":"manuel"},{"key":"representant_legal_donataire_identification","label":"Identification du ou des représentants légaux acceptant pour le mineur","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Comparution / représentation des parties',
  'Comparution du tuteur d''un donataire majeur protégé',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Acceptation de la donation pour le compte d'un donataire majeur sous tutelle","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donataire_protege_nom","label":"Identification du donataire majeur protégé","fieldType":"manuel"}},{"type":"text","text":", placé sous le régime de la tutelle, accepte la présente donation par l'intermédiaire de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"tuteur_donataire_identification","label":"Identification du tuteur acceptant pour le donataire","fieldType":"manuel"}},{"type":"text","text":", son tuteur, conformément à l'article 935 du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donataire_protege_nom","label":"Identification du donataire majeur protégé","field_type":"manuel"},{"key":"tuteur_donataire_identification","label":"Identification du tuteur acceptant pour le donataire","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Comparution / représentation des parties',
  'Comparution du curateur assistant un donataire majeur en curatelle',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Assistance d'un donataire majeur sous curatelle","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donataire_protege_nom","label":"Identification du donataire majeur protégé","fieldType":"manuel"}},{"type":"text","text":", placé sous le régime de la curatelle, intervient aux présentes assisté de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"curateur_donataire_identification","label":"Identification du curateur","fieldType":"manuel"}},{"type":"text","text":", son curateur, conformément à l'article 467 du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donataire_protege_nom","label":"Identification du donataire majeur protégé","field_type":"manuel"},{"key":"curateur_donataire_identification","label":"Identification du curateur","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Comparution / représentation des parties',
  'Comparution de l''habilité familial représentant un donataire protégé',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Représentation par un habilité familial","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donataire_protege_nom","label":"Identification du donataire majeur protégé","fieldType":"manuel"}},{"type":"text","text":" est représenté aux présentes par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"habilite_identification","label":"Identification de la personne habilitée","fieldType":"manuel"}},{"type":"text","text":", habilité(e) à cet effet par décision du juge des tutelles en date du "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"habilitation_date","label":"Date et étendue de l'habilitation familiale","fieldType":"manuel"}},{"type":"text","text":", conformément aux articles 494-1 et suivants du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donataire_protege_nom","label":"Identification du donataire majeur protégé","field_type":"manuel"},{"key":"habilite_identification","label":"Identification de la personne habilitée","field_type":"manuel"},{"key":"habilitation_date","label":"Date et étendue de l'habilitation familiale","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Comparution / représentation des parties',
  'Capacité du donateur placé sous tutelle ou curatelle',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donateur placé sous un régime de protection","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le donateur, placé sous le régime de la "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donateur_regime_protection","label":"Régime de protection du donateur (tutelle ou curatelle) et identité du tuteur/curateur","fieldType":"manuel"}},{"type":"text","text":", ne peut consentir la présente donation qu'avec l'assistance ou la représentation de son tuteur ou curateur et, s'agissant d'un acte de disposition à titre gratuit, qu'avec l'autorisation du conseil de famille ou, à défaut, du juge des tutelles."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"autorisation_donation_protege","label":"Date et teneur de l'autorisation obtenue pour consentir la donation","fieldType":"manuel"}},{"type":"text","text":", dont une copie demeure ci-annexée."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donateur_regime_protection","label":"Régime de protection du donateur (tutelle ou curatelle) et identité du tuteur/curateur","field_type":"manuel"},{"key":"autorisation_donation_protege","label":"Date et teneur de l'autorisation obtenue pour consentir la donation","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Comparution / représentation des parties',
  'Comparution d''un donataire personne morale',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Comparution du donataire personne morale","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donataire_personne_morale_denomination","label":"Dénomination, forme et siège du donataire personne morale (association, fondation)","fieldType":"manuel"}},{"type":"text","text":", est représenté(e) aux présentes par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"representant_personne_morale_identification","label":"Identification du représentant légal de la personne morale et justification de ses pouvoirs","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Le représentant déclare que la personne morale donataire dispose de la capacité de recevoir à titre gratuit et que, le cas échéant, l'autorisation administrative requise a été obtenue."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donataire_personne_morale_denomination","label":"Dénomination, forme et siège du donataire personne morale (association, fondation)","field_type":"manuel"},{"key":"representant_personne_morale_identification","label":"Identification du représentant légal de la personne morale et justification de ses pouvoirs","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
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
  'donation',
  'Comparution / représentation des parties',
  'Pluralité de donataires et répartition entre eux',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation consentie à plusieurs donataires","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation est consentie conjointement au profit de plusieurs donataires, à savoir : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donataires_pluralite_detail","label":"Identification de chaque codonataire et quote-part ou lot revenant à chacun","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donataires_pluralite_detail","label":"Identification de chaque codonataire et quote-part ou lot revenant à chacun","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Situation matrimoniale et patrimoniale du donateur',
  'Consentement du conjoint pour la donation d''un bien commun',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation portant sur un bien commun","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le bien donné dépendant de la communauté existant entre le donateur et son conjoint, l'article 1422 du Code civil exige le consentement des deux époux pour toute disposition à titre gratuit entre vifs de biens communs. En conséquence, "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"conjoint_donateur_nom","label":"Identification du conjoint du donateur intervenant pour donner son consentement","fieldType":"manuel"}},{"type":"text","text":" intervient aux présentes aux seules fins de donner son consentement exprès à la donation."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"conjoint_donateur_nom","label":"Identification du conjoint du donateur intervenant pour donner son consentement","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Situation matrimoniale et patrimoniale du donateur',
  'Donateur marié sous un régime séparatiste',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Régime matrimonial séparatiste du donateur","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le donateur est marié sous le régime de la séparation de biens (ou un régime comportant une séparation des patrimoines), de sorte que le bien donné constitue un bien propre du donateur ne nécessitant pas le consentement de son conjoint pour en disposer à titre gratuit."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Situation matrimoniale et patrimoniale du donateur',
  'Donateur pacsé — régime applicable aux biens donnés',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Régime patrimonial du donateur pacsé","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le donateur est lié par un pacte civil de solidarité conclu le "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"pacs_donateur_date","label":"Date de conclusion du PACS du donateur","fieldType":"auto"}},{"type":"text","text":", sous le régime "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"pacs_donateur_regime","label":"Régime des biens applicable au PACS (séparation de biens ou indivision) et incidence sur le bien donné","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"pacs_donateur_date","label":"Date de conclusion du PACS du donateur","field_type":"auto"},{"key":"pacs_donateur_regime","label":"Régime des biens applicable au PACS (séparation de biens ou indivision) et incidence sur le bien donné","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Situation matrimoniale et patrimoniale du donateur',
  'Donateur de nationalité étrangère ou résidant à l''étranger',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Loi applicable à la donation","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le donateur "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donateur_nationalite_residence_etranger","label":"Nationalité étrangère et/ou résidence habituelle à l'étranger du donateur","fieldType":"manuel"}},{"type":"text","text":", il conviendra de déterminer la loi applicable aux effets civils de la présente donation, notamment au regard du droit international privé des libéralités et, le cas échéant, du régime matrimonial du donateur."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donateur_nationalite_residence_etranger","label":"Nationalité étrangère et/ou résidence habituelle à l'étranger du donateur","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Situation matrimoniale et patrimoniale du donateur',
  'Bien donné situé à l''étranger',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Bien situé à l'étranger","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le bien objet de la présente donation est situé à l'étranger, à savoir : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"bien_donne_etranger_detail","label":"Désignation du bien situé à l'étranger et pays de situation","fieldType":"manuel"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Il est rappelé que les modalités de publicité et de transfert de propriété de ce bien demeurent régies par la loi du lieu de sa situation."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"bien_donne_etranger_detail","label":"Désignation du bien situé à l'étranger et pays de situation","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Origine et nature des biens donnés',
  'Origine de propriété — bien propre du donateur',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Origine de propriété","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"origine_propriete_detail","label":"Détail de l'origine de propriété du bien donné (acquisition, succession, donation antérieure, date, notaire)","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"origine_propriete_detail","label":"Détail de l'origine de propriété du bien donné (acquisition, succession, donation antérieure, date, notaire)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Origine et nature des biens donnés',
  'Bien détenu en indivision (donation de quote-part indivise)',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation d'une quote-part indivise","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le donateur n'est propriétaire que d'une quote-part indivise du bien donné, à hauteur de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"quote_part_indivise","label":"Quote-part indivise détenue par le donateur et identité des autres indivisaires","fieldType":"manuel"}},{"type":"text","text":", la présente donation ne portant en conséquence que sur cette quote-part."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"quote_part_indivise","label":"Quote-part indivise détenue par le donateur et identité des autres indivisaires","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Origine et nature des biens donnés',
  'Bien grevé d''hypothèque ou de privilège',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Sûretés grevant le bien donné","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le bien donné demeure grevé de l'inscription suivante, prise au profit de : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"surete_bien_donne_detail","label":"Nature de la sûreté, bénéficiaire, montant garanti et référence de publication","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"surete_bien_donne_detail","label":"Nature de la sûreté, bénéficiaire, montant garanti et référence de publication","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Origine et nature des biens donnés',
  'Bien préalablement démembré (usufruit détenu par un tiers)',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Bien préalablement démembré","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le bien donné fait l'objet d'un démembrement de propriété préexistant à la présente donation, l'usufruit étant détenu par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"usufruitier_tiers_identification","label":"Identification du tiers usufruitier et origine du démembrement","fieldType":"manuel"}},{"type":"text","text":", la présente donation ne portant en conséquence que sur la nue-propriété du bien."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"usufruitier_tiers_identification","label":"Identification du tiers usufruitier et origine du démembrement","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Origine et nature des biens donnés',
  'Don de sommes d''argent / don manuel',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Don de sommes d'argent","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation porte sur une somme d'argent d'un montant de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"somme_argent_montant","label":"Montant de la somme d'argent donnée","fieldType":"manuel"}},{"type":"text","text":", versée par virement ou remise de chèque au profit du donataire, qui le reconnaît et en donne quittance."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"don_manuel_anterieur","label":"Précision sur un éventuel don manuel antérieur révélé par le présent acte","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"somme_argent_montant","label":"Montant de la somme d'argent donnée","field_type":"manuel"},{"key":"don_manuel_anterieur","label":"Précision sur un éventuel don manuel antérieur révélé par le présent acte","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Origine et nature des biens donnés',
  'Valeurs mobilières et portefeuille-titres',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation de valeurs mobilières","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation porte sur le portefeuille de valeurs mobilières suivant :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"valeurs_mobilieres_donnees_detail","label":"Détail du portefeuille de valeurs mobilières donné (établissement teneur de compte, composition, valorisation)","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"valeurs_mobilieres_donnees_detail","label":"Détail du portefeuille de valeurs mobilières donné (établissement teneur de compte, composition, valorisation)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Origine et nature des biens donnés',
  'Parts sociales ou actions de société',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation de parts sociales ou actions","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation porte sur les parts sociales ou actions suivantes :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"parts_sociales_donnees_detail","label":"Détail des parts sociales/actions données (société, forme, nombre de titres, valeur)","fieldType":"manuel"}}]},{"type":"paragraph","content":[{"type":"text","text":"Il conviendra de vérifier les clauses statutaires applicables (agrément, préemption) régissant la transmission de ces titres au profit du donataire."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"parts_sociales_donnees_detail","label":"Détail des parts sociales/actions données (société, forme, nombre de titres, valeur)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Origine et nature des biens donnés',
  'Entreprise individuelle ou fonds de commerce',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation d'entreprise individuelle ou de fonds de commerce","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation porte sur l'entreprise individuelle ou le fonds de commerce suivant :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"entreprise_donnee_detail","label":"Désignation de l'entreprise ou du fonds donné (nature de l'activité, numéro SIREN, valeur estimée)","fieldType":"manuel"}}]},{"type":"paragraph","content":[{"type":"text","text":"Les parties seront informées des dispositifs d'exonération partielle des droits de mutation applicables à la transmission d'entreprise (pacte Dutreil, article 787 C du Code général des impôts)."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"entreprise_donnee_detail","label":"Désignation de l'entreprise ou du fonds donné (nature de l'activité, numéro SIREN, valeur estimée)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Origine et nature des biens donnés',
  'Meubles meublants et objets de valeur',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation de meubles meublants et objets de valeur","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation porte en outre sur les meubles meublants, bijoux et objets d'art suivants :"}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"meubles_objets_valeur_donnes_detail","label":"Inventaire des meubles meublants et objets de valeur donnés, avec estimation","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"meubles_objets_valeur_donnes_detail","label":"Inventaire des meubles meublants et objets de valeur donnés, avec estimation","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Origine et nature des biens donnés',
  'Immeuble à usage d''habitation principale',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Immeuble à usage d'habitation principale","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le bien immobilier objet de la présente donation est à usage d'habitation principale du donataire à compter de l'entrée en jouissance, à savoir : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"immeuble_habitation_precision","label":"Précisions sur l'occupation actuelle et future de l'immeuble donné","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"immeuble_habitation_precision","label":"Précisions sur l'occupation actuelle et future de l'immeuble donné","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Origine et nature des biens donnés',
  'Immeuble à usage locatif ou professionnel',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Immeuble à usage locatif ou professionnel","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le bien immobilier objet de la présente donation est actuellement donné à bail ou affecté à un usage professionnel, à savoir : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"immeuble_locatif_professionnel_detail","label":"Détail du bail en cours ou de l'affectation professionnelle et transfert des droits et obligations au donataire","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"immeuble_locatif_professionnel_detail","label":"Détail du bail en cours ou de l'affectation professionnelle et transfert des droits et obligations au donataire","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation avec réserve d''usufruit (démembrement de propriété)',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Réserve d'usufruit par le donateur","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le donateur se réserve, sa vie durant, l'usufruit du bien donné, n'en transmettant au donataire que la nue-propriété. Le donataire ne pourra prendre possession de la pleine propriété qu'au décès du donateur ou, par anticipation, en cas de renonciation expresse de ce dernier à son usufruit."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"usufruit_reserve_modalites","label":"Modalités de la réserve d'usufruit (droit d'usage, charge d'entretien, assurances)","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"usufruit_reserve_modalites","label":"Modalités de la réserve d'usufruit (droit d'usage, charge d'entretien, assurances)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Quasi-usufruit sur une somme d''argent',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Quasi-usufruit","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La donation portant sur une somme d'argent avec réserve d'usufruit, il est précisé que le donateur usufruitier pourra disposer librement de cette somme, à charge de restituer, au terme de l'usufruit, une somme de valeur égale, conformément à l'article 587 du Code civil relatif au quasi-usufruit."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"quasi_usufruit_creance_restitution","label":"Modalités de la créance de restitution du nu-propriétaire (reconnaissance de dette, garanties)","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"quasi_usufruit_creance_restitution","label":"Modalités de la créance de restitution du nu-propriétaire (reconnaissance de dette, garanties)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation en avancement de part successorale (rapportable)',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation en avancement de part successorale","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation est consentie en avancement de part successorale et sera, en conséquence, rapportable à la succession du donateur, conformément aux articles 843 et suivants du Code civil, sauf disposition contraire ultérieure du donateur."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation hors part successorale (préciputaire, dispense de rapport)',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation hors part successorale","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation est consentie hors part successorale, par préciput et hors part, conformément à l'article 919 du Code civil. Elle s'imputera, en conséquence, sur la quotité disponible et non sur la part de réserve du donataire, sans donner lieu à rapport à la succession du donateur, sous réserve d'une éventuelle réduction pour atteinte à la réserve héréditaire des autres héritiers."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation-partage (répartition entre plusieurs descendants)',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation-partage","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation est consentie sous la forme d'une donation-partage, réalisant entre les descendants du donateur, ci-après désignés, la répartition et le partage anticipé de tout ou partie de ses biens, conformément aux articles 1075 et suivants du Code civil."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donation_partage_lots","label":"Composition des lots attribués à chaque descendant allotis et modalités d'égalité ou d'inégalité des lots","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donation_partage_lots","label":"Composition des lots attribués à chaque descendant allotis et modalités d'égalité ou d'inégalité des lots","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation graduelle',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation graduelle","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation est assortie d'une charge, pour le donataire, de conserver et de transmettre le bien donné, à son décès, à "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donation_graduelle_second_gratifie","label":"Identification du second gratifié appelé à recevoir le bien au décès du premier donataire","fieldType":"manuel"}},{"type":"text","text":", conformément aux articles 1048 et suivants du Code civil relatifs aux libéralités graduelles."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donation_graduelle_second_gratifie","label":"Identification du second gratifié appelé à recevoir le bien au décès du premier donataire","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation résiduelle',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation résiduelle","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation est assortie d'une charge, pour le donataire, de transmettre à son décès, à "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donation_residuelle_second_gratifie","label":"Identification du second gratifié appelé à recevoir ce qui subsistera du bien donné","fieldType":"manuel"}},{"type":"text","text":", ce qui subsistera du bien donné, le donataire conservant la libre disposition entre vifs de ce bien, conformément aux articles 1057 et suivants du Code civil relatifs aux libéralités résiduelles."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donation_residuelle_second_gratifie","label":"Identification du second gratifié appelé à recevoir ce qui subsistera du bien donné","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation avec charge au profit d''un tiers',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Charge au profit d'un tiers","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation est consentie à charge, pour le donataire, d'exécuter au profit de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"charge_tiers_beneficiaire","label":"Identification du tiers bénéficiaire de la charge et objet de celle-ci","fieldType":"manuel"}},{"type":"text","text":", l'obligation suivante : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"charge_tiers_objet","label":"Nature et modalités d'exécution de la charge stipulée au profit du tiers","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"charge_tiers_beneficiaire","label":"Identification du tiers bénéficiaire de la charge et objet de celle-ci","field_type":"manuel"},{"key":"charge_tiers_objet","label":"Nature et modalités d'exécution de la charge stipulée au profit du tiers","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation avec charge de rente viagère ou d''entretien au profit du donateur',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Charge de rente viagère ou d'entretien au profit du donateur","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation est consentie à charge, pour le donataire, de verser au donateur une rente viagère, ou d'assurer son entretien et sa prise en charge, dans les conditions suivantes : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"charge_rente_entretien_modalites","label":"Montant de la rente ou modalités de l'obligation d'entretien mise à la charge du donataire","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"charge_rente_entretien_modalites","label":"Montant de la rente ou modalités de l'obligation d'entretien mise à la charge du donataire","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation avec condition suspensive ou résolutoire',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Condition suspensive ou résolutoire","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation est consentie sous la condition "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"condition_suspensive_resolutoire_nature","label":"Nature de la condition (suspensive ou résolutoire) et événement conditionnant l'effet de la donation","fieldType":"manuel"}},{"type":"text","text":", de sorte que ses effets seront subordonnés à la réalisation de cet événement."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"condition_suspensive_resolutoire_nature","label":"Nature de la condition (suspensive ou résolutoire) et événement conditionnant l'effet de la donation","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation avec clause de retour conventionnel',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Clause de retour conventionnel","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le donateur se réserve le droit de retour, sur le bien donné ou sur ce qui en aura été le remploi, pour le cas de prédécès du donataire, et le cas échéant de ses descendants, conformément à l'article 951 du Code civil. En cas d'exercice de ce droit, le bien retournera au donateur libre de tous droits qui auraient pu être consentis par le donataire, sauf convention contraire."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation avec clause d''inaliénabilité temporaire',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Clause d'inaliénabilité temporaire","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le donataire s'interdit d'aliéner ou de grever de quelque manière que ce soit le bien donné pendant un délai de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"inalienabilite_duree","label":"Durée de la clause d'inaliénabilité et justification de l'intérêt sérieux et légitime, conformément à l'article 900-1 du Code civil","fieldType":"manuel"}},{"type":"text","text":", sauf autorisation judiciaire en cas de changement de circonstances rendant nécessaire l'aliénation."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"inalienabilite_duree","label":"Durée de la clause d'inaliénabilité et justification de l'intérêt sérieux et légitime, conformément à l'article 900-1 du Code civil","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation avec clause d''emploi ou de remploi',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Clause d'emploi ou de remploi","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il est stipulé que le bien donné, ou le prix qui pourrait en provenir en cas d'aliénation, conservera son caractère de bien propre du donataire, même marié sous un régime de communauté, conformément aux articles 1406 et 1434 du Code civil relatifs à l'emploi et au remploi."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation avec clause de « de residuo » au profit des enfants d''un premier lit',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Protection des enfants d'un premier lit","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation, consentie au profit du conjoint du donateur remarié, est assortie d'une clause de « de residuo » ou d'une charge de restitution au profit des enfants du donateur issus d'une précédente union, à savoir : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"protection_enfants_premier_lit_detail","label":"Identification des enfants d'un premier lit bénéficiaires de la protection et modalités de la clause","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"protection_enfants_premier_lit_detail","label":"Identification des enfants d'un premier lit bénéficiaires de la protection et modalités de la clause","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation entre époux de biens présents',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation entre époux de biens présents","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation, consentie entre époux et portant sur des biens présents, demeure, conformément à l'article 1096 du Code civil, librement révocable par le donateur pendant le mariage, sauf si elle a été insérée dans le contrat de mariage."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation déguisée ou indirecte reconnue par les parties',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation indirecte","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Les parties reconnaissent que l'opération ci-dessus décrite, bien que revêtant en la forme les apparences d'un acte à titre onéreux, constitue en réalité une libéralité au profit du donataire, à hauteur de : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"donation_indirecte_valeur","label":"Évaluation de l'avantage indirectement consenti (différence de prix, abandon de créance, prêt sans intérêt)","fieldType":"manuel"}},{"type":"text","text":", les parties entendant lui faire produire les effets d'une donation, notamment aux fins fiscales et de rapport ou de réduction successoraux."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"donation_indirecte_valeur","label":"Évaluation de l'avantage indirectement consenti (différence de prix, abandon de créance, prêt sans intérêt)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Présent d''usage (distinction avec la donation)',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Qualification de présent d'usage","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il est précisé, pour les besoins de la présente convention ou à titre de rappel, que le bien ou la somme remis à l'occasion de "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"present_usage_occasion","label":"Occasion du présent d'usage (anniversaire, mariage, réussite) et proportion avec la fortune du donateur","fieldType":"manuel"}},{"type":"text","text":" constitue un présent d'usage échappant à la qualification de donation rapportable ou réductible, eu égard à sa faible valeur au regard de la fortune du donateur."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"present_usage_occasion","label":"Occasion du présent d'usage (anniversaire, mariage, réussite) et proportion avec la fortune du donateur","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Révocation de la donation pour inexécution des charges ou ingratitude',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Rappel des causes de révocation","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il est rappelé que la présente donation pourra être révoquée pour cause d'inexécution des charges imposées au donataire, conformément à l'article 954 du Code civil, ou pour cause d'ingratitude dans les cas prévus à l'article 955 du Code civil, l'action en révocation devant être exercée dans le délai d'un an prévu à l'article 957 du même code."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation avec réserve de droit de retour en cas de prédécès du donataire sans postérité',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Droit de retour légal en l'absence de postérité","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il est rappelé qu'à défaut de stipulation contraire, et en application de l'article 738-2 du Code civil, les biens donnés sont, en cas de prédécès du donataire sans postérité, soumis à un droit de retour légal au profit du donateur, à concurrence des biens qui se retrouvent en nature dans la succession du donataire prédécédé."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Modalités particulières de la donation',
  'Donation par contrat de mariage',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Donation consentie par contrat de mariage","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation est consentie entre futurs époux, ou par un tiers au profit de futurs époux, par contrat de mariage, conformément aux articles 1081 et suivants du Code civil, et prendra effet à la date de célébration du mariage."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"contrat_mariage_reference","label":"Référence du contrat de mariage et date prévue du mariage","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"contrat_mariage_reference","label":"Référence du contrat de mariage et date prévue du mariage","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Réserve héréditaire et rapport',
  'Imputation sur la quotité disponible et risque de réduction',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Imputation et risque de réduction","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il est rappelé qu'en présence d'héritiers réservataires au jour du décès du donateur, la présente donation s'imputera sur la quotité disponible ou sur la réserve du donataire selon sa qualification, et pourra, si elle excède la quotité disponible calculée au décès, faire l'objet d'une réduction dans les conditions prévues aux articles 920 et suivants du Code civil."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Réserve héréditaire et rapport',
  'Renonciation anticipée à l''action en réduction consentie par un héritier réservataire tiers',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Renonciation anticipée à l'action en réduction (RAAR)","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"raar_heritier_tiers_nom","label":"Identification de l'héritier réservataire renonçant, tiers à la présente donation","fieldType":"manuel"}},{"type":"text","text":" déclare renoncer par avance, dans les termes et conditions ci-après, à exercer l'action en réduction qu'il pourrait exercer sur la présente donation lors de l'ouverture de la succession du donateur, conformément aux articles 929 et suivants du Code civil."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"raar_conditions","label":"Conditions et étendue de la renonciation anticipée à l'action en réduction","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"raar_heritier_tiers_nom","label":"Identification de l'héritier réservataire renonçant, tiers à la présente donation","field_type":"manuel"},{"key":"raar_conditions","label":"Conditions et étendue de la renonciation anticipée à l'action en réduction","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Fiscalité de la donation — variantes',
  'Abattements spécifiques selon le lien de parenté',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Abattements applicables selon le lien de parenté","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Les droits de mutation à titre gratuit dus par le donataire seront calculés selon le barème progressif prévu à l'article 777 du Code général des impôts, après application de l'abattement personnel prévu à l'article 779 du même code selon le lien de parenté entre le donateur et le donataire, à savoir : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"abattement_lien_parente_detail","label":"Lien de parenté et montant de l'abattement applicable","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"abattement_lien_parente_detail","label":"Lien de parenté et montant de l'abattement applicable","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Fiscalité de la donation — variantes',
  'Exonération des dons familiaux de sommes d''argent',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Exonération des dons familiaux de sommes d'argent","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation portant sur une somme d'argent consentie au profit d'un enfant, petit-enfant, arrière-petit-enfant, ou à défaut de descendance d'un neveu ou d'une nièce, les parties entendent se prévaloir de l'exonération prévue à l'article 790 G du Code général des impôts, sous réserve du respect des conditions d'âge du donateur et de plafond applicables."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Fiscalité de la donation — variantes',
  'Pacte Dutreil — exonération partielle pour transmission d''entreprise',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Pacte Dutreil","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation portant sur des titres de société ou sur une entreprise individuelle faisant l'objet d'un engagement collectif et individuel de conservation, les parties entendent se prévaloir de l'exonération partielle de droits de mutation à titre gratuit prévue aux articles 787 B et 787 C du Code général des impôts (pacte Dutreil), à hauteur de 75 % de la valeur des titres ou de l'entreprise transmise."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"pacte_dutreil_engagements","label":"Détail des engagements de conservation collectif et individuel et des fonctions de direction exercées","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"pacte_dutreil_engagements","label":"Détail des engagements de conservation collectif et individuel et des fonctions de direction exercées","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Fiscalité de la donation — variantes',
  'Donation de la nue-propriété — barème fiscal de l''usufruit',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Évaluation fiscale du démembrement","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation portant sur la nue-propriété du bien, avec réserve d'usufruit au profit du donateur, la valeur imposable de la nue-propriété transmise sera déterminée selon le barème fixé à l'article 669 du Code général des impôts, en fonction de l'âge du donateur usufruitier au jour de la donation."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Fiscalité de la donation — variantes',
  'Prise en charge des droits de donation par le donateur',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Prise en charge des droits par le donateur","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le donateur déclare prendre à sa charge exclusive le paiement des droits de mutation à titre gratuit dus au titre de la présente donation, sans que cette prise en charge ne constitue elle-même une libéralité supplémentaire imposable, conformément à la doctrine administrative en la matière."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Fiscalité de la donation — variantes',
  'Régime fiscal des donations avec élément d''extranéité',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Fiscalité des donations internationales","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"La présente donation comportant un élément d'extranéité (résidence fiscale du donateur ou du donataire à l'étranger, ou bien donné situé à l'étranger), il conviendra de déterminer le régime des droits de mutation applicable au regard des règles de territorialité de l'article 750 ter du Code général des impôts et, le cas échéant, des conventions fiscales internationales applicables."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Publicité foncière — variantes',
  'Immeuble sous statut de copropriété',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Immeuble soumis au statut de la copropriété","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"L'immeuble objet de la présente donation est soumis au statut de la copropriété des immeubles bâtis (loi n° 65-557 du 10 juillet 1965)."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"copropriete_reglement_reference","label":"Référence de publication du règlement de copropriété et de l'état descriptif de division","fieldType":"auto"}},{"type":"text","text":"."}]},{"type":"paragraph","content":[{"type":"text","text":"Le syndic de la copropriété sera informé de la mutation aux fins de mise à jour du carnet d'entretien et de la répartition des charges."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"copropriete_reglement_reference","label":"Référence de publication du règlement de copropriété et de l'état descriptif de division","field_type":"auto"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Publicité foncière — variantes',
  'Servitude grevant l''immeuble donné',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Servitudes","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"L'immeuble objet de la présente donation est grevé de la servitude suivante : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"servitude_immeuble_donne_detail","label":"Nature de la servitude, fonds dominant et fonds servant, référence de publication","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"servitude_immeuble_donne_detail","label":"Nature de la servitude, fonds dominant et fonds servant, référence de publication","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Publicité foncière — variantes',
  'Immeuble classé ou inscrit au titre des monuments historiques',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Immeuble classé ou inscrit","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"L'immeuble objet de la présente donation est classé ou inscrit au titre des monuments historiques, ce qui emporte des obligations particulières de conservation et, le cas échéant, un régime fiscal spécifique."}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"monuments_historiques_reference","label":"Référence de la décision de classement ou d'inscription et obligations associées","fieldType":"manuel"}}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"monuments_historiques_reference","label":"Référence de la décision de classement ou d'inscription et obligations associées","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Mentions légales',
  'Vigilance LCB-FT renforcée / gel des avoirs',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Vigilance renforcée — gel des avoirs","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Le notaire soussigné a procédé à la vérification de l'absence d'inscription des parties sur les listes de personnes faisant l'objet de mesures de gel des avoirs ou de sanctions financières internationales, conformément à ses obligations de vigilance renforcée en matière de lutte contre le blanchiment de capitaux et le financement du terrorisme, la présente donation présentant, le cas échéant, un profil de risque particulier au regard de l'origine des fonds ou biens donnés."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Mentions légales',
  'Déclaration de soupçon TRACFIN',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Obligation déclarative TRACFIN","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Conformément aux articles L. 561-1 et suivants du Code monétaire et financier, le notaire soussigné rappelle qu'il est tenu, en cas de soupçon relatif à l'origine ou à la destination des sommes ou biens en cause, d'effectuer une déclaration auprès du service TRACFIN, sans que cette obligation ne puisse être portée à la connaissance des parties."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
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
  'donation',
  'Observations et clauses particulières',
  'Réserve ou contestation exprimée par une partie',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Réserve ou contestation d'une partie","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"partie_reserve_nom","label":"Identification de la partie émettant une réserve ou une contestation","fieldType":"manuel"}},{"type":"text","text":" déclare formuler la réserve ou la contestation suivante, dont le notaire soussigné donne acte sans en apprécier le bien-fondé : "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"reserve_contestation_teneur","label":"Teneur de la réserve ou de la contestation exprimée","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"partie_reserve_nom","label":"Identification de la partie émettant une réserve ou une contestation","field_type":"manuel"},{"key":"reserve_contestation_teneur","label":"Teneur de la réserve ou de la contestation exprimée","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Observations et clauses particulières',
  'Procédure judiciaire en cours',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Procédure judiciaire en cours relative à la donation","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Il est porté à la connaissance des parties qu'une procédure judiciaire est actuellement pendante devant "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"procedure_judiciaire_juridiction","label":"Juridiction saisie et objet de la procédure (contestation de la donation, action en nullité, action en réduction anticipée)","fieldType":"manuel"}},{"type":"text","text":", susceptible d'affecter la présente donation. Le notaire soussigné en donne acte sans que cela ne fasse obstacle à l'établissement du présent acte, sous les réserves d'usage."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"procedure_judiciaire_juridiction","label":"Juridiction saisie et objet de la procédure (contestation de la donation, action en nullité, action en réduction anticipée)","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Frais',
  'Prise en charge des frais par le donateur',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Prise en charge des frais par le donateur","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Par dérogation à la clause de frais figurant dans le modèle standard, le donateur déclare prendre à sa charge exclusive l'intégralité des frais, droits et émoluments des présentes."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Frais',
  'Répartition des frais entre plusieurs donataires',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Répartition des frais entre plusieurs donataires","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Les frais, droits et émoluments des présentes seront répartis entre les codonataires au prorata de la valeur des biens ou droits recueillis par chacun d'eux."}]}]}$json_content$::jsonb,
  $json_variables$[]$json_variables$::jsonb,
  true,
  false
);

insert into trame_sections (branche, type_acte, category, title, content, variables, is_published, is_standard)
values (
  'famille',
  'donation',
  'Frais',
  'Séquestre des fonds',
  $json_content${"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Séquestre des fonds","marks":[{"type":"bold"}]}]},{"type":"paragraph","content":[{"type":"text","text":"Dans l'attente de la réalisation d'une condition ou de la levée d'une réserve affectant la présente donation, les fonds concernés seront conservés en séquestre par "}]},{"type":"paragraph","content":[{"type":"champ","attrs":{"key":"sequestre_depositaire","label":"Identité du séquestre (notaire, CARPA) et conditions de la libération des fonds","fieldType":"manuel"}},{"type":"text","text":"."}]}]}$json_content$::jsonb,
  $json_variables$[{"key":"sequestre_depositaire","label":"Identité du séquestre (notaire, CARPA) et conditions de la libération des fonds","field_type":"manuel"}]$json_variables$::jsonb,
  true,
  false
);

