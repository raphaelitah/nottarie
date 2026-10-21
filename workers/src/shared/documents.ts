/**
 * Replaces Supabase Storage's `documents` bucket. Objects are still
 * tenant-folder-scoped (`<tenant_id>/...`), but access control that used to
 * live in storage.objects RLS policies is now enforced here in application
 * code before every read/write — callers must check tenant membership
 * themselves (see shared/auth.ts) before calling these.
 */
export function tenantKey(tenantId: string, path: string): string {
  const cleanPath = path.replace(/^\/+/, '')
  return `${tenantId}/${cleanPath}`
}

export async function putDocument(bucket: R2Bucket, tenantId: string, path: string, data: ArrayBuffer | Uint8Array, contentType?: string) {
  await bucket.put(tenantKey(tenantId, path), data, {
    httpMetadata: contentType ? { contentType } : undefined,
  })
}

export async function getDocument(bucket: R2Bucket, tenantId: string, path: string) {
  return bucket.get(tenantKey(tenantId, path))
}

export async function deleteDocument(bucket: R2Bucket, tenantId: string, path: string) {
  await bucket.delete(tenantKey(tenantId, path))
}
