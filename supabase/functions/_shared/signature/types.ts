export type SignatureRequestStatut = 'brouillon' | 'en_cours' | 'signee' | 'refusee' | 'annulee'
export type SignataireStatut = 'en_attente' | 'signe' | 'refuse'

export interface Signataire {
  id: string
  comparantId: string
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
