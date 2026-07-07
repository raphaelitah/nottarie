import type { CSSProperties } from 'react'
import { MailboxConnectionSection } from './MailboxConnectionSection'

export function MonComptePage({ tenantId, utilisateurId }: { tenantId: string; utilisateurId: string }) {
  return (
    <div>
      <h1 style={h1}>Mon compte</h1>
      <p style={subtitle}>Gérez vos préférences personnelles.</p>

      <div style={{ marginTop: 'var(--space-6)', maxWidth: '640px' }}>
        <MailboxConnectionSection tenantId={tenantId} utilisateurId={utilisateurId} />
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
