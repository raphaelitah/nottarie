import { Hono } from 'hono'
import type { Env } from '../shared/env'
import { dbPool } from '../shared/db'
import { AuthError, verifyAuthHeader, canManageEtude, isPlatformAdmin } from '../shared/auth'
import { sendPasswordResetLink, BetterAuthAdminError } from '../shared/betterAuthAdmin'

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

    if (action === 'resend_invite' || action === 'reset_password') {
      if (!email) {
        return c.json({ error: 'email requis' }, 400)
      }

      // No admin "list users by email" API reachable from a Worker, but
      // Managed Better Auth's own tables live in this same Postgres database
      // — look the target up there directly instead.
      const { rows: targetRows } = await pool.query<{ id: string }>(
        'select id from neon_auth."user" where email = $1',
        [email],
      )
      const target = targetRows[0]
      if (!target) return c.json({ error: 'Utilisateur introuvable' }, 404)

      const { rows: memberships } = await pool.query<{ tenant_id: string }>(
        'select tenant_id from utilisateurs where auth_user_id = $1',
        [target.id],
      )
      const callerIsPlatformAdmin = await isPlatformAdmin(pool, callerId)
      const callerManagesAMembership = (
        await Promise.all(memberships.map((m) => canManageEtude(pool, callerId, m.tenant_id)))
      ).some(Boolean)
      if (!callerIsPlatformAdmin && !callerManagesAMembership) {
        return c.json({ error: 'Accès refusé à cet utilisateur.' }, 403)
      }

      try {
        await sendPasswordResetLink(c.env.NEON_AUTH_JWKS_URL, { email, redirectTo: `${c.env.FRONTEND_URL}/` })
      } catch (err) {
        if (err instanceof BetterAuthAdminError) return c.json({ error: err.message }, err.status)
        throw err
      }
      return c.json({ success: true })
    }

    return c.json({ error: 'Action inconnue' }, 400)
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
