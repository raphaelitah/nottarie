import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../design-system'
import type { Acte, Comparant, Dossier, SignatureRequestRow, SignatureSignataireRow } from '../../types/database'
import { ActeComposerPage } from './ActeComposerPage'

interface ActeRelecturePageProps {
  dossier: Dossier
  acte: Acte
  onBack: () => void
}

function signataireLabel(signataire: SignatureSignataireRow, comparants: Comparant[]) {
  if (signataire.role === 'notaire') return 'Notaire'
  const comparant = comparants.find((c) => c.id === signataire.comparant_id)
  const personne = comparant?.personne
  return [personne?.prenom, personne?.nom].filter(Boolean).join(' ') || 'Partie'
}

export function ActeRelecturePage({ dossier, acte, onBack }: ActeRelecturePageProps) {
  const [request, setRequest] = useState<SignatureRequestRow | null>(null)
  const [comparants, setComparants] = useState<Comparant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const [busy, setBusy] = useState(false)
  const [addingComparantId, setAddingComparantId] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const [{ data: requests, error: requestsError }, { data: comparantRows, error: comparantsError }] = await Promise.all([
      supabase
        .from('signature_requests')
        .select('*, signature_signataires(*)')
        .eq('acte_id', acte.id)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase.from('comparants').select('*, personne:personnes(*)').eq('dossier_id', dossier.id).returns<Comparant[]>(),
    ])
    if (requestsError || comparantsError) {
      setError('Impossible de charger la demande de signature : ' + (requestsError?.message || comparantsError?.message))
      setLoading(false)
      return
    }
    setRequest((requests as SignatureRequestRow[] | null)?.[0] ?? null)
    setComparants(comparantRows ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acte.id])

  const signataires = [...(request?.signature_signataires ?? [])].sort((a, b) => a.ordre - b.ordre)
  const partieSignataires = signataires.filter((s) => s.role === 'partie')
  const notaireSignataire = signataires.find((s) => s.role === 'notaire')
  const signedCount = signataires.filter((s) => s.statut === 'signe').length
  const nextToSign = signataires.find((s) => s.statut === 'en_attente')
  const eligibleComparants = comparants.filter(
    (c) => c.personne?.type === 'physique' && !c.personne?.date_deces && !signataires.some((s) => s.comparant_id === c.id),
  )

  async function callAction(body: Record<string, unknown>) {
    setBusy(true)
    setError(null)
    const { error: invokeError } = await supabase.functions.invoke('acte-signature', { body })
    setBusy(false)
    if (invokeError) { setError(invokeError.message); return false }
    await load()
    return true
  }

  async function handleAddSignataire() {
    if (!request || !addingComparantId) return
    await callAction({ action: 'add_signataire', signature_request_id: request.id, comparant_id: addingComparantId })
    setAddingComparantId('')
  }

  async function handleRemoveSignataire(signataireId: string) {
    if (!request) return
    await callAction({ action: 'remove_signataire', signature_request_id: request.id, signataire_id: signataireId })
  }

  async function handleReorder(newOrder: SignatureSignataireRow[]) {
    if (!request) return
    const ordre = newOrder.map((s, index) => ({ signataireId: s.id, ordre: index }))
    await callAction({ action: 'reorder', signature_request_id: request.id, ordre })
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); return }
    const current = [...partieSignataires]
    const fromIndex = current.findIndex((s) => s.id === draggingId)
    const toIndex = current.findIndex((s) => s.id === targetId)
    if (fromIndex === -1 || toIndex === -1) { setDraggingId(null); return }
    const [moved] = current.splice(fromIndex, 1)
    current.splice(toIndex, 0, moved)
    setDraggingId(null)
    handleReorder(current)
  }

  async function handleSimulateNext() {
    if (!request) return
    await callAction({ action: 'simulate', signature_request_id: request.id })
  }

  function handleGenerated() {
    setEditing(false)
  }

  if (loading) {
    return <p style={hint}>Chargement de la relecture…</p>
  }

  if (!request) {
    return (
      <div>
        <button onClick={onBack} style={backBtn}>‹ Retour</button>
        <p style={hint}>Aucune demande de signature en cours pour cet acte.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {error && <div style={alertStyle}>{error}</div>}

      <div style={{ display: 'flex', gap: 'var(--space-6)', flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {editing && (
            <button style={backBtn} onClick={() => setEditing(false)}>‹ Retour à la relecture</button>
          )}
          <ActeComposerPage
            dossier={dossier}
            acte={acte}
            onBack={onBack}
            onGenerated={handleGenerated}
            editable={editing}
            sectionsLayout="drawer"
            onScrolledToBottomChange={editing ? undefined : setScrolledToBottom}
          />
          {!editing && (
            <div style={{ padding: 'var(--space-3) 0' }}>
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Modifier</Button>
            </div>
          )}
        </div>

        <div style={panel}>
          <div style={panelTitle}>Signataires ({signedCount}/{signataires.length} signés)</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--space-4)' }}>
            {partieSignataires.map((s) => (
              <div
                key={s.id}
                style={signataireRow(s.id === nextToSign?.id, s.statut === 'signe')}
                draggable={s.statut === 'en_attente'}
                onDragStart={() => setDraggingId(s.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(s.id)}
              >
                <span>{s.statut === 'en_attente' ? '⠿ ' : ''}{signataireLabel(s, comparants)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={statutLabel}>{s.statut === 'signe' ? 'Signé' : s.statut === 'refuse' ? 'Refusé' : 'En attente'}</span>
                  {s.statut === 'en_attente' && (
                    <button style={removeBtn} onClick={() => handleRemoveSignataire(s.id)} title="Retirer">✕</button>
                  )}
                </span>
              </div>
            ))}
            {notaireSignataire && (
              <div style={signataireRow(notaireSignataire.id === nextToSign?.id, notaireSignataire.statut === 'signe')}>
                <span>{signataireLabel(notaireSignataire, comparants)}</span>
                <span style={statutLabel}>{notaireSignataire.statut === 'signe' ? 'Signé' : 'En attente'}</span>
              </div>
            )}
          </div>

          {eligibleComparants.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: 'var(--space-4)' }}>
              <select style={select} value={addingComparantId} onChange={(e) => setAddingComparantId(e.target.value)}>
                <option value="">Ajouter un signataire…</option>
                {eligibleComparants.map((c) => (
                  <option key={c.id} value={c.id}>{[c.personne?.prenom, c.personne?.nom].filter(Boolean).join(' ')}</option>
                ))}
              </select>
              <Button variant="secondary" size="sm" disabled={!addingComparantId || busy} onClick={handleAddSignataire}>Ajouter</Button>
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            disabled={busy || !scrolledToBottom || editing || !nextToSign}
            onClick={handleSimulateNext}
          >
            {busy ? '…' : nextToSign ? 'Simuler signature suivante (mock)' : 'Tous les signataires ont signé'}
          </Button>
          {!scrolledToBottom && !editing && (
            <p style={sidebarHint}>Faites défiler le document jusqu'en bas pour activer la signature.</p>
          )}
        </div>
      </div>
    </div>
  )
}

const backBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  marginBottom: 'var(--space-3)',
  textAlign: 'left',
}

const hint: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

const sidebarHint: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginTop: 'var(--space-2)',
  lineHeight: 'var(--leading-snug)',
}

const alertStyle: CSSProperties = {
  background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
}

const panel: CSSProperties = {
  width: '280px',
  flexShrink: 0,
  position: 'sticky',
  top: 0,
}

const panelTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-3)',
}

function signataireRow(isNext: boolean, signed: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    color: signed ? 'var(--text-muted)' : 'var(--color-ink)',
    background: isNext ? 'var(--n-100, #f3f4f6)' : 'var(--surface-base)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
  }
}

const statutLabel: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
}

const removeBtn: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  fontSize: 'var(--text-xs)',
  padding: 0,
}

const select: CSSProperties = {
  flex: 1,
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--n-900)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  padding: '6px 8px',
}
