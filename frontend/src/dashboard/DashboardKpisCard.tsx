import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'

interface DashboardKpisCardProps {
  tenantId: string
}

interface Kpis {
  dossiersOuvertsCeMois: number
  dossiersClosCeMois: number
  signaturesEnAttente: number
  formalitesEnRetard: number
}

const PENDING_FORMALITE_STATUTS = ['a_envoyer', 'envoyee', 'relancee']

function startOfMonthIso(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function DashboardKpisCard({ tenantId }: DashboardKpisCardProps) {
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const monthStart = startOfMonthIso()
    const today = todayIso()

    Promise.all([
      supabase.from('dossiers').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).is('archived_at', null).gte('created_at', monthStart),
      supabase.from('dossiers').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).gte('clos_at', monthStart),
      supabase.from('signature_requests').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).eq('statut', 'en_cours'),
      supabase.from('formalites').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId).in('statut', PENDING_FORMALITE_STATUTS).lt('echeance', today),
    ]).then(([ouverts, clos, signatures, formalites]) => {
      if (cancelled) return
      setKpis({
        dossiersOuvertsCeMois: ouverts.count ?? 0,
        dossiersClosCeMois: clos.count ?? 0,
        signaturesEnAttente: signatures.count ?? 0,
        formalitesEnRetard: formalites.count ?? 0,
      })
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [tenantId])

  return (
    <div style={grid}>
      <KpiTile label="Dossiers ouverts ce mois" value={kpis?.dossiersOuvertsCeMois} loading={loading} />
      <KpiTile label="Dossiers clôturés ce mois" value={kpis?.dossiersClosCeMois} loading={loading} />
      <KpiTile label="Signatures en attente" value={kpis?.signaturesEnAttente} loading={loading} />
      <KpiTile label="Formalités en retard" value={kpis?.formalitesEnRetard} loading={loading} />
    </div>
  )
}

function KpiTile({ label, value, loading }: { label: string; value: number | undefined; loading: boolean }) {
  return (
    <div style={tile}>
      <div style={tileValue}>{loading ? '—' : value}</div>
      <div style={tileLabel}>{label}</div>
    </div>
  )
}

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 'var(--space-3)',
  marginTop: 'var(--space-6)',
}

const tile: CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
}

const tileValue: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-2xl, 28px)',
  fontWeight: 700,
  color: 'var(--n-900)',
  lineHeight: 1.1,
}

const tileLabel: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginTop: 'var(--space-1)',
}
