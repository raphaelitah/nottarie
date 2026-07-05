import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Button } from '../design-system'
import type { Acte, DocumentRow, Dossier, SignatureRequestRow } from '../types/database'
import { acteStatutBadgeStatus, acteStatutLabel } from '../constants/acteStatuts'

function latestSignatureRequest(acte: Acte): SignatureRequestRow | null {
  const requests = acte.signature_requests ?? []
  if (requests.length === 0) return null
  return [...requests].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
}

interface ActesSectionProps {
  dossier: Dossier
  onOpenComposer: () => void
}

export function ActesSection({ dossier, onOpenComposer }: ActesSectionProps) {
  const [actes, setActes] = useState<Acte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [signatureActionId, setSignatureActionId] = useState<string | null>(null)

  async function loadActes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('actes')
      .select('*, documents(*), signature_requests(*)')
      .eq('dossier_id', dossier.id)
      .order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les actes : ' + error.message)
    else setError(null)
    setActes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadActes() }, [dossier.id])

  async function handleDownload(document: DocumentRow) {
    setDownloadingId(document.id)
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(document.storage_path, 60)
    setDownloadingId(null)
    if (error || !data) { setError('Impossible de générer le lien de téléchargement : ' + error?.message); return }
    window.open(data.signedUrl, '_blank')
  }

  async function handleDownloadPath(storagePath: string) {
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(storagePath, 60)
    if (error || !data) { setError('Impossible de générer le lien de téléchargement : ' + error?.message); return }
    window.open(data.signedUrl, '_blank')
  }

  async function handleRequestSignature(acte: Acte) {
    setSignatureActionId(acte.id)
    setError(null)
    const designate = await supabase.functions.invoke('acte-signature', { body: { action: 'designate', acte_id: acte.id } })
    if (designate.error) { setSignatureActionId(null); setError("Erreur lors de la désignation des signataires : " + designate.error.message); return }
    const requestResult = await supabase.functions.invoke('acte-signature', {
      body: { action: 'request', signature_request_id: designate.data.signatureRequest.id },
    })
    setSignatureActionId(null)
    if (requestResult.error) { setError("Erreur lors de la demande de signature : " + requestResult.error.message); return }
    loadActes()
  }

  // Mock-only: stands in for the callback a real signature provider would
  // deliver once every signataire has actually signed.
  async function handleSimulateSignature(signatureRequest: SignatureRequestRow) {
    setSignatureActionId(signatureRequest.acte_id)
    setError(null)
    const { error } = await supabase.functions.invoke('acte-signature', {
      body: { action: 'simulate', signature_request_id: signatureRequest.id },
    })
    setSignatureActionId(null)
    if (error) { setError('Erreur lors de la simulation de la signature : ' + error.message); return }
    loadActes()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Actes</h3>
        <Button variant="primary" size="sm" onClick={onOpenComposer}>+ Générer un acte</Button>
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

      {loading ? (
        <div style={emptyCard}>Chargement…</div>
      ) : actes.length === 0 ? (
        <div style={emptyCard}>Aucun acte généré pour ce dossier.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {actes.map((acte) => {
            const document = acte.documents?.[0]
            const signatureRequest = latestSignatureRequest(acte)
            const busy = signatureActionId === acte.id
            return (
              <div key={acte.id} style={row}>
                <div style={{ minWidth: 0 }}>
                  <span style={name}>{document?.nom ?? 'Acte'}</span>
                  <span style={meta}>{new Date(acte.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                  <Badge status={acteStatutBadgeStatus(acte.statut)} label={acteStatutLabel(acte.statut)} />
                  {acte.statut === 'brouillon' && (
                    <Button variant="secondary" size="sm" disabled={busy} onClick={() => handleRequestSignature(acte)}>
                      {busy ? '…' : 'Demander la signature'}
                    </Button>
                  )}
                  {acte.statut === 'a_signer' && signatureRequest?.provider === 'mock' && signatureRequest.statut === 'en_cours' && (
                    <Button variant="secondary" size="sm" disabled={busy} onClick={() => handleSimulateSignature(signatureRequest)}>
                      {busy ? '…' : 'Simuler la signature (mock)'}
                    </Button>
                  )}
                  {signatureRequest?.accuse_reception_storage_path && (
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadPath(signatureRequest.accuse_reception_storage_path!)}>
                      Accusé de réception
                    </Button>
                  )}
                  {document && (
                    <Button variant="ghost" size="sm" disabled={downloadingId === document.id} onClick={() => handleDownload(document)}>
                      {downloadingId === document.id ? '…' : 'Télécharger'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const h3: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: 'var(--n-900)',
  margin: 0,
}

const emptyCard: CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
  textAlign: 'center',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
}

const name: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const meta: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginLeft: 'var(--space-3)',
}
