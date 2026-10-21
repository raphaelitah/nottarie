import { Hono } from 'hono'
import type { Env } from '../shared/env'
import { dbPool } from '../shared/db'
import { AuthError, verifyAuthHeader, canManageEtude } from '../shared/auth'
import { createUserAccount, sendPasswordResetLink, BetterAuthAdminError } from '../shared/betterAuthAdmin'

const app = new Hono<{ Bindings: Env }>()

app.post('/', async (c) => {
  try {
    const authHeader = c.req.header('Authorization') ?? null
    if (!authHeader) {
      return c.json({ error: 'Non authentifié' }, 401)
    }

    let callerId: string
    try {
      callerId = await verifyAuthHeader(authHeader, c.env.NEON_AUTH_JWKS_URL)
    } catch (err) {
      if (err instanceof AuthError) return c.json({ error: 'Session invalide' }, 401)
      throw err
    }

    const pool = dbPool(c.env.DATABASE_URL)
    const { email, prenom, nom, role, tenant_id } = await c.req.json()
    if (!email || !role || !tenant_id) {
      return c.json({ error: 'email, role et tenant_id sont requis' }, 400)
    }

    if (!(await canManageEtude(pool, callerId, tenant_id))) {
      return c.json({ error: 'Accès refusé à cette étude.' }, 403)
    }

    const name = [prenom, nom].filter(Boolean).join(' ') || email

    let authUserId: string
    try {
      const account = await createUserAccount(c.env.NEON_AUTH_JWKS_URL, { email, name })
      authUserId = account.userId
    } catch (err) {
      if (err instanceof BetterAuthAdminError) {
        const status = err.status === 401 || err.status === 403 ? 409 : err.status
        return c.json({ error: `Impossible de créer le compte : ${err.message}` }, status)
      }
      throw err
    }

    await pool.query(
      `insert into utilisateurs (auth_user_id, tenant_id, nom, prenom, roles)
       values ($1, $2, $3, $4, $5)`,
      [authUserId, tenant_id, nom ?? null, prenom ?? null, [role]]
    )

    try {
      await sendPasswordResetLink(c.env.NEON_AUTH_JWKS_URL, { email, redirectTo: `${c.env.FRONTEND_URL}/` })
    } catch {
      // The account and étude membership were created either way; the user
      // can still request their own reset link from the sign-in page.
    }

    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
