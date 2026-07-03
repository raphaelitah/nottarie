import type { CSSProperties } from 'react'
import { ACTE_TYPE_OPTIONS } from '../../constants/acteTypes'

const BRANCHE_LABELS: Record<string, string> = {
  immobilier: 'Immobilier',
  famille: 'Droit de la famille',
  entreprise_societes: 'Entreprise et sociétés',
}

interface TrameTypePickerProps {
  onSelect: (typeActe: string) => void
}

export function TrameTypePicker({ onSelect }: TrameTypePickerProps) {
  return (
    <div>
      <h1 style={h1}>Bibliothèque de Trames</h1>
      <p style={subtitle}>Choisissez un type d'acte pour gérer son modèle standard et ses sections.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
        {ACTE_TYPE_OPTIONS.map((o) => (
          <button key={o.value} onClick={() => onSelect(o.value)} style={row}>
            <div>
              <div style={rowTitle}>{o.label}</div>
              <div style={rowSubtitle}>{BRANCHE_LABELS[o.branche] ?? o.branche}</div>
            </div>
            <span style={chevron}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}

const h1: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xl)',
  fontWeight: 700,
  color: 'var(--n-900)',
  letterSpacing: 'var(--tracking-tight)',
  margin: '0 0 var(--space-1)',
}

const subtitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: 0,
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  padding: 'var(--space-4) var(--space-5)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
}

const rowTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const rowSubtitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginTop: '2px',
}

const chevron: CSSProperties = {
  color: 'var(--n-400)',
  fontSize: 'var(--text-lg)',
}
