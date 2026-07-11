import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, EmptyState } from '../design-system'
import type { Dossier, DossierImmeuble } from '../types/database'
import { acteTypeLabel } from '../constants/acteTypes'
import { dossierStatutLabel } from '../constants/dossierStatuts'
import { suggestDossierNom } from '../dossiers/dossierNom'

interface ImmeubleDossiersSectionProps {
  immeubleId: string
  onSelectDossier?: (id: string) => void
}

type LinkWithDossier = DossierImmeuble & { dossier: Dossier | null }

function statutBadgeStatus(statut: string): 'ongoing' | 'archived' {
  return statut === 'cloture' ? 'archived' : 'ongoing'
}

export function ImmeubleDossiersSection({ immeubleId, onSelectDossier }: ImmeubleDossiersSectionProps) {
  const [links, setLinks] = useState<LinkWithDossier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('dossier_immeubles')
      .select('*, dossier:dossiers(*)')
      .eq('immeuble_id', immeubleId)
      .then(({ data, error }) => {
        if (error) setError('Impossible de charger les dossiers : ' + error.message)
        else setError(null)
        const sorted = (data ?? [])
          .filter((l) => l.dossier && !l.dossier.archived_at)
          .sort((a, b) => a.dossier!.created_at.localeCompare(b.dossier!.created_at))
        setLinks(sorted)
        setLoading(false)
      })
  }, [immeubleId])

  return (
    <div>
      <h3 style={h3}>Dossiers</h3>

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
        <EmptyState>Cet immeuble n'est rattaché à aucun dossier.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {links.map((l) => (
            <div
              key={l.id}
              style={{ ...row, cursor: onSelectDossier ? 'pointer' : 'default' }}
              onClick={() => { if (onSelectDossier) onSelectDossier(l.dossier!.id) }}
            >
              <span style={name}>
                {l.dossier!.nom || suggestDossierNom(l.dossier!.type_acte, []) || acteTypeLabel(l.dossier!.type_acte)}
              </span>
              <Badge status={statutBadgeStatus(l.dossier!.statut)} label={dossierStatutLabel(l.dossier!.statut)} size="sm" />
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
  margin: '0 0 var(--space-4)',
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
