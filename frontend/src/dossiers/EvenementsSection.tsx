import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { EmptyState } from '../design-system'
import type { Evenement, EvenementDossier } from '../types/database'

interface EvenementsSectionProps {
  dossierId: string
  onOpenAgenda?: () => void
}

type LinkWithEvenement = EvenementDossier & { evenement: Evenement | null }

function formatDateTime(evenement: Evenement): string {
  const d = new Date(evenement.debut)
  const date = d.toLocaleDateString('fr-FR')
  if (evenement.all_day) return date
  return `${date} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

export function EvenementsSection({ dossierId, onOpenAgenda }: EvenementsSectionProps) {
  const [links, setLinks] = useState<LinkWithEvenement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('evenement_dossiers')
      .select('*, evenement:evenements(*)')
      .eq('dossier_id', dossierId)
      .then(({ data, error }) => {
        if (error) setError('Impossible de charger les événements : ' + error.message)
        else setError(null)
        const sorted = (data ?? [])
          .filter((l) => l.evenement)
          .sort((a, b) => a.evenement!.debut.localeCompare(b.evenement!.debut))
        setLinks(sorted)
        setLoading(false)
      })
  }, [dossierId])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Événements</h3>
        {onOpenAgenda && (
          <button type="button" onClick={onOpenAgenda} style={agendaLink}>Voir l'agenda →</button>
        )}
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

      {loading ? (
        <EmptyState>Chargement…</EmptyState>
      ) : links.length === 0 ? (
        <EmptyState>Aucun événement rattaché à ce dossier.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {links.map((l) => (
            <div key={l.id} style={row}>
              <span style={name}>{l.evenement!.titre}</span>
              <span style={meta}>{formatDateTime(l.evenement!)}</span>
            </div>
          ))}
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

const agendaLink: CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--color-accent, var(--n-900))',
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
}
