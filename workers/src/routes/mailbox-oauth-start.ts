import { Hono } from 'hono'
import type { Env } from '../shared/env'
import { dbPool } from '../shared/db'
import { AuthError, verifyAuthHeader, isTenantMember } from '../shared/auth'
import { getMailboxProvider, mailboxCallbackRedirectUri } from '../shared/mailbox/index'

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
    const { tenant_id, code_challenge } = await c.req.json()
    if (!tenant_id || !code_challenge) {
      return c.json({ error: 'tenant_id et code_challenge sont requis' }, 400)
    }
    if (!(await isTenantMember(pool, callerId, tenant_id))) {
      return c.json({ error: 'Accès refusé.' }, 403)
    }

    const { rows: membreRows } = await pool.query(
      'select id from utilisateurs where auth_user_id = $1 and tenant_id = $2',
      [callerId, tenant_id],
    )
    const membre = membreRows[0]
    if (!membre) {
      return c.json({ error: 'Utilisateur introuvable.' }, 404)
    }

    const state = crypto.randomUUID()
    try {
      await pool.query(
        'insert into mailbox_oauth_states (state, tenant_id, utilisateur_id, code_challenge) values ($1, $2, $3, $4)',
        [state, tenant_id, membre.id, code_challenge],
      )
    } catch (err) {
      return c.json({ error: String(err) }, 500)
    }

    const provider = getMailboxProvider(pool, 'outlook', {
      encryptionKey: c.env.DOCUMENTS_ENCRYPTION_KEY,
      outlookClientId: c.env.OUTLOOK_CLIENT_ID,
      outlookClientSecret: c.env.OUTLOOK_CLIENT_SECRET,
    })
    const authorizeUrl = provider.getAuthorizeUrl({
      state,
      codeChallenge: code_challenge,
      redirectUri: mailboxCallbackRedirectUri(new URL(c.req.url).origin),
    })

    return c.json({ authorizeUrl, state })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
