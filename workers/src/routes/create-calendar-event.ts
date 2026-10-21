import { Hono } from 'hono'
import type { Env } from '../shared/env'
import { dbPool } from '../shared/db'
import { AuthError, verifyAuthHeader, isTenantMember } from '../shared/auth'
import { getMailboxProvider, NoMailboxConnectedError } from '../shared/mailbox/index'

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
    const { dossier_id, titre, lieu, debut, fin, attendees } = await c.req.json()
    if (!dossier_id || !titre || !debut || !fin || !Array.isArray(attendees) || attendees.length === 0) {
      return c.json({ error: 'dossier_id, titre, debut, fin et attendees sont requis' }, 400)
    }

    const { rows: dossierRows } = await pool.query('select tenant_id from dossiers where id = $1', [dossier_id])
    const dossier = dossierRows[0]
    if (!dossier) return c.json({ error: 'Dossier introuvable.' }, 404)
    if (!(await isTenantMember(pool, callerId, dossier.tenant_id))) {
      return c.json({ error: 'Accès refusé.' }, 403)
    }

    const { rows: membreRows } = await pool.query(
      'select id from utilisateurs where auth_user_id = $1 and tenant_id = $2',
      [callerId, dossier.tenant_id],
    )
    const membre = membreRows[0]
    if (!membre) {
      return c.json({ error: 'Utilisateur introuvable.' }, 404)
    }

    const provider = getMailboxProvider(pool, 'outlook', {
      encryptionKey: c.env.DOCUMENTS_ENCRYPTION_KEY,
      outlookClientId: c.env.OUTLOOK_CLIENT_ID,
      outlookClientSecret: c.env.OUTLOOK_CLIENT_SECRET,
    })

    let result
    try {
      result = await provider.createCalendarEvent({
        tenantId: dossier.tenant_id,
        utilisateurId: membre.id,
        titre,
        lieu: lieu ?? null,
        debut,
        fin,
        attendees,
      })
    } catch (err) {
      if (err instanceof NoMailboxConnectedError) {
        return c.json({ error: 'no_mailbox_connected' }, 409)
      }
      throw err
    }

    const { rows: evenementRows } = await pool.query(
      `insert into evenements (tenant_id, titre, lieu, debut, fin, organisateur_id, outlook_event_id)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning *`,
      [dossier.tenant_id, titre, lieu ?? null, debut, fin, membre.id, result.eventId],
    )
    const evenement = evenementRows[0]

    await pool.query(
      'insert into evenement_dossiers (tenant_id, evenement_id, dossier_id) values ($1, $2, $3)',
      [dossier.tenant_id, evenement.id, dossier_id],
    )

    return c.json({ evenement })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
