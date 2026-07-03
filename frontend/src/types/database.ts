export type RoleNotarial =
  | 'notaire'
  | 'redacteur'
  | 'formaliste'
  | 'assistant'
  | 'administrateur'

export interface Etude {
  id: string
  raison_sociale: string
  siret: string | null
  numero_chambre: string | null
  telephone: string | null
  email: string | null
  adresse: string | null
  adresse_ligne1: string | null
  code_postal: string | null
  ville: string | null
  pays: string
  created_at: string
}

export type BrancheDroit = 'immobilier' | 'famille' | 'entreprise_societes'

export type SectionFieldType = 'auto' | 'manuel'

export interface SectionVariable {
  key: string
  label: string
  field_type: SectionFieldType
}

// A trame belongs to exactly one type_acte. Each trame has one row with
// is_standard = true (the always-present base model) plus any number of
// optional, addable sections (is_standard = false, category required).
export interface TrameSection {
  id: string
  branche: BrancheDroit
  type_acte: string
  category: string | null
  title: string
  content: Record<string, unknown>
  variables: SectionVariable[]
  is_published: boolean
  is_standard: boolean
  created_at: string
  updated_at: string
}

export interface Dossier {
  id: string
  tenant_id: string
  numero: string | null
  branche: BrancheDroit
  type_acte: string
  statut: string
  acces_restreint: boolean
  created_at: string
}

export type PersonneType = 'physique' | 'morale' | 'tiers_partenaire'

export interface Personne {
  id: string
  tenant_id: string
  type: PersonneType
  civilite: string | null
  nom: string | null
  prenom: string | null
  raison_sociale: string | null
  email: string | null
  telephone: string | null
  adresse: string | null
  created_at: string
}

export interface Comparant {
  id: string
  tenant_id: string
  dossier_id: string
  personne_id: string
  qualite: string
  created_at: string
  personne?: Personne
}

export type RegimeBien = 'propre' | 'communaute'

export interface Immeuble {
  id: string
  tenant_id: string
  regime: RegimeBien | null
  references_cadastrales: string | null
  designation: string | null
  created_at: string
}

export interface DossierImmeuble {
  id: string
  tenant_id: string
  dossier_id: string
  immeuble_id: string
  immeuble?: Immeuble
}

export interface Utilisateur {
  id: string
  auth_user_id: string
  tenant_id: string
  nom: string | null
  prenom: string | null
  roles: RoleNotarial[]
  actif: boolean
  email?: string | null
  created_at: string
  etude?: { raison_sociale: string } | null
}
