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
      'select * from utilisateurs where tenant_id = $1 order by created_at asc',
      [tenant_id],
    )

    // TODO(Phase 4 follow-up): the original enriched each row with `email`
    // and `invited` (password not yet set) read from Supabase Auth's
    // auth.admin.listUsers(). Neon's Managed Better Auth doesn't expose that
    // same admin listing from a Worker — once we know where/how Better Auth
    // exposes its user table (or a server-side admin API) to query from here,
    // wire these two fields back up. Until then they're left as null/false
    // rather than 501-ing the whole endpoint, since the étude's user list
    // itself (the roles/actif data) is still fully functional from Postgres.
    const enriched = data.map((u: Record<string, unknown>) => ({
      ...u,
      email: null,
      invited: false,
    }))

    return c.json({ users: enriched })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
