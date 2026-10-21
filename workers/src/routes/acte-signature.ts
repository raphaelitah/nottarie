import { Hono } from 'hono'
import type { Env } from '../shared/env'
import { dbPool } from '../shared/db'
import { AuthError, verifyAuthHeader, isTenantMember, isNotaireOrAdmin, isNotaireClercOrAdmin } from '../shared/auth'
import { getSignatureProvider, MockSignatureProvider } from '../shared/signature/index'

type Action = 'designate' | 'request' | 'status' | 'retrieve' | 'simulate' | 'add_signataire' | 'remove_signataire' | 'reorder'

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
    const body = await c.req.json()
    const action = body.action as Action
    const provider = getSignatureProvider(pool, c.env.DOCUMENTS)

    if (action === 'designate') {
      const { acte_id } = body
      if (!acte_id) {
        return c.json({ error: 'acte_id est requis' }, 400)
      }
      const { rows } = await pool.query('select tenant_id from actes where id = $1', [acte_id])
      const acte = rows[0]
      if (!acte) return c.json({ error: 'Acte introuvable.' }, 404)
      if (!(await isNotaireOrAdmin(pool, callerId, acte.tenant_id))) {
        return c.json({ error: 'Accès refusé.' }, 403)
      }
      const result = await provider.designateSigners(acte.tenant_id, acte_id)
      return c.json({ signatureRequest: result })
    }

    const { signature_request_id } = body
    if (!signature_request_id) {
      return c.json({ error: 'signature_request_id est requis' }, 400)
    }

    const { rows: existingRows } = await pool.query(
      'select tenant_id from signature_requests where id = $1',
      [signature_request_id],
    )
    const existing = existingRows[0]
    if (!existing) return c.json({ error: 'Demande de signature introuvable.' }, 404)
    if (!(await isTenantMember(pool, callerId, existing.tenant_id))) {
      return c.json({ error: 'Accès refusé.' }, 403)
    }

    if (action === 'request') {
      if (!(await isNotaireOrAdmin(pool, callerId, existing.tenant_id))) {
        return c.json({ error: 'Accès refusé.' }, 403)
      }
      const result = await provider.requestSignature(existing.tenant_id, signature_request_id)
      return c.json({ signatureRequest: result })
    }

    if (action === 'status') {
      const result = await provider.getStatus(existing.tenant_id, signature_request_id)
      return c.json({ signatureRequest: result })
    }

    if (action === 'retrieve') {
      const result = await provider.retrieveSignedDocument(existing.tenant_id, signature_request_id)
      return c.json({ signedDocument: result })
    }

    if (action === 'add_signataire') {
      const { comparant_id } = body
      if (!comparant_id) {
        return c.json({ error: 'comparant_id est requis' }, 400)
      }
      if (!(await isNotaireClercOrAdmin(pool, callerId, existing.tenant_id))) {
        return c.json({ error: 'Accès refusé.' }, 403)
      }
      const result = await provider.addSignataire(existing.tenant_id, signature_request_id, comparant_id)
      return c.json({ signatureRequest: result })
    }

    if (action === 'remove_signataire') {
      const { signataire_id } = body
      if (!signataire_id) {
        return c.json({ error: 'signataire_id est requis' }, 400)
      }
      if (!(await isNotaireClercOrAdmin(pool, callerId, existing.tenant_id))) {
        return c.json({ error: 'Accès refusé.' }, 403)
      }
      const result = await provider.removeSignataire(existing.tenant_id, signature_request_id, signataire_id)
      return c.json({ signatureRequest: result })
    }

    if (action === 'reorder') {
      const { ordre } = body
      if (!Array.isArray(ordre)) {
        return c.json({ error: 'ordre est requis' }, 400)
      }
      if (!(await isNotaireClercOrAdmin(pool, callerId, existing.tenant_id))) {
        return c.json({ error: 'Accès refusé.' }, 403)
      }
      const result = await provider.reorderSignataires(existing.tenant_id, signature_request_id, ordre)
      return c.json({ signatureRequest: result })
    }

    if (action === 'simulate') {
      // Mock-only escape hatch (see MockSignatureProvider.simulateCompletion):
      // stands in for the callback a real provider would deliver. A real
      // provider wouldn't expose this action at all.
      if (!(provider instanceof MockSignatureProvider)) {
        return c.json({ error: "L'action 'simulate' n'existe que pour le fournisseur mock." }, 400)
      }
      if (!(await isNotaireOrAdmin(pool, callerId, existing.tenant_id))) {
        return c.json({ error: 'Accès refusé.' }, 403)
      }
      const result = await provider.simulateCompletion(existing.tenant_id, signature_request_id)
      return c.json({ signatureRequest: result })
    }

    return c.json({ error: 'Action inconnue.' }, 400)
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
