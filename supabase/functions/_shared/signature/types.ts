export type SignatureRequestStatut = 'brouillon' | 'en_cours' | 'signee' | 'refusee' | 'annulee'
export type SignataireStatut = 'en_attente' | 'signe' | 'refuse'
export type SignataireRole = 'partie' | 'notaire'

export interface Signataire {
  id: string
  role: SignataireRole
  /** Set when role is 'partie'. */
  comparantId: string | null
  /** Set when role is 'notaire'. */
  utilisateurId: string | null
  statut: SignataireStatut
  signedAt: string | null
}

export interface SignatureRequest {
  id: string
  tenantId: string
  dossierId: string
  acteId: string
  provider: string
  statut: SignatureRequestStatut
  externalReference: string | null
  documentSigneStoragePath: string | null
  accuseReceptionStoragePath: string | null
  signataires: Signataire[]
}

export interface SignedDocument {
  documentSigneStoragePath: string
  accuseReceptionStoragePath: string
}
