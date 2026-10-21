import { Hono } from 'hono'
import type { Env } from '../shared/env'
import { dbPool } from '../shared/db'
import { AuthError, verifyAuthHeader, isTenantMember } from '../shared/auth'
import { getDocument, putDocument, deleteDocument, tenantKey } from '../shared/documents'
import { signPath, verifySignedPath } from '../shared/signedUrl'

const app = new Hono<{ Bindings: Env }>()

/** Paths stored in the `documents`/`actes` tables already look like `<tenant_id>/...`. */
function splitTenantPrefixedPath(fullPath: string): { tenantId: string; relativePath: string } {
  const slash = fullPath.indexOf('/')
  if (slash === -1) throw new Error('Invalid storage path')
  return { tenantId: fullPath.slice(0, slash), relativePath: fullPath.slice(slash + 1) }
}

async function requireTenantMember(c: { env: Env; req: { header: (name: string) => string | undefined } }, tenantId: string) {
  const authHeader = c.req.header('Authorization') ?? null
  const callerId = await verifyAuthHeader(authHeader, c.env.NEON_AUTH_JWKS_URL)
  const pool = dbPool(c.env.DATABASE_URL)
  if (!(await isTenantMember(pool, callerId, tenantId))) {
    throw new AuthError('Not a member of this tenant')
  }
}

app.post('/upload', async (c) => {
  const path = c.req.query('path')
  const contentType = c.req.query('contentType') ?? undefined
  if (!path) return c.json({ error: 'Missing path' }, 400)
  const { tenantId, relativePath } = splitTenantPrefixedPath(path)
  try {
    await requireTenantMember(c, tenantId)
  } catch (err) {
    if (err instanceof AuthError) return c.json({ error: err.message }, 401)
    throw err
  }
  const body = await c.req.arrayBuffer()
  await putDocument(c.env.DOCUMENTS, tenantId, relativePath, body, contentType)
  return c.json({ path })
})

app.post('/signed-url', async (c) => {
  const { path, expiresInSeconds } = await c.req.json<{ path: string; expiresInSeconds: number }>()
  if (!path) return c.json({ error: 'Missing path' }, 400)
  const { tenantId } = splitTenantPrefixedPath(path)
  try {
    await requireTenantMember(c, tenantId)
  } catch (err) {
    if (err instanceof AuthError) return c.json({ error: err.message }, 401)
    throw err
  }
  const expiresAt = Date.now() + (expiresInSeconds ?? 60) * 1000
  const sig = await signPath(path, expiresAt, c.env.DOCUMENTS_ENCRYPTION_KEY)
  const signedUrl = `${new URL(c.req.url).origin}/documents/download?path=${encodeURIComponent(path)}&expires=${expiresAt}&sig=${sig}`
  return c.json({ signedUrl })
})

app.get('/download', async (c) => {
  const path = c.req.query('path')
  const expires = Number(c.req.query('expires'))
  const sig = c.req.query('sig')
  if (!path || !expires || !sig) return c.json({ error: 'Invalid link' }, 400)
  if (!(await verifySignedPath(path, expires, sig, c.env.DOCUMENTS_ENCRYPTION_KEY))) {
    return c.json({ error: 'Link expired or invalid' }, 403)
  }
  const { tenantId, relativePath } = splitTenantPrefixedPath(path)
  const object = await getDocument(c.env.DOCUMENTS, tenantId, relativePath)
  if (!object) return c.json({ error: 'Not found' }, 404)
  return new Response(object.body, {
    headers: { 'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream' },
  })
})

app.post('/delete', async (c) => {
  const { path } = await c.req.json<{ path: string }>()
  if (!path) return c.json({ error: 'Missing path' }, 400)
  const { tenantId, relativePath } = splitTenantPrefixedPath(path)
  try {
    await requireTenantMember(c, tenantId)
  } catch (err) {
    if (err instanceof AuthError) return c.json({ error: err.message }, 401)
    throw err
  }
  await deleteDocument(c.env.DOCUMENTS, tenantId, relativePath)
  return c.json({ ok: true })
})

export default app
export { tenantKey }
