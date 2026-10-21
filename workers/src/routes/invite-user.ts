import { Hono } from 'hono'
import type { Env } from '../shared/env'
import { dbPool } from '../shared/db'
import { AuthError, verifyAuthHeader, canManageEtude } from '../shared/auth'

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
    const { email, role, tenant_id } = await c.req.json()
    if (!email || !role || !tenant_id) {
      return c.json({ error: 'email, role et tenant_id sont requis' }, 400)
    }

    if (!(await canManageEtude(pool, callerId, tenant_id))) {
      return c.json({ error: 'Accès refusé à cette étude.' }, 403)
    }

    // TODO(Phase 4 follow-up): the original implementation called Supabase
    // Auth's Admin API (auth.admin.inviteUserByEmail — falling back to
    // auth.admin.listUsers to find the existing auth user id if they were
    // already registered) to get an auth_user_id before inserting the
    // `utilisateurs` row below. Neon's Managed Better Auth doesn't expose an
    // equivalent admin "invite by email" API reachable from a Worker the
    // same way — this needs a Better-Auth-native invite flow (or a direct
    // users-table lookup/insert, once we know that schema) before this
    // action can create real logins again.
    return c.json(
      { error: "Not yet implemented against Neon's Managed Better Auth — see Phase 4 follow-up" },
      501,
    )
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
