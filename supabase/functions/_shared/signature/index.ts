import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { MockSignatureProvider } from './mockSignatureProvider.ts'
import type { SignatureProvider } from './signatureProvider.ts'

export type { SignatureProvider } from './signatureProvider.ts'
export type { SignataireStatut, SignatureRequest, SignatureRequestStatut, SignedDocument } from './types.ts'
export { MockSignatureProvider } from './mockSignatureProvider.ts'

/**
 * Single swap point for ADR-02: today the mock is the only provider, since
 * ADSN/MICEN specs (EI-12) haven't been received. When a real provider
 * (ADSN, or a remote-signature provider like YouSign per EF-SIG-07) is
 * ready, it plugs in here — callers only ever depend on SignatureProvider.
 */
export function getSignatureProvider(admin: SupabaseClient): SignatureProvider {
  return new MockSignatureProvider(admin)
}
