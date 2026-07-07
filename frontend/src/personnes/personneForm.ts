import type { Personne, PersonneType } from '../types/database'

export interface PersonneFormValues {
  type: PersonneType
  civilite: string
  nom: string
  prenom: string
  raison_sociale: string
  email: string
  telephone: string
  adresse: string
  code_postal: string
  ville: string
  pays: string
  date_naissance: string
  lieu_naissance: string
  pays_naissance: string
  departement_naissance: string
  nationalite: string
  situation_matrimoniale: string
  regime_matrimonial: string
  date_deces: string
  lieu_deces: string
}

export const EMPTY_PERSONNE_FORM: PersonneFormValues = {
  type: 'physique',
  civilite: '',
  nom: '',
  prenom: '',
  raison_sociale: '',
  email: '',
  telephone: '',
  adresse: '',
  code_postal: '',
  ville: '',
  pays: 'France',
  date_naissance: '',
  lieu_naissance: '',
  pays_naissance: 'France',
  departement_naissance: '',
  nationalite: '',
  situation_matrimoniale: '',
  regime_matrimonial: '',
  date_deces: '',
  lieu_deces: '',
}

export function personneToForm(p: Personne): PersonneFormValues {
  return {
    type: p.type,
    civilite: p.civilite ?? '',
    nom: p.nom ?? '',
    prenom: p.prenom ?? '',
    raison_sociale: p.raison_sociale ?? '',
    email: p.email ?? '',
    telephone: p.telephone ?? '',
    adresse: p.adresse ?? '',
    code_postal: p.code_postal ?? '',
    ville: p.ville ?? '',
    pays: p.pays ?? 'France',
    date_naissance: p.date_naissance ?? '',
    lieu_naissance: p.lieu_naissance ?? '',
    pays_naissance: p.pays_naissance ?? 'France',
    departement_naissance: p.departement_naissance ?? '',
    nationalite: p.nationalite ?? '',
    situation_matrimoniale: p.situation_matrimoniale ?? '',
    regime_matrimonial: p.regime_matrimonial ?? '',
    date_deces: p.date_deces ?? '',
    lieu_deces: p.lieu_deces ?? '',
  }
}

export function personneDisplayName(p: Pick<Personne, 'type' | 'civilite' | 'nom' | 'prenom' | 'raison_sociale'>): string {
  if (p.type === 'physique') {
    return [p.civilite, p.prenom, p.nom].filter(Boolean).join(' ') || 'Personne sans nom'
  }
  return p.raison_sociale || 'Sans raison sociale'
}

export function personneFormError(values: PersonneFormValues): string | null {
  if (values.type === 'physique' && !values.nom.trim()) return 'Le nom est obligatoire.'
  if (values.type !== 'physique' && !values.raison_sociale.trim()) return 'La raison sociale est obligatoire.'
  return null
}

export function personneFormToInsertPayload(values: PersonneFormValues, tenantId: string) {
  const isPhysique = values.type === 'physique'
  return {
    tenant_id: tenantId,
    type: values.type,
    civilite: isPhysique ? (values.civilite || null) : null,
    nom: isPhysique ? (values.nom.trim() || null) : null,
    prenom: isPhysique ? (values.prenom.trim() || null) : null,
    raison_sociale: !isPhysique ? (values.raison_sociale.trim() || null) : null,
    email: values.email.trim() || null,
    telephone: values.telephone.trim() || null,
    adresse: values.adresse.trim() || null,
    code_postal: values.code_postal.trim() || null,
    ville: values.ville.trim() || null,
    pays: values.pays || null,
    date_naissance: isPhysique ? (values.date_naissance || null) : null,
    lieu_naissance: isPhysique ? (values.lieu_naissance.trim() || null) : null,
    pays_naissance: isPhysique ? (values.pays_naissance || null) : null,
    departement_naissance: isPhysique ? (values.departement_naissance || null) : null,
    nationalite: isPhysique ? (values.nationalite.trim() || null) : null,
    situation_matrimoniale: isPhysique ? (values.situation_matrimoniale || null) : null,
    regime_matrimonial: isPhysique ? (values.regime_matrimonial || null) : null,
    date_deces: isPhysique ? (values.date_deces || null) : null,
    lieu_deces: isPhysique ? (values.lieu_deces.trim() || null) : null,
  }
}
