import type { Pool } from '@neondatabase/serverless'
import type { SignatureProvider } from './signatureProvider'
import type { Signataire, SignatureRequest, SignedDocument } from './types'

interface SignatureRequestRow {
  id: string
  tenant_id: string
  dossier_id: string
  acte_id: string
  provider: string
  statut: SignatureRequest['statut']
  external_reference: string | null
  document_signe_storage_path: string | null
  accuse_reception_storage_path: string | null
}

interface SignataireRow {
  id: string
  role: Signataire['role']
  comparant_id: string | null
  utilisateur_id: string | null
  statut: Signataire['statut']
  signed_at: string | null
  ordre: number
}

function mapRequest(row: SignatureRequestRow, signataires: SignataireRow[]): SignatureRequest {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    dossierId: row.dossier_id,
    acteId: row.acte_id,
    provider: row.provider,
    statut: row.statut,
    externalReference: row.external_reference,
    documentSigneStoragePath: row.document_signe_storage_path,
    accuseReceptionStoragePath: row.accuse_reception_storage_path,
    signataires: [...signataires]
      .sort((a, b) => a.ordre - b.ordre)
      .map((s) => ({
        id: s.id,
        role: s.role,
        comparantId: s.comparant_id,
        utilisateurId: s.utilisateur_id,
        statut: s.statut,
        signedAt: s.signed_at,
        ordre: s.ordre,
      })),
  }
}

/**
 * Mock SignatureProvider (ADR-02): stands in until ADSN/MICEN specs (EI-12)
 * arrive. Persists the same signature_requests/signature_signataires rows a
 * real provider would, and produces plausible signed-document + archival-
 * receipt artifacts so downstream code (retrieval, downloads) has something
 * real to work with — but nothing here talks to an actual signature network.
 *
 * Reminders/notifications to nag outstanding signataires are deferred: a
 * scheduled job could scan signature_signataires for statut='en_attente'
 * rows past some age and notify, but that needs email sending to exist
 * first (it doesn't yet).
 */
export class MockSignatureProvider implements SignatureProvider {
  constructor(private readonly pool: Pool, private readonly bucket: R2Bucket) {}

  private async loadRequest(tenantId: string, signatureRequestId: string): Promise<SignatureRequestRow> {
    const { rows } = await this.pool.query<SignatureRequestRow>(
      'select * from signature_requests where id = $1 and tenant_id = $2',
      [signatureRequestId, tenantId],
    )
    if (!rows[0]) throw new Error('Demande de signature introuvable.')
    return rows[0]
  }

  private async loadSignataires(signatureRequestId: string): Promise<SignataireRow[]> {
    const { rows } = await this.pool.query<SignataireRow>(
      'select * from signature_signataires where signature_request_id = $1',
      [signatureRequestId],
    )
    return rows
  }

  async designateSigners(tenantId: string, acteId: string): Promise<SignatureRequest> {
    const { rows: acteRows } = await this.pool.query<{ id: string; tenant_id: string; dossier_id: string }>(
      'select id, tenant_id, dossier_id from actes where id = $1 and tenant_id = $2',
      [acteId, tenantId],
    )
    const acte = acteRows[0]
    if (!acte) throw new Error('Acte introuvable.')

    const { rows: activeRows } = await this.pool.query<{ id: string }>(
      "select id from signature_requests where acte_id = $1 and statut in ('brouillon', 'en_cours') limit 1",
      [acteId],
    )
    if (activeRows[0]) throw new Error('Une demande de signature est déjà en cours pour cet acte.')

    const { rows: dossierRows } = await this.pool.query<{ id: string; notaire_id: string | null }>(
      'select id, notaire_id from dossiers where id = $1',
      [acte.dossier_id],
    )
    const dossier = dossierRows[0]
    if (!dossier) throw new Error('Dossier introuvable.')

    // Only living, physical-person comparants sign by default (a deceased
    // party, a personne morale, or a tiers/partenaire can't/shouldn't); the
    // notaire or a clerc can still add others manually via addSignataire.
    const { rows: comparants } = await this.pool.query<{ id: string }>(
      `select c.id from comparants c
       join personnes p on p.id = c.personne_id
       where c.dossier_id = $1 and p.type = 'physique' and p.date_deces is null`,
      [acte.dossier_id],
    )
    const livingComparantIds = comparants.map((c) => c.id)
    if (livingComparantIds.length === 0) throw new Error('Aucune partie vivante à faire signer sur ce dossier.')

    const { rows: requestRows } = await this.pool.query<SignatureRequestRow>(
      `insert into signature_requests (tenant_id, dossier_id, acte_id, provider)
       values ($1, $2, $3, 'mock') returning *`,
      [tenantId, acte.dossier_id, acteId],
    )
    const request = requestRows[0]
    if (!request) throw new Error('Erreur lors de la création de la demande de signature : insert failed')

    for (const [index, comparantId] of livingComparantIds.entries()) {
      await this.pool.query(
        `insert into signature_signataires (tenant_id, dossier_id, signature_request_id, role, comparant_id, ordre)
         values ($1, $2, $3, 'partie', $4, $5)`,
        [tenantId, acte.dossier_id, request.id, comparantId, index],
      )
    }
    await this.pool.query(
      `insert into signature_signataires (tenant_id, dossier_id, signature_request_id, role, utilisateur_id, ordre)
       values ($1, $2, $3, 'notaire', $4, $5)`,
      [tenantId, acte.dossier_id, request.id, dossier.notaire_id, livingComparantIds.length],
    )

    return mapRequest(request, await this.loadSignataires(request.id))
  }

