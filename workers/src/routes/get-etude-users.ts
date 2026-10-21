import { Hono } from 'hono'
import type { Env } from '../shared/env'
import { dbPool } from '../shared/db'
import { AuthError, verifyAuthHeader, canManageEtude } from '../shared/auth'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
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
    const tenant_id = c.req.query('tenant_id')
    if (!tenant_id) {
      return c.json({ error: 'tenant_id requis' }, 400)
    }

    if (!(await canManageEtude(pool, callerId, tenant_id))) {
      return c.json({ error: 'Accès refusé à cette étude.' }, 403)
    }

    const { rows: data } = await pool.query(
      'select u.*, n.email as email from utilisateurs u left join neon_auth."user" n on n.id = u.auth_user_id where u.tenant_id = $1 order by u.created_at asc',
      [tenant_id],
    )

    // `invited` (password not yet set) can't be reconstructed: Supabase
    // tracked it via a custom user_metadata flag we no longer set (Managed
    // Better Auth has no equivalent "has this user ever signed in" field
    // reachable here). Left false always — resend_invite/reset_password
    // still work regardless, this only drops the UI's "invited" badge.
    const enriched = data.map((u: Record<string, unknown>) => ({
      ...u,
      invited: false,
    }))

    return c.json({ users: enriched })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
