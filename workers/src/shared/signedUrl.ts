/**
 * Replaces Supabase Storage's createSignedUrl: an HMAC-signed, time-limited
 * link the Worker itself verifies (no R2 S3-credential presigning needed).
 * Once issued, the link's validity is the access control — same semantics
 * as a Supabase signed URL, so no bearer token is required to use it.
 */
async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function signPath(path: string, expiresAt: number, secret: string): Promise<string> {
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${path}:${expiresAt}`))
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function verifySignedPath(path: string, expiresAt: number, sig: string, secret: string): Promise<boolean> {
  if (Date.now() > expiresAt) return false
  const expected = await signPath(path, expiresAt, secret)
  return expected === sig
}