  async requestSignature(tenantId: string, signatureRequestId: string): Promise<SignatureRequest> {
    const existing = await this.loadRequest(tenantId, signatureRequestId)
    if (existing.statut !== 'brouillon') throw new Error('Cette demande de signature a déjà été envoyée.')

    const { rows: requestRows } = await this.pool.query<SignatureRequestRow>(
      `update signature_requests set statut = 'en_cours', external_reference = $2
       where id = $1 returning *`,
      [signatureRequestId, `mock-${crypto.randomUUID()}`],
    )
    const request = requestRows[0]
    if (!request) throw new Error("Erreur lors de l'envoi en signature : update failed")

    // The acte itself is now awaiting signature — see ActesSection's statut badge.
    await this.pool.query("update actes set statut = 'a_signer' where id = $1", [existing.acte_id])

    return mapRequest(request, await this.loadSignataires(signatureRequestId))
  }

  /** Re-pins the notaire's row to sort after every 'partie' row, whatever ordre was submitted for it. */
  private async repinNotaireOrdre(signatureRequestId: string): Promise<void> {
    const signataires = await this.loadSignataires(signatureRequestId)
    const notaire = signataires.find((s) => s.role === 'notaire')
    if (!notaire) return
    const maxPartieOrdre = signataires
      .filter((s) => s.role === 'partie')
      .reduce((max, s) => Math.max(max, s.ordre), -1)
    if (notaire.ordre <= maxPartieOrdre) {
      await this.pool.query('update signature_signataires set ordre = $2 where id = $1', [notaire.id, maxPartieOrdre + 1])
    }
  }

  async addSignataire(tenantId: string, signatureRequestId: string, comparantId: string): Promise<SignatureRequest> {
    const existing = await this.loadRequest(tenantId, signatureRequestId)

    const { rows: comparantRows } = await this.pool.query<{ id: string; dossier_id: string; type: string; date_deces: string | null }>(
      `select c.id, c.dossier_id, p.type, p.date_deces from comparants c
       join personnes p on p.id = c.personne_id
       where c.id = $1`,
      [comparantId],
    )
    const comparant = comparantRows[0]
    if (!comparant) throw new Error('Comparant introuvable.')
    if (comparant.dossier_id !== existing.dossier_id) throw new Error("Ce comparant n'appartient pas à ce dossier.")
    if (comparant.type !== 'physique' || comparant.date_deces) {
      throw new Error('Seule une personne physique vivante peut être ajoutée comme signataire.')
    }

    const signataires = await this.loadSignataires(signatureRequestId)
    if (signataires.some((s) => s.comparant_id === comparantId)) {
      throw new Error('Ce comparant est déjà signataire de cette demande.')
    }
    const maxPartieOrdre = signataires
      .filter((s) => s.role === 'partie')
      .reduce((max, s) => Math.max(max, s.ordre), -1)

    await this.pool.query(
      `insert into signature_signataires (tenant_id, dossier_id, signature_request_id, role, comparant_id, ordre)
       values ($1, $2, $3, 'partie', $4, $5)`,
      [tenantId, existing.dossier_id, signatureRequestId, comparantId, maxPartieOrdre + 1],
    )

    await this.repinNotaireOrdre(signatureRequestId)

    const request = await this.loadRequest(tenantId, signatureRequestId)
    return mapRequest(request, await this.loadSignataires(signatureRequestId))
  }

  async removeSignataire(tenantId: string, signatureRequestId: string, signataireId: string): Promise<SignatureRequest> {
    await this.loadRequest(tenantId, signatureRequestId)

    const signataires = await this.loadSignataires(signatureRequestId)
    const target = signataires.find((s) => s.id === signataireId)
    if (!target) throw new Error('Signataire introuvable.')
    if (target.role !== 'partie') throw new Error('Le notaire ne peut pas être retiré des signataires.')
    if (target.statut !== 'en_attente') throw new Error('Ce signataire a déjà signé et ne peut plus être retiré.')

    await this.pool.query('delete from signature_signataires where id = $1', [signataireId])

    const request = await this.loadRequest(tenantId, signatureRequestId)
    return mapRequest(request, await this.loadSignataires(signatureRequestId))
  }

