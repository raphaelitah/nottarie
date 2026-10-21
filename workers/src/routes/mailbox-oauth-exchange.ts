import { Hono } from 'hono'
import type { Env } from '../shared/env'
import { dbPool } from '../shared/db'
import { AuthError, verifyAuthHeader } from '../shared/auth'
import { getMailboxProvider, mailboxCallbackRedirectUri } from '../shared/mailbox/index'

function base64url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function codeChallengeFromVerifier(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
  return base64url(digest)
}

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
    const { code, state, code_verifier } = await c.req.json()
    if (!code || !state || !code_verifier) {
      return c.json({ error: 'code, state et code_verifier sont requis' }, 400)
    }

    const { rows: stateRows } = await pool.query(
      'select tenant_id, utilisateur_id, code_challenge, expires_at from mailbox_oauth_states where state = $1',
      [state],
    )
    const oauthState = stateRows[0]
    if (!oauthState) {
      return c.json({ error: 'Requête de connexion invalide ou expirée.' }, 400)
    }
    if (new Date(oauthState.expires_at).getTime() < Date.now()) {
      await pool.query('delete from mailbox_oauth_states where state = $1', [state])
      return c.json({ error: 'Requête de connexion expirée, veuillez réessayer.' }, 400)
    }

    const { rows: membreRows } = await pool.query(
      'select id, auth_user_id from utilisateurs where id = $1',
      [oauthState.utilisateur_id],
    )
    const membre = membreRows[0]
    if (!membre || membre.auth_user_id !== callerId) {
      return c.json({ error: 'Accès refusé.' }, 403)
    }

    const expectedChallenge = await codeChallengeFromVerifier(code_verifier)
    if (expectedChallenge !== oauthState.code_challenge) {
      return c.json({ error: 'Vérification PKCE invalide.' }, 400)
    }

    const provider = getMailboxProvider(pool, 'outlook', {
      encryptionKey: c.env.DOCUMENTS_ENCRYPTION_KEY,
      outlookClientId: c.env.OUTLOOK_CLIENT_ID,
      outlookClientSecret: c.env.OUTLOOK_CLIENT_SECRET,
    })
    const connection = await provider.handleCallback({
      tenantId: oauthState.tenant_id,
      utilisateurId: oauthState.utilisateur_id,
      code,
      codeVerifier: code_verifier,
      redirectUri: mailboxCallbackRedirectUri(new URL(c.req.url).origin),
    })

    await pool.query('delete from mailbox_oauth_states where state = $1', [state])

    return c.json({ connection })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
