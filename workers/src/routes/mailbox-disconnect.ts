import { Hono } from 'hono'
import type { Env } from '../shared/env'
import { dbPool } from '../shared/db'
import { AuthError, verifyAuthHeader, isTenantMember } from '../shared/auth'
import { getMailboxProvider } from '../shared/mailbox/index'

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
    const { tenant_id } = await c.req.json()
    if (!tenant_id) {
      return c.json({ error: 'tenant_id est requis' }, 400)
    }
    if (!(await isTenantMember(pool, callerId, tenant_id))) {
      return c.json({ error: 'Accès refusé.' }, 403)
    }

    const { rows } = await pool.query(
      'select id from utilisateurs where auth_user_id = $1 and tenant_id = $2',
      [callerId, tenant_id],
    )
    const membre = rows[0]
    if (!membre) {
      return c.json({ error: 'Utilisateur introuvable.' }, 404)
    }

    // Self-disconnect only: a user can disconnect their own mailbox, not
    // someone else's. Revoking another person's OAuth grant without their
    // knowledge is a deliberate feature to design later, not a side effect.
    const provider = getMailboxProvider(pool, 'outlook', {
      encryptionKey: c.env.DOCUMENTS_ENCRYPTION_KEY,
      outlookClientId: c.env.OUTLOOK_CLIENT_ID,
      outlookClientSecret: c.env.OUTLOOK_CLIENT_SECRET,
    })
    await provider.disconnect({ tenantId: tenant_id, utilisateurId: membre.id })

    return c.json({ status: 'revoked' })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