  async reorderSignataires(
    tenantId: string,
    signatureRequestId: string,
    ordre: { signataireId: string; ordre: number }[],
  ): Promise<SignatureRequest> {
    await this.loadRequest(tenantId, signatureRequestId)

    const signataires = await this.loadSignataires(signatureRequestId)
    const byId = new Map(signataires.map((s) => [s.id, s]))

    for (const { signataireId, ordre: newOrdre } of ordre) {
      const signataire = byId.get(signataireId)
      if (!signataire) throw new Error('Signataire introuvable.')
      if (signataire.role !== 'partie') continue // notaire ordre is server-controlled, never client-submitted
      if (signataire.statut !== 'en_attente') throw new Error('Un signataire ayant déjà signé ne peut plus être réordonné.')
      await this.pool.query('update signature_signataires set ordre = $2 where id = $1', [signataireId, newOrdre])
    }

    await this.repinNotaireOrdre(signatureRequestId)

    const request = await this.loadRequest(tenantId, signatureRequestId)
    return mapRequest(request, await this.loadSignataires(signatureRequestId))
  }

  async getStatus(tenantId: string, signatureRequestId: string): Promise<SignatureRequest> {
    const request = await this.loadRequest(tenantId, signatureRequestId)
    return mapRequest(request, await this.loadSignataires(signatureRequestId))
  }

  async retrieveSignedDocument(tenantId: string, signatureRequestId: string): Promise<SignedDocument> {
    const request = await this.loadRequest(tenantId, signatureRequestId)
    if (request.statut !== 'signee' || !request.document_signe_storage_path || !request.accuse_reception_storage_path) {
      throw new Error("La signature n'est pas encore terminée.")
    }
    return {
      documentSigneStoragePath: request.document_signe_storage_path,
      accuseReceptionStoragePath: request.accuse_reception_storage_path,
    }
  }

  /**
   * Mock-only, not part of SignatureProvider: with no real network to wait
   * on, this stands in for the callback/webhook a real provider would use to
   * report completion. Advances exactly one signataire (the next one in
   * `ordre` still 'en_attente') per call — this mirrors the real signing
   * event, where parties sign one at a time, notaire last — and only
   * finalizes the request/acte once every signataire has signed.
   */
  async simulateCompletion(tenantId: string, signatureRequestId: string): Promise<SignatureRequest> {
    const existing = await this.loadRequest(tenantId, signatureRequestId)
    if (existing.statut !== 'en_cours') throw new Error("Cette demande n'est pas en cours de signature.")

    const signataires = (await this.loadSignataires(signatureRequestId)).sort((a, b) => a.ordre - b.ordre)
    const next = signataires.find((s) => s.statut === 'en_attente')
    if (!next) throw new Error('Tous les signataires ont déjà signé.')

    const now = new Date().toISOString()
    await this.pool.query("update signature_signataires set statut = 'signe', signed_at = $2 where id = $1", [next.id, now])

    const remaining = signataires.filter((s) => s.id !== next.id && s.statut === 'en_attente')
    if (remaining.length > 0) {
      return mapRequest(existing, await this.loadSignataires(signatureRequestId))
    }

    const { rows: originalRows } = await this.pool.query<{ storage_path: string }>(
      'select storage_path from documents where acte_id = $1 order by created_at desc limit 1',
      [existing.acte_id],
    )
    const original = originalRows[0]
    if (!original) throw new Error("Aucun document généré pour cet acte : impossible de finaliser la signature.")

    const documentSignePath = `${tenantId}/dossiers/${existing.dossier_id}/signatures/${signatureRequestId}-signe.docx`
    // original.storage_path already carries its own tenant prefix (baked in
    // when it was first stored), so this copy bypasses tenantKey and reads
    // the object's exact path directly, same as the destination here.
    const originalObject = await this.bucket.get(original.storage_path)
    if (!originalObject) throw new Error('Erreur lors de la copie du document signé : document original introuvable.')
    await this.bucket.put(documentSignePath, await originalObject.arrayBuffer(), {
      httpMetadata: originalObject.httpMetadata?.contentType ? { contentType: originalObject.httpMetadata.contentType } : undefined,
    })

    const accuseReceptionPath = `${tenantId}/dossiers/${existing.dossier_id}/signatures/${signatureRequestId}-accuse-reception.txt`
    const accuseReceptionContent = [
      'Accusé de réception — signature électronique (mock)',
      `Demande : ${signatureRequestId}`,
      `Référence externe : ${existing.external_reference}`,
      `Acte : ${existing.acte_id}`,
      `Signataires (${signataires.length}) : ${signataires.map((s) => s.role === 'notaire' ? `notaire ${s.utilisateur_id}` : `partie ${s.comparant_id}`).join(', ')}`,
      `Horodatage : ${new Date().toISOString()}`,
    ].join('\n')
    await this.bucket.put(accuseReceptionPath, new TextEncoder().encode(accuseReceptionContent), {
      httpMetadata: { contentType: 'text/plain' },
    })

    const { rows: finalRows } = await this.pool.query<SignatureRequestRow>(
      `update signature_requests set statut = 'signee', document_signe_storage_path = $2, accuse_reception_storage_path = $3
       where id = $1 returning *`,
      [signatureRequestId, documentSignePath, accuseReceptionPath],
    )
    const request = finalRows[0]
    if (!request) throw new Error('Erreur lors de la finalisation de la signature : update failed')

    await this.pool.query("update actes set statut = 'signe' where id = $1", [existing.acte_id])

    return mapRequest(request, await this.loadSignataires(signatureRequestId))
  }
}
