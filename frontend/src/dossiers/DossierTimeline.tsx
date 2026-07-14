import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'

interface DossierTimelineProps {
  dossierId: string
  statut: string
  comparantsCount: number
}

interface TimelineState {
  hasActe: boolean
  hasSignatureEnCours: boolean
  hasActeSigne: boolean
  hasFormaliteEnCours: boolean
}

const PENDING_FORMALITE_STATUTS = ['a_envoyer', 'envoyee', 'relancee']

interface Stage {
  key: string
  label: string
  done: boolean
}

export function DossierTimeline({ dossierId, statut, comparantsCount }: DossierTimelineProps) {
  const [state, setState] = useState<TimelineState | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      supabase.from('actes').select('id, statut').eq('dossier_id', dossierId),
      supabase.from('signature_requests').select('id, statut').eq('dossier_id', dossierId),
      supabase.from('formalites').select('id, statut').eq('dossier_id', dossierId),
    ]).then(([actesRes, signaturesRes, formalitesRes]) => {
      if (cancelled) return
      const actes = actesRes.data ?? []
      const signatures = signaturesRes.data ?? []
      const formalites = formalitesRes.data ?? []
      setState({
        hasActe: actes.length > 0,
        hasSignatureEnCours: signatures.some((s) => s.statut === 'en_cours'),
        hasActeSigne: actes.some((a) => a.statut === 'signe'),
        hasFormaliteEnCours: formalites.some((f) => PENDING_FORMALITE_STATUTS.includes(f.statut)),
      })
    })
    return () => { cancelled = true }
  }, [dossierId])

  if (!state) return null

  const cloture = statut === 'cloture'
  const stages: Stage[] = [
    { key: 'ouvert', label: 'Ouvert', done: true },
    { key: 'comparants', label: 'Comparants réunis', done: comparantsCount > 0 },
    { key: 'acte', label: 'Acte généré', done: state.hasActe },
    { key: 'signature', label: 'Signature en cours', done: state.hasSignatureEnCours || state.hasActeSigne },
    { key: 'signe', label: 'Signé / AAE produit', done: state.hasActeSigne },
    { key: 'formalites', label: 'Formalités en cours', done: state.hasFormaliteEnCours },
    { key: 'cloture', label: 'Clôturé', done: cloture },
  ]

  return (
    <div style={{ overflowX: 'auto', padding: 'var(--space-2) 0' }}>
      <div style={trackRow(stages.length)}>
        {stages.map((stage, i) => (
          <div key={stage.key} style={{ display: 'contents' }}>
            <div style={dot(stage.done)} />
            {i < stages.length - 1 && <div style={connector(stage.done && stages[i + 1].done)} />}
          </div>
        ))}
      </div>
      <div style={labelRow(stages.length)}>
        {stages.map((stage) => (
          <span key={stage.key} style={label(stage.done)}>{stage.label}</span>
        ))}
      </div>
    </div>
  )
}

function trackRow(stageCount: number): CSSProperties {
  const columns = 2 * stageCount - 1
  const template = Array.from({ length: columns }, (_, i) => (i % 2 === 0 ? '12px' : '1fr')).join(' ')
  return {
    display: 'grid',
    gridTemplateColumns: template,
    alignItems: 'center',
    minWidth: `${stageCount * 90}px`,
  }
}

function labelRow(count: number): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${count}, minmax(80px, 1fr))`,
    marginTop: 'var(--space-2)',
    minWidth: `${count * 80}px`,
  }
}

function dot(done: boolean): CSSProperties {
  return {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: done ? 'var(--color-accent, #2563eb)' : 'var(--n-200)',
    border: done ? 'none' : '1px solid var(--border-default)',
    justifySelf: 'center',
  }
}

function connector(done: boolean): CSSProperties {
  return {
    height: '2px',
    background: done ? 'var(--color-accent, #2563eb)' : 'var(--border-default)',
  }
}

function label(done: boolean): CSSProperties {
  return {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-xs)',
    color: done ? 'var(--n-900)' : 'var(--text-muted)',
    fontWeight: done ? 600 : 400,
    textAlign: 'center',
  }
}
