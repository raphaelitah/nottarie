import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import type { Comparant, Dossier } from '../types/database'
import { acteTypeLabel } from '../constants/acteTypes'
import { TruncatedTooltip } from '../design-system/TruncatedTooltip'
import { suggestDossierNom } from '../dossiers/dossierNom'

type DossierWithComparants = Dossier & { comparants?: Comparant[] }

interface DossiersEnCoursCardProps {
  tenantId: string
  onSelectDossier: (id: string) => void
  onViewAll: () => void
}

export function DossiersEnCoursCard({ tenantId, onSelectDossier, onViewAll }: DossiersEnCoursCardProps) {
  const [dossiers, setDossiers] = useState<DossierWithComparants[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      supabase
        .from('dossiers')
        .select('*, comparants(qualite, personne:personnes(*))')
        .eq('tenant_id', tenantId)
        .eq('statut', 'ouvert')
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('dossiers')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('statut', 'ouvert')
        .is('archived_at', null),
    ]).then(([listRes, countRes]) => {
      if (cancelled) return
      setDossiers(listRes.data ?? [])
      setCount(countRes.count ?? 0)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [tenantId])

  return (
    <div style={card}>
      <div style={cardHeader}>
        <h2 style={h2}>Dossiers en cours{count !== null ? ` (${count})` : ''}</h2>
        <button onClick={onViewAll} style={linkBtn}>Voir tous →</button>
      </div>
      {loading ? (
        <p style={emptyText}>Chargement…</p>
      ) : dossiers.length === 0 ? (
        <p style={emptyText}>Aucun dossier en cours.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {dossiers.map((d) => (
            <button key={d.id} onClick={() => onSelectDossier(d.id)} style={row}>
              <TruncatedTooltip text={d.nom || suggestDossierNom(d.type_acte, d.comparants ?? []) || acteTypeLabel(d.type_acte)} style={rowTitle} />
              <span style={rowMeta}>{d.numero ?? '—'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const card: CSSProperties = {
  flex: 1, minWidth: 0,
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
}

const cardHeader: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)',
}

const h2: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', fontWeight: 600,
  color: 'var(--n-900)', margin: 0,
}

const linkBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 500,
  color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
}

const emptyText: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-disabled)', margin: 0,
}

const row: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 'var(--space-2)',
  width: '100%', textAlign: 'left',
  padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
  border: 'none', background: 'transparent', cursor: 'pointer',
}

const rowTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--n-900)',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  flex: 1, minWidth: 0, width: '100%',
}

const rowMeta: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', flexShrink: 0,
}
