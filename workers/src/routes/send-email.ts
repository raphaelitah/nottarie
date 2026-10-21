import { Hono } from 'hono'
import type { Env } from '../shared/env'
import { dbPool } from '../shared/db'
import { AuthError, verifyAuthHeader, isTenantMember } from '../shared/auth'
import { getDocument } from '../shared/documents'
import { getMailboxProvider, NoMailboxConnectedError } from '../shared/mailbox/index'

function encodeBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
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
    const { dossier_id, to, cc, subject, body_html, courrier_id, document_ids } = await c.req.json()
    if (!dossier_id || !Array.isArray(to) || to.length === 0 || !subject) {
      return c.json({ error: 'dossier_id, to et subject sont requis' }, 400)
    }

    const { rows: dossierRows } = await pool.query('select tenant_id from dossiers where id = $1', [dossier_id])
    const dossier = dossierRows[0]
    if (!dossier) return c.json({ error: 'Dossier introuvable.' }, 404)
    if (!(await isTenantMember(pool, callerId, dossier.tenant_id))) {
      return c.json({ error: 'Accès refusé.' }, 403)
    }

    let attachments: { filename: string; contentType: string; contentBase64: string }[] = []
    if (Array.isArray(document_ids) && document_ids.length > 0) {
      const { rows: docs } = await pool.query(
        'select id, nom, storage_path, tenant_id, dossier_id from documents where id = any($1)',
        [document_ids],
      )
      const invalid = docs.find((d) => d.tenant_id !== dossier.tenant_id || d.dossier_id !== dossier_id)
      if (invalid || docs.length !== document_ids.length) {
        return c.json({ error: 'Un ou plusieurs documents sont introuvables pour ce dossier.' }, 400)
      }
      attachments = await Promise.all(docs.map(async (d) => {
        const relativePath = d.storage_path.replace(`${dossier.tenant_id}/`, '')
        const fileObject = await getDocument(c.env.DOCUMENTS, dossier.tenant_id, relativePath)
        if (!fileObject) throw new Error(`Impossible de récupérer le document "${d.nom}"`)
        const buffer = await fileObject.arrayBuffer()
        return {
          filename: d.nom,
          contentType: fileObject.httpMetadata?.contentType || 'application/octet-stream',
          contentBase64: encodeBase64(buffer),
        }
      }))
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
      result = await provider.sendMail({
        tenantId: dossier.tenant_id,
        utilisateurId: membre.id,
        to,
        cc,
        subject,
        bodyHtml: body_html ?? '',
        attachments,
      })
    } catch (err) {
      if (err instanceof NoMailboxConnectedError) {
        return c.json({ error: 'no_mailbox_connected' }, 409)
      }
      throw err
    }

    const { rows: emailRows } = await pool.query(
      `insert into emails (tenant_id, dossier_id, courrier_id, sens, objet, corps, provider, provider_message_id, utilisateur_id, destinataires, cc)
       values ($1, $2, $3, 'sortant', $4, $5, 'outlook', $6, $7, $8, $9)
       returning *`,
      [
        dossier.tenant_id,
        dossier_id,
        courrier_id ?? null,
        subject,
        body_html ?? null,
        result.providerMessageId,
        membre.id,
        to,
        cc ?? [],
      ],
    )
    const email = emailRows[0]

    return c.json({ email })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
