import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import type { Formalite } from '../types/database'
import { formaliteTypeLabel } from '../constants/formaliteTypes'
import { formaliteStatutLabel } from '../constants/formaliteStatuts'

const PENDING_STATUTS = ['a_envoyer', 'envoyee', 'relancee']

type FormaliteRow = Formalite & {
  dossier: { id: string; nom: string | null; numero: string | null; type_acte: string } | null
}

interface FormalitesEnAttenteCardProps {
  tenantId: string
  onSelectDossier: (dossierId: string) => void
}

export function FormalitesEnAttenteCard({ tenantId, onSelectDossier }: FormalitesEnAttenteCardProps) {
  const [formalites, setFormalites] = useState<FormaliteRow[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      supabase
        .from('formalites')
        .select('*, dossier:dossiers(id, nom, numero, type_acte)')
        .eq('tenant_id', tenantId)
        .in('statut', PENDING_STATUTS)
        .order('updated_at', { ascending: true })
        .limit(5),
      supabase
        .from('formalites')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('statut', PENDING_STATUTS),
    ]).then(([listRes, countRes]) => {
      if (cancelled) return
      setFormalites((listRes.data as FormaliteRow[] | null) ?? [])
      setCount(countRes.count ?? 0)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [tenantId])

  return (
    <div style={card}>
      <div style={cardHeader}>
        <h2 style={h2}>Formalités en attente{count !== null ? ` (${count})` : ''}</h2>
      </div>
      {loading ? (
        <p style={emptyText}>Chargement…</p>
      ) : formalites.length === 0 ? (
        <p style={emptyText}>Aucune formalité en attente.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {formalites.map((f) => (
            <button
              key={f.id}
              onClick={() => f.dossier && onSelectDossier(f.dossier.id)}
              disabled={!f.dossier}
              style={row}
            >
              <span style={rowMain}>
                <span style={rowTitle}>{formaliteTypeLabel(f.type)}</span>
                <span style={rowMeta}>{f.dossier?.nom || f.dossier?.numero || 'Dossier supprimé'}</span>
              </span>
              <span style={rowStatut}>{formaliteStatutLabel(f.statut)}</span>
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

const emptyText: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-disabled)', margin: 0,
}

const row: CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)',
  width: '100%', textAlign: 'left',
  padding: 'var(--space-2)', borderRadius: 'var(--radius-md)',
  border: 'none', background: 'transparent', cursor: 'pointer',
}

const rowMain: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0,
}

const rowTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--n-900)',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}

const rowMeta: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}

const rowStatut: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-muted)', flexShrink: 0,
}
