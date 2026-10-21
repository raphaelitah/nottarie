import type { Pool } from '@neondatabase/serverless'
import { MockSignatureProvider } from './mockSignatureProvider'
import type { SignatureProvider } from './signatureProvider'

export type { SignatureProvider } from './signatureProvider'
export type { SignataireStatut, SignatureRequest, SignatureRequestStatut, SignedDocument } from './types'
export { MockSignatureProvider } from './mockSignatureProvider'

/**
 * Single swap point for ADR-02: today the mock is the only provider, since
 * ADSN/MICEN specs (EI-12) haven't been received. When a real provider
 * (ADSN, or a remote-signature provider like YouSign per EF-SIG-07) is
 * ready, it plugs in here — callers only ever depend on SignatureProvider.
 */
export function getSignatureProvider(pool: Pool, bucket: R2Bucket): SignatureProvider {
  return new MockSignatureProvider(pool, bucket)
}
