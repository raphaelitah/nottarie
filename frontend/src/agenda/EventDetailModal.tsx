import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Modal, Button } from '../design-system'
import type { Evenement, EvenementParticipantStatut, Utilisateur } from '../types/database'
import { utilisateurLabel } from '../utilisateurs/utilisateurLabel'
import { resolveEventColor } from './agendaColors'
import { RecurrenceScopeModal, type RecurrenceScope } from './RecurrenceScopeModal'
import { parseRRuleString, recurrenceSummary } from './eventRecurrence'

const DISPONIBILITE_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  occupe: 'Occupé',
  indisponible: 'Indisponible',
}

const STATUT_LABELS: Record<EvenementParticipantStatut, string> = {
  en_attente: 'En attente',
  accepte: 'Accepté',
  decline: 'Décliné',
}

interface EventDetailModalProps {
  open: boolean
  event: Evenement | null
  occurrenceStart: string | null
  currentUtilisateur: Utilisateur | null
  canManage: boolean
  saving: boolean
  error: string | null
  onEdit: () => void
  onDelete: (scope: RecurrenceScope | null) => void
  onRsvp: (statut: EvenementParticipantStatut) => void
  onSelectDossier?: (dossierId: string) => void
  onClose: () => void
}

export function EventDetailModal({
  open, event, occurrenceStart, currentUtilisateur, canManage, saving, error,
  onEdit, onDelete, onRsvp, onSelectDossier, onClose,
}: EventDetailModalProps) {
  const [scopeModalOpen, setScopeModalOpen] = useState(false)

  if (!event) return null

  const start = occurrenceStart ?? event.debut
  const formattedRange = formatRange(start, event.fin, event.all_day)
  const myParticipant = currentUtilisateur
    ? (event.participants ?? []).find((p) => p.utilisateur_id === currentUtilisateur.id)
    : null

  function handleDeleteClick() {
    if (event!.rrule) { setScopeModalOpen(true); return }
    onDelete(null)
  }

  function handleScopeChoice(scope: RecurrenceScope) {
    setScopeModalOpen(false)
    onDelete(scope)
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={event.titre}
        subtitle={formattedRange}
        size="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>Fermer</Button>
            {canManage && (
              <>
                <Button variant="secondary" size="sm" onClick={onEdit}>Modifier</Button>
                <Button variant="destructive" size="sm" disabled={saving} onClick={handleDeleteClick}>
                  {saving ? '…' : 'Supprimer'}
                </Button>
              </>
            )}
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
              padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#DC2626',
            }}>{error}</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: resolveEventColor(event), flexShrink: 0 }} />
            {event.est_prive && <span style={metaText}>🔒 Privé</span>}
            {event.categorie && <span style={metaText}>· {event.categorie.nom}</span>}
            <span style={metaText}>· {DISPONIBILITE_LABELS[event.disponibilite]}</span>
            {event.rrule && <span style={metaText}>· {recurrenceSummary(parseRRuleString(event.rrule))}</span>}
          </div>
          {event.lieu && (
            <div style={fieldRow}>
              <span style={fieldLabel}>Lieu</span>
              <span>{event.lieu}</span>
            </div>
          )}

          {event.description && (
            <div style={fieldRow}>
              <span style={fieldLabel}>Description</span>
              <span style={{ whiteSpace: 'pre-wrap' }}>{event.description}</span>
            </div>
          )}

          <div style={fieldRow}>
            <span style={fieldLabel}>Organisateur</span>
            <span>{utilisateurLabel(event.organisateur)}</span>
          </div>

          {(event.participants ?? []).length > 0 && (
            <div style={fieldRow}>
              <span style={fieldLabel}>Participants</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(event.participants ?? []).map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span>{utilisateurLabel(p.utilisateur)}{p.is_organisateur ? ' (organisateur)' : ''}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{STATUT_LABELS[p.statut]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(event.dossiers ?? []).length > 0 && (
            <div style={fieldRow}>
              <span style={fieldLabel}>Dossiers liés</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {(event.dossiers ?? []).map((d) => (
                  <button key={d.id} type="button" onClick={() => onSelectDossier?.(d.dossier_id)} style={linkBtn}>
                    {d.dossier?.numero ?? d.dossier?.type_acte ?? 'Dossier'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {myParticipant && myParticipant.statut === 'en_attente' && !myParticipant.is_organisateur && (
            <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
              <Button variant="primary" size="sm" disabled={saving} onClick={() => onRsvp('accepte')}>Accepter</Button>
              <Button variant="secondary" size="sm" disabled={saving} onClick={() => onRsvp('decline')}>Décliner</Button>
            </div>
          )}
        </div>
      </Modal>

      <RecurrenceScopeModal
        open={scopeModalOpen}
        action="delete"
        onChoose={handleScopeChoice}
        onClose={() => setScopeModalOpen(false)}
      />
    </>
  )
}

function formatRange(startIso: string, endIso: string | null, allDay: boolean): string {
  const start = new Date(startIso)
  const startStr = allDay
    ? start.toLocaleDateString('fr-FR')
    : start.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
  if (!endIso) return startStr
  const end = new Date(endIso)
  const endStr = allDay
    ? end.toLocaleDateString('fr-FR')
    : end.toLocaleTimeString('fr-FR', { timeStyle: 'short' })
  return `${startStr} – ${endStr}`
}

const metaText: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
}

const fieldRow: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '4px',
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--n-900)',
}

const fieldLabel: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 600,
  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em',
}

const linkBtn: CSSProperties = {
  textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--color-accent)',
}
