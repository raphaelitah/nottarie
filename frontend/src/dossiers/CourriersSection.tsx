import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { Badge, Button, eyeIcon, HoverIconButton, retryIcon, SectionAddButton, trashIcon } from '../design-system'
import { Modal } from '../design-system/Modal'
import type { Courrier, CourrierDocument, Email } from '../types/database'
import { CourrierFormDrawer } from './CourrierFormDrawer'
import { useCourrierComposer } from './useCourrierComposer'

interface CourriersSectionProps {
  tenantId: string
  dossierId: string
}

export function CourriersSection({ tenantId, dossierId }: CourriersSectionProps) {
  const [courriers, setCourriers] = useState<Courrier[]>([])
  const [sentAt, setSentAt] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Courrier | null>(null)
  const [viewingEmail, setViewingEmail] = useState<Email | null>(null)
  const [viewingAttachments, setViewingAttachments] = useState<CourrierDocument[]>([])
  const [retryError, setRetryError] = useState<string | null>(null)
  const [retryNoMailbox, setRetryNoMailbox] = useState(false)

  const composer = useCourrierComposer(tenantId, dossierId, loadCourriers)

  async function loadCourriers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('courriers')
      .select('*')
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les courriers : ' + error.message)
    else setError(null)
    setCourriers(data ?? [])
    setLoading(false)

    const { data: emails } = await supabase
      .from('emails')
      .select('courrier_id, created_at')
      .eq('dossier_id', dossierId)
      .not('courrier_id', 'is', null)
    const map: Record<string, string> = {}
    for (const e of emails ?? []) if (e.courrier_id) map[e.courrier_id] = e.created_at
    setSentAt(map)
  }

  useEffect(() => {
    loadCourriers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId])

  useEffect(() => {
    if (!viewing) { setViewingEmail(null); setViewingAttachments([]); return }
    supabase
      .from('emails')
      .select('*, utilisateur:utilisateurs(nom, prenom)')
      .eq('courrier_id', viewing.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setViewingEmail(data ?? null))
    supabase
      .from('courrier_documents')
      .select('*, document:documents(*)')
      .eq('courrier_id', viewing.id)
      .then(({ data }) => setViewingAttachments(data ?? []))
  }, [viewing])

  async function handleRetry(courrier: Courrier) {
    const to = courrier.destinataires.length > 0 ? courrier.destinataires : courrier.destinataire ? [courrier.destinataire] : []
    if (to.length === 0) {
      setRetryError("Impossible de réessayer l'envoi : aucun destinataire enregistré pour ce courrier.")
      return
    }
    setRetryingId(courrier.id)
    setRetryError(null)
    setRetryNoMailbox(false)
    const { data: attachments } = await supabase.from('courrier_documents').select('document_id').eq('courrier_id', courrier.id)
    const { error: sendError } = await supabase.functions.invoke('send-email', {
      body: {
        dossier_id: dossierId,
        courrier_id: courrier.id,
        to,
        subject: courrier.objet ?? '',
        body_html: (courrier.contenu || '').replace(/\n/g, '<br>'),
        document_ids: (attachments ?? []).map((a) => a.document_id),
      },
    })
    if (sendError) {
      if (sendError instanceof FunctionsHttpError && (await sendError.context.json().catch(() => null))?.error === 'no_mailbox_connected') {
        setRetryNoMailbox(true)
      } else {
        setRetryError("Le renvoi du courrier a échoué : " + sendError.message)
      }
      await supabase.from('courriers').update({
        dernier_envoi_echec_at: new Date().toISOString(),
        dernier_envoi_erreur: sendError.message,
      }).eq('id', courrier.id)
    } else {
      await supabase.from('courriers').update({
        dernier_envoi_echec_at: null,
        dernier_envoi_erreur: null,
      }).eq('id', courrier.id)
    }
    setRetryingId(null)
    loadCourriers()
  }

  async function handleRemove(courrier: Courrier) {
    setRemovingId(courrier.id)
    const { error } = await supabase.from('courriers').delete().eq('id', courrier.id)
    setRemovingId(null)
    if (error) { setError('Erreur lors de la suppression : ' + error.message); return }
    loadCourriers()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Courriers</h3>
        <SectionAddButton label="Nouveau courrier" onClick={() => composer.openComposer()} />
      </div>

      {(error || retryError || composer.error) && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error || retryError || composer.error}</div>
      )}

      {(retryNoMailbox || composer.noMailboxConnected) && (
        <div style={{
          background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#713F12',
        }}>
          <span>Le courrier a été enregistré, mais aucune messagerie Outlook n'est connectée pour l'envoyer. Rendez-vous dans « Mon compte » (menu en haut à droite) pour la connecter.</span>
        </div>
      )}

      {loading ? (
        <div style={emptyCard}>Chargement…</div>
      ) : courriers.length === 0 ? (
        <div style={emptyCard}>Aucun courrier pour ce dossier.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {courriers.map((c) => (
            <div key={c.id} style={{ ...row, cursor: 'pointer' }} onClick={() => setViewing(c)}>
              <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={name}>{c.objet || 'Sans objet'}</span>
                <span style={meta}>{formatDateTime(sentAt[c.id] ?? c.dernier_envoi_echec_at ?? c.created_at)}</span>
                {sentAt[c.id] ? (
                  <Badge status="signed" label="Envoyé" size="sm" />
                ) : c.dernier_envoi_echec_at ? (
                  <span title={c.dernier_envoi_erreur ?? undefined}>
                    <Badge status="refused" label="Échec" size="sm" />
                  </span>
                ) : null}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {c.dernier_envoi_echec_at && !sentAt[c.id] && (
                  <HoverIconButton icon={retryIcon} label="Réessayer l'envoi" disabled={retryingId === c.id} onClick={() => handleRetry(c)} />
                )}
                <HoverIconButton icon={eyeIcon} label="Voir" onClick={() => setViewing(c)} />
                <HoverIconButton icon={trashIcon} label="Supprimer" danger disabled={removingId === c.id} onClick={() => handleRemove(c)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <CourrierFormDrawer
        open={composer.drawerOpen}
        saving={composer.saving}
        tenantId={tenantId}
        dossierId={dossierId}
        fromEmail={composer.fromEmail}
        initialDestinataireIds={composer.initialDestinataireIds}
        initialDocumentIds={composer.initialDocumentIds}
        initialObjet={composer.initialObjet}
        onSave={composer.handleAdd}
        onClose={composer.closeComposer}
      />

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.objet || 'Courrier'}
        subtitle={viewing ? formatDateTime(viewingEmail?.created_at ?? viewing.created_at) : undefined}
        size="lg"
        footer={<Button variant="secondary" size="sm" onClick={() => setViewing(null)}>Fermer</Button>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {viewingEmail && (
            <div style={detailBlock}>
              <div style={detailLine}>
                <span style={detailLabel}>Envoyé par</span>
                <span>{viewingEmail.utilisateur ? `${viewingEmail.utilisateur.prenom ?? ''} ${viewingEmail.utilisateur.nom ?? ''}`.trim() : 'Utilisateur inconnu'}</span>
              </div>
              <div style={detailLine}>
                <span style={detailLabel}>Destinataire{viewingEmail.destinataires.length > 1 ? 's' : ''}</span>
                <span>{viewingEmail.destinataires.join(', ') || '—'}</span>
              </div>
              {viewingEmail.cc.length > 0 && (
                <div style={detailLine}>
                  <span style={detailLabel}>Copie (CC)</span>
                  <span>{viewingEmail.cc.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          <div style={{ whiteSpace: 'pre-wrap' }}>{viewing?.contenu || 'Aucun contenu.'}</div>

          {viewingAttachments.length > 0 && (
            <div>
              <div style={detailLabel}>Pièce{viewingAttachments.length > 1 ? 's' : ''} jointe{viewingAttachments.length > 1 ? 's' : ''}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                {viewingAttachments.map((a) => (
                  <span key={a.id} style={meta}>{a.document?.nom ?? 'Document'}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
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
  minHeight: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-3) var(--space-6)',
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
  minHeight: '60px',
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
  flexShrink: 0,
}

const detailBlock: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: 'var(--space-3)',
  background: 'var(--surface-subtle, #F8FAFC)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
}

const detailLine: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
}

const detailLabel: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  minWidth: '110px',
  flexShrink: 0,
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

