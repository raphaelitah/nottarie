import type { SignatureRequest, SignedDocument } from './types.ts'

/**
 * ADR-02: all signature/AAE flows (EF-SIG-01–06) go through this interface,
 * never through provider-specific code called directly from route handlers.
 * The only implementation until ADSN/MICEN specs (EI-12) arrive is the mock
 * below; a real ADSN or remote-signature (e.g. YouSign, EF-SIG-07) provider
 * plugs in here without any caller needing to change.
 */
export interface SignatureProvider {
  /**
   * EF-SIG-01: designate who must sign the given acte — every living,
   * physical-person comparant on its dossier, plus the dossier's notaire
   * (always last). This is the default signer set; addSignataire/
   * removeSignataire let the notaire or a clerc adjust it before signing,
   * typically during relecture at the signing event.
   */
  designateSigners(tenantId: string, acteId: string): Promise<SignatureRequest>

  /** EF-SIG-02: hand the signature process to the provider. */
  requestSignature(tenantId: string, signatureRequestId: string): Promise<SignatureRequest>

  /** EF-SIG-03/04: current status of the process and each signataire. */
  getStatus(tenantId: string, signatureRequestId: string): Promise<SignatureRequest>

  /** EF-SIG-05/06: once statut is 'signee', retrieve the signed acte and its archival receipt (AAE). */
  retrieveSignedDocument(tenantId: string, signatureRequestId: string): Promise<SignedDocument>

  /**
   * Add a signataire beyond the auto-designated set, e.g. during relecture
   * at the signing event. Must be one of the dossier's comparants; the
   * notaire's row always stays last.
   */
  addSignataire(tenantId: string, signatureRequestId: string, comparantId: string): Promise<SignatureRequest>

  /** Remove a not-yet-signed 'partie' signataire (the notaire can't be removed). */
  removeSignataire(tenantId: string, signatureRequestId: string, signataireId: string): Promise<SignatureRequest>

  /**
   * Reorder the not-yet-signed 'partie' signataires. The notaire's row is
   * excluded from the ordering submitted here and is always re-pinned last.
   */
  reorderSignataires(tenantId: string, signatureRequestId: string, ordre: { signataireId: string; ordre: number }[]): Promise<SignatureRequest>
}
