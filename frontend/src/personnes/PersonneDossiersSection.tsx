import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, EmptyState } from '../design-system'
import type { Comparant, Dossier } from '../types/database'
import { acteTypeLabel } from '../constants/acteTypes'
import { dossierStatutLabel } from '../constants/dossierStatuts'
import { suggestDossierNom } from '../dossiers/dossierNom'

interface PersonneDossiersSectionProps {
  personneId: string
  onSelectDossier?: (id: string) => void
}

type ComparantWithDossier = Comparant & { dossier: Dossier | null }

function statutBadgeStatus(statut: string): 'ongoing' | 'archived' {
  return statut === 'cloture' ? 'archived' : 'ongoing'
}

export function PersonneDossiersSection({ personneId, onSelectDossier }: PersonneDossiersSectionProps) {
  const [comparants, setComparants] = useState<ComparantWithDossier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    supabase
      .from('comparants')
      .select('*, dossier:dossiers(*)')
      .eq('personne_id', personneId)
      .order('created_at')
      .then(({ data, error }) => {
        if (error) setError('Impossible de charger les dossiers : ' + error.message)
        else setError(null)
        setComparants((data ?? []).filter((c) => c.dossier && !c.dossier.archived_at))
        setLoading(false)
      })
  }, [personneId])

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
      ) : comparants.length === 0 ? (
        <EmptyState>Cette personne n'est comparante sur aucun dossier.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {comparants.map((c) => (
            <div
              key={c.id}
              style={{ ...row, cursor: onSelectDossier ? 'pointer' : 'default' }}
              onClick={() => { if (onSelectDossier) onSelectDossier(c.dossier!.id) }}
            >
              <div style={{ minWidth: 0 }}>
                <span style={name}>
                  {c.dossier!.nom || suggestDossierNom(c.dossier!.type_acte, []) || acteTypeLabel(c.dossier!.type_acte)}
                </span>
                <span style={meta}>{c.qualite}</span>
              </div>
              <Badge status={statutBadgeStatus(c.dossier!.statut)} label={dossierStatutLabel(c.dossier!.statut)} size="sm" />
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

const meta: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginLeft: 'var(--space-3)',
}
