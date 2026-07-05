import type { SignatureRequest, SignedDocument } from './types.ts'

/**
 * ADR-02: all signature/AAE flows (EF-SIG-01–06) go through this interface,
 * never through provider-specific code called directly from route handlers.
 * The only implementation until ADSN/MICEN specs (EI-12) arrive is the mock
 * below; a real ADSN or remote-signature (e.g. YouSign, EF-SIG-07) provider
 * plugs in here without any caller needing to change.
 */
export interface SignatureProvider {
  /** EF-SIG-01: designate which comparants must sign the given acte. */
  designateSigners(tenantId: string, acteId: string, comparantIds: string[]): Promise<SignatureRequest>

  /** EF-SIG-02: hand the signature process to the provider. */
  requestSignature(tenantId: string, signatureRequestId: string): Promise<SignatureRequest>

  /** EF-SIG-03/04: current status of the process and each signataire. */
  getStatus(tenantId: string, signatureRequestId: string): Promise<SignatureRequest>

  /** EF-SIG-05/06: once statut is 'signee', retrieve the signed acte and its archival receipt (AAE). */
  retrieveSignedDocument(tenantId: string, signatureRequestId: string): Promise<SignedDocument>
}
