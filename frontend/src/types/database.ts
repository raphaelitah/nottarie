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
  dossier_numero_format: string
  created_at: string
}

export type BrancheDroit = 'immobilier' | 'famille' | 'entreprise_societes'

export type SectionFieldType = 'auto' | 'manuel'

export interface SectionVariable {
  key: string
  label: string
  field_type: SectionFieldType
  source?: string | null
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
  nom: string | null
  branche: BrancheDroit
  type_acte: string
  statut: string
  acces_restreint: boolean
  notaire_id: string
  cree_par: string | null
  clerc_attitre_id: string
  dossier_parent_id: string | null
  created_at: string
  updated_at: string
  mis_a_jour_par: string | null
  archived_at: string | null
  autres_actifs: number | null
  passif: number | null
  clos_at: string | null
}

export interface Historique {
  id: string
  tenant_id: string
  utilisateur_id: string | null
  dossier_id: string | null
  action: string
  details: Record<string, unknown> | null
  created_at: string
  utilisateur?: Utilisateur | null
}

export interface DossierAcces {
  id: string
  tenant_id: string
  dossier_id: string
  utilisateur_id: string
  created_at: string
  utilisateur?: Utilisateur
}

export type PersonneType = 'physique' | 'morale' | 'tiers_partenaire'

export type NaturePropriete = 'pleine_propriete' | 'usufruit' | 'nue_propriete'

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
  code_postal: string | null
  ville: string | null
  pays: string | null
  date_naissance: string | null
  lieu_naissance: string | null
  pays_naissance: string | null
  departement_naissance: string | null
  nationalite: string | null
  situation_matrimoniale: string | null
  regime_matrimonial: string | null
  date_deces: string | null
  lieu_deces: string | null
  forme_juridique: string | null
  siren: string | null
  siret: string | null
  capital_social: number | null
  nombre_parts_total: number | null
  created_at: string
  archived_at: string | null
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

export interface QualiteComparant {
  id: string
  tenant_id: string
  libelle: string
  created_at: string
}

export interface PersonneMoraleContact {
  id: string
  tenant_id: string
  personne_morale_id: string
  personne_physique_id: string | null
  nom_libre: string | null
  fonction: string | null
  email: string | null
  telephone: string | null
  is_principal: boolean
  created_at: string
  personne_physique?: Personne | null
}

export interface ImmeubleProprietaire {
  id: string
  tenant_id: string
  immeuble_id: string
  personne_id: string | null
  nom_libre: string | null
  quote_part: number | null
  nombre_parts: number | null
  nature_propriete: NaturePropriete
  created_at: string
  personne?: Personne | null
  immeuble?: Immeuble
}

export interface PersonneMoraleAssocie {
  id: string
  tenant_id: string
  personne_morale_id: string
  titulaire_personne_id: string | null
  nom_libre: string | null
  nature_propriete: NaturePropriete
  quote_part: number | null
  nombre_parts: number | null
  created_at: string
  titulaire_personne?: Personne | null
}

export type RegimeBien = 'propre' | 'communaute'

export interface Immeuble {
  id: string
  tenant_id: string
  regime: RegimeBien | null
  references_cadastrales: string | null
  designation: string | null
  type_bien: string | null
  adresse: string | null
  ville: string | null
  code_postal: string | null
  pays: string
  valeur_declaree: number | null
  nombre_parts_total: number | null
  created_at: string
  archived_at: string | null
}

export type BaremeSousType = 'acceptee' | 'non_acceptee' | 'sur_acceptation' | 'valeurs_mobilieres'

export interface BaremeTranche {
  jusqu_a: number | null
  taux: number
}

export interface BaremeContent {
  source: string
  effective_date: string
  tva_taux: number
  csi_taux: number
  debours_estimation_defaut: number
  tranches: BaremeTranche[]
}

export interface Bareme {
  id: string
  version: number
  libelle: string
  type_acte: string
  sous_type: BaremeSousType | null
  bareme: BaremeContent
  created_at: string
}

export interface DossierImmeuble {
  id: string
  tenant_id: string
  dossier_id: string
  immeuble_id: string
  immeuble?: Immeuble
}

