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

    // `invited` means "has never signed in" — Supabase tracked this via a
    // custom user_metadata flag set on first real sign-in; Managed Better
    // Auth has no equivalent field, but it does create a neon_auth.session
    // row the moment someone actually logs in, which serves the same
    // purpose: no session row ever created yet = still pending.
    const { rows: data } = await pool.query(
      `select u.*, n.email as email,
              not exists (select 1 from neon_auth.session s where s."userId" = u.auth_user_id) as invited
       from utilisateurs u
       left join neon_auth."user" n on n.id = u.auth_user_id
       where u.tenant_id = $1
       order by u.created_at asc`,
      [tenant_id],
    )

    return c.json({ users: data })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
