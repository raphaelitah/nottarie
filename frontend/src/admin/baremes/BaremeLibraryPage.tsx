import { useState } from 'react'
import type { CSSProperties } from 'react'
import { BaremeDetailPage } from './BaremeDetailPage'

const TYPES: { value: 'succession' | 'donation'; label: string; description: string }[] = [
  { value: 'succession', label: 'Succession', description: "Émolument proportionnel à l'actif brut total (Article A444-63)." },
  { value: 'donation', label: 'Donation', description: 'Quatre variantes selon la nature de la donation (Article A444-67).' },
]

export function BaremeLibraryPage() {
  const [typeActe, setTypeActe] = useState<'succession' | 'donation' | null>(null)

  if (typeActe) return <BaremeDetailPage typeActe={typeActe} onBack={() => setTypeActe(null)} />

  return (
    <div>
      <h1 style={h1}>Barèmes</h1>
      <p style={subtitle}>Tarifs réglementés des notaires utilisés par le calculateur d'estimation des frais.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
        {TYPES.map((t) => (
          <button key={t.value} onClick={() => setTypeActe(t.value)} style={row}>
            <div>
              <div style={rowTitle}>{t.label}</div>
              <div style={rowSubtitle}>{t.description}</div>
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
