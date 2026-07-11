import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { EmptyState } from '../design-system'
import type { Historique } from '../types/database'
import { utilisateurLabel } from '../utilisateurs/utilisateurLabel'
import { historiqueActionLabel } from '../constants/historiqueActions'

interface HistoriqueSectionProps {
  dossierId: string
}

function formatDateTimeFr(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('fr-FR')
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${date} à ${time}`
}

export function HistoriqueSection({ dossierId }: HistoriqueSectionProps) {
  const [entries, setEntries] = useState<Historique[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('historique')
      .select('*, utilisateur:utilisateurs(*)')
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError('Impossible de charger le journal : ' + error.message)
        else setError(null)
        setEntries(data ?? [])
        setLoading(false)
      })
  }, [dossierId])

  return (
    <div>
      <h3 style={h3}>Journal du dossier</h3>
      <p style={subtitle}>Historique des actions effectuées sur ce dossier, par qui et quand.</p>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', margin: 'var(--space-4) 0',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

      {loading ? (
        <EmptyState>Chargement…</EmptyState>
      ) : entries.length === 0 ? (
        <EmptyState>Aucune action enregistrée pour l'instant.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          {entries.map((entry) => {
            const expanded = expandedId === entry.id
            return (
              <div key={entry.id} style={row}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: entry.details ? 'pointer' : 'default' }}
                  onClick={() => entry.details && setExpandedId(expanded ? null : entry.id)}
                >
                  <div style={{ minWidth: 0 }}>
                    <span style={action}>{historiqueActionLabel(entry.action)}</span>
                    <span style={meta}>{utilisateurLabel(entry.utilisateur)}</span>
                  </div>
                  <span style={date}>{formatDateTimeFr(entry.created_at)}</span>
                </div>
                {expanded && entry.details && (
                  <pre style={details}>{JSON.stringify(entry.details, null, 2)}</pre>
                )}
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

const subtitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: 'var(--space-1) 0 0',
}

const row: CSSProperties = {
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
}

const action: CSSProperties = {
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

const date: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
  marginLeft: 'var(--space-4)',
}

const details: CSSProperties = {
  marginTop: 'var(--space-3)',
  padding: 'var(--space-3)',
  background: 'var(--n-100)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: 'var(--text-2xs)',
  color: 'var(--n-700)',
  overflowX: 'auto',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
}
