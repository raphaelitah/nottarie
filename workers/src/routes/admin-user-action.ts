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
    const { action, utilisateur_id, roles, email, actif } = await c.req.json()

    if (action === 'update_roles' || action === 'set_actif') {
      if (!utilisateur_id) {
        return c.json({ error: 'utilisateur_id requis' }, 400)
      }
      if (action === 'update_roles' && !roles) {
        return c.json({ error: 'roles requis' }, 400)
      }
      if (action === 'set_actif' && actif === undefined) {
        return c.json({ error: 'actif requis' }, 400)
      }

      const { rows } = await pool.query('select tenant_id from utilisateurs where id = $1', [utilisateur_id])
      const target = rows[0]
      if (!target) return c.json({ error: 'Utilisateur introuvable' }, 404)

      if (!(await canManageEtude(pool, callerId, target.tenant_id))) {
        return c.json({ error: 'Accès refusé à cette étude.' }, 403)
      }

      if (action === 'update_roles') {
        await pool.query('update utilisateurs set roles = $1 where id = $2', [roles, utilisateur_id])
      } else {
        await pool.query('update utilisateurs set actif = $1 where id = $2', [actif, utilisateur_id])
      }
      return c.json({ success: true })
    }

    if (action === 'resend_invite') {
      if (!email) {
        return c.json({ error: 'email requis' }, 400)
      }

      // TODO(Phase 4 follow-up): the original implementation used Supabase
      // Auth's Admin API (auth.admin.listUsers to find the target user, then
      // supabaseAnon.auth.resetPasswordForEmail to resend the invite link,
      // then auth.admin.updateUserById to stamp invite_last_sent_at for the
      // 2-minute resend cooldown). Neon's Managed Better Auth doesn't expose
      // an equivalent admin API reachable from a Worker the same way — this
      // needs its own design (likely a direct call into Better Auth's own
      // server-side invite/reset-link API, or a dedicated users table we can
      // query/update directly) before this action can work again.
      return c.json(
        { error: "Not yet implemented against Neon's Managed Better Auth — see Phase 4 follow-up" },
        501,
      )
    }

    if (action === 'reset_password') {
      if (!email) {
        return c.json({ error: 'email requis' }, 400)
      }

      // TODO(Phase 4 follow-up): same gap as resend_invite above — this relied
      // on auth.admin.listUsers to find the target and
      // supabaseAnon.auth.resetPasswordForEmail to trigger the reset email.
      // Needs a Better-Auth-native equivalent.
      return c.json(
        { error: "Not yet implemented against Neon's Managed Better Auth — see Phase 4 follow-up" },
        501,
      )
    }

    return c.json({ error: 'Action inconnue' }, 400)
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
