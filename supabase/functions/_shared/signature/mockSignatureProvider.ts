import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import type { SignatureProvider } from './signatureProvider.ts'
import type { Signataire, SignatureRequest, SignedDocument } from './types.ts'

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
    signataires: signataires.map((s) => ({
      id: s.id,
      role: s.role,
      comparantId: s.comparant_id,
      utilisateurId: s.utilisateur_id,
      statut: s.statut,
      signedAt: s.signed_at,
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
  constructor(private readonly admin: SupabaseClient) {}

  private async loadRequest(tenantId: string, signatureRequestId: string): Promise<SignatureRequestRow> {
    const { data, error } = await this.admin
      .from('signature_requests')
      .select('*')
      .eq('id', signatureRequestId)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if (error || !data) throw new Error('Demande de signature introuvable.')
    return data
  }

  private async loadSignataires(signatureRequestId: string): Promise<SignataireRow[]> {
    const { data, error } = await this.admin
      .from('signature_signataires')
      .select('*')
      .eq('signature_request_id', signatureRequestId)
    if (error) throw new Error('Erreur lors du chargement des signataires : ' + error.message)
    return data ?? []
  }

  async designateSigners(tenantId: string, acteId: string): Promise<SignatureRequest> {
    const { data: acte, error: acteError } = await this.admin
      .from('actes')
      .select('id, tenant_id, dossier_id')
      .eq('id', acteId)
      .eq('tenant_id', tenantId)
      .maybeSingle()
    if (acteError || !acte) throw new Error('Acte introuvable.')

    const { data: active } = await this.admin
      .from('signature_requests')
      .select('id')
      .eq('acte_id', acteId)
      .in('statut', ['brouillon', 'en_cours'])
      .maybeSingle()
    if (active) throw new Error('Une demande de signature est déjà en cours pour cet acte.')

    const { data: dossier, error: dossierError } = await this.admin
      .from('dossiers')
      .select('id, notaire_id')
      .eq('id', acte.dossier_id)
      .maybeSingle()
    if (dossierError || !dossier) throw new Error('Dossier introuvable.')

    // Every living party must sign; a deceased comparant can't.
    const { data: comparants, error: comparantsError } = await this.admin
      .from('comparants')
      .select('id, personne:personnes(date_deces)')
      .eq('dossier_id', acte.dossier_id)
    if (comparantsError) throw new Error('Erreur lors du chargement des comparants : ' + comparantsError.message)
    const livingComparantIds = (comparants ?? [])
      .filter((c: { personne: { date_deces: string | null } | null }) => !c.personne?.date_deces)
      .map((c: { id: string }) => c.id)
    if (livingComparantIds.length === 0) throw new Error('Aucune partie vivante à faire signer sur ce dossier.')

    const { data: request, error: requestError } = await this.admin
      .from('signature_requests')
      .insert({ tenant_id: tenantId, dossier_id: acte.dossier_id, acte_id: acteId, provider: 'mock' })
      .select()
      .single()
    if (requestError || !request) throw new Error('Erreur lors de la création de la demande de signature : ' + requestError?.message)

    const signataireRows = [
      ...livingComparantIds.map((comparantId: string) => ({
        tenant_id: tenantId,
        dossier_id: acte.dossier_id,
        signature_request_id: request.id,
        role: 'partie',
        comparant_id: comparantId,
      })),
      {
        tenant_id: tenantId,
        dossier_id: acte.dossier_id,
        signature_request_id: request.id,
        role: 'notaire',
        utilisateur_id: dossier.notaire_id,
      },
    ]
    const { error: signataireError } = await this.admin.from('signature_signataires').insert(signataireRows)
    if (signataireError) throw new Error("Erreur lors de l'enregistrement des signataires : " + signataireError.message)

    return mapRequest(request, await this.loadSignataires(request.id))
  }

  async requestSignature(tenantId: string, signatureRequestId: string): Promise<SignatureRequest> {
    const existing = await this.loadRequest(tenantId, signatureRequestId)
    if (existing.statut !== 'brouillon') throw new Error('Cette demande de signature a déjà été envoyée.')

    const { data: request, error } = await this.admin
      .from('signature_requests')
      .update({ statut: 'en_cours', external_reference: `mock-${crypto.randomUUID()}` })
      .eq('id', signatureRequestId)
      .select()
      .single()
    if (error || !request) throw new Error("Erreur lors de l'envoi en signature : " + error?.message)

    // The acte itself is now awaiting signature — see ActesSection's statut badge.
    await this.admin.from('actes').update({ statut: 'a_signer' }).eq('id', existing.acte_id)

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
   * report completion, so the rest of the flow (retrieval, acte statut) can
   * be exercised end to end.
   */
  async simulateCompletion(tenantId: string, signatureRequestId: string): Promise<SignatureRequest> {
    const existing = await this.loadRequest(tenantId, signatureRequestId)
    if (existing.statut !== 'en_cours') throw new Error("Cette demande n'est pas en cours de signature.")

    const signataires = await this.loadSignataires(signatureRequestId)

    const { data: original } = await this.admin
      .from('documents')
      .select('storage_path')
      .eq('acte_id', existing.acte_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!original) throw new Error("Aucun document généré pour cet acte : impossible de simuler la signature.")

    const documentSignePath = `${tenantId}/dossiers/${existing.dossier_id}/signatures/${signatureRequestId}-signe.docx`
    const { error: copyError } = await this.admin.storage.from('documents').copy(original.storage_path, documentSignePath)
    if (copyError) throw new Error('Erreur lors de la copie du document signé : ' + copyError.message)

    const accuseReceptionPath = `${tenantId}/dossiers/${existing.dossier_id}/signatures/${signatureRequestId}-accuse-reception.txt`
    const accuseReceptionContent = [
      'Accusé de réception — signature électronique (mock)',
      `Demande : ${signatureRequestId}`,
      `Référence externe : ${existing.external_reference}`,
      `Acte : ${existing.acte_id}`,
      `Signataires (${signataires.length}) : ${signataires.map((s) => s.role === 'notaire' ? `notaire ${s.utilisateur_id}` : `partie ${s.comparant_id}`).join(', ')}`,
      `Horodatage : ${new Date().toISOString()}`,
    ].join('\n')
    const { error: uploadError } = await this.admin.storage
      .from('documents')
      .upload(accuseReceptionPath, new Blob([accuseReceptionContent], { type: 'text/plain' }), { contentType: 'text/plain' })
    if (uploadError) throw new Error("Erreur lors de la génération de l'accusé de réception : " + uploadError.message)

    const now = new Date().toISOString()
    const { error: signataireError } = await this.admin
      .from('signature_signataires')
      .update({ statut: 'signe', signed_at: now })
      .eq('signature_request_id', signatureRequestId)
    if (signataireError) throw new Error('Erreur lors de la mise à jour des signataires : ' + signataireError.message)

    const { data: request, error: requestError } = await this.admin
      .from('signature_requests')
      .update({
        statut: 'signee',
        document_signe_storage_path: documentSignePath,
        accuse_reception_storage_path: accuseReceptionPath,
      })
      .eq('id', signatureRequestId)
      .select()
      .single()
    if (requestError || !request) throw new Error('Erreur lors de la finalisation de la signature : ' + requestError?.message)

    await this.admin.from('actes').update({ statut: 'signe' }).eq('id', existing.acte_id)

    return mapRequest(request, await this.loadSignataires(signatureRequestId))
  }
}
