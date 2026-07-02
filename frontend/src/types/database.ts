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

export type ParagraphFieldType = 'auto' | 'manuel'

export interface ParagraphVariable {
  key: string
  label: string
  field_type: ParagraphFieldType
}

export interface TrameParagraph {
  id: string
  branche: BrancheDroit
  type_acte: string
  category: string
  title: string
  content: Record<string, unknown>
  variables: ParagraphVariable[]
  is_published: boolean
  created_at: string
  updated_at: string
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
}