export interface DocumentRow {
  id: string
  tenant_id: string
  dossier_id: string | null
  personne_id: string | null
  immeuble_id: string | null
  acte_id: string | null
  nom: string
  storage_path: string
  created_at: string
}

export interface Courrier {
  id: string
  tenant_id: string
  dossier_id: string
  acte_id: string | null
  objet: string | null
  contenu: string | null
  destinataire: string | null
  destinataires: string[]
  created_at: string
  dernier_envoi_echec_at: string | null
  dernier_envoi_erreur: string | null
}

export interface Email {
  id: string
  tenant_id: string
  dossier_id: string
  courrier_id: string | null
  sens: 'entrant' | 'sortant'
  objet: string | null
  corps: string | null
  provider: MailboxProvider | null
  provider_message_id: string | null
  utilisateur_id: string | null
  destinataires: string[]
  cc: string[]
  created_at: string
  utilisateur?: Utilisateur | null
}

export interface CourrierDocument {
  id: string
  tenant_id: string
  courrier_id: string
  document_id: string
  created_at: string
  document?: DocumentRow
}

export interface Formalite {
  id: string
  tenant_id: string
  dossier_id: string
  type: string
  statut: string
  echeance: string | null
  created_at: string
  updated_at: string
}

export interface Acte {
  id: string
  tenant_id: string
  dossier_id: string
  trame_id: string
  numero: string | null
  nom: string | null
  statut: string
  donnees: Record<string, string>
  content: Record<string, unknown> | null
  created_at: string
  documents?: DocumentRow[]
  signature_requests?: SignatureRequestRow[]
}

export interface ActeBrouillon {
  id: string
  tenant_id: string
  dossier_id: string
  nom: string | null
  content: Record<string, unknown>
  updated_at: string
}

export interface SignatureRequestRow {
  id: string
  tenant_id: string
  dossier_id: string
  acte_id: string
  provider: string
  statut: string
  external_reference: string | null
  document_signe_storage_path: string | null
  accuse_reception_storage_path: string | null
  created_at: string
  updated_at: string
  signature_signataires?: SignatureSignataireRow[]
}

export interface SignatureSignataireRow {
  id: string
  tenant_id: string
  dossier_id: string
  signature_request_id: string
  role: 'partie' | 'notaire'
  comparant_id: string | null
  utilisateur_id: string | null
  statut: 'en_attente' | 'signe' | 'refuse'
  signed_at: string | null
  ordre: number
  created_at: string
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

export type EvenementDisponibilite = 'disponible' | 'occupe' | 'indisponible'
export type EvenementParticipantStatut = 'en_attente' | 'accepte' | 'decline'

export interface EvenementCategorie {
  id: string
  tenant_id: string
  nom: string
  couleur: string
  created_at: string
}

export interface EvenementParticipant {
  id: string
  tenant_id: string
  evenement_id: string
  utilisateur_id: string
  is_organisateur: boolean
  statut: EvenementParticipantStatut
  created_at: string
  utilisateur?: Utilisateur
}

export type MailboxProvider = 'outlook'
export type MailboxConnectionStatus = 'active' | 'revoked' | 'error'

export interface MailboxConnection {
  id: string
  tenant_id: string
  utilisateur_id: string
  provider: MailboxProvider
  email_address: string
  status: MailboxConnectionStatus
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface EvenementDossier {
  id: string
  tenant_id: string
  evenement_id: string
  dossier_id: string
  dossier?: Dossier
}

export interface Evenement {
  id: string
  tenant_id: string
  titre: string
  description: string | null
  lieu: string | null
  debut: string
  fin: string | null
  all_day: boolean
  timezone: string
  categorie_id: string | null
  couleur: string | null
  disponibilite: EvenementDisponibilite
  organisateur_id: string | null
  rrule: string | null
  rrule_exdates: string[]
  recurrence_id: string | null
  recurrence_original_start: string | null
  outlook_event_id: string | null
  created_at: string
  est_prive: boolean
  categorie?: EvenementCategorie | null
  organisateur?: Utilisateur | null
  participants?: EvenementParticipant[]
  dossiers?: EvenementDossier[]
}
