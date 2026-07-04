import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import type { Etude } from '../types/database'
import { EtudeInfoSection } from './EtudeInfoSection'
import { EtudeUsersSection } from './EtudeUsersSection'
import { NomenclatureSection } from './NomenclatureSection'
import { ArchiveSection } from './ArchiveSection'

const TABS = [
  { key: 'informations', label: 'Informations' },
  { key: 'acces', label: 'Accès' },
  { key: 'nomenclature', label: 'Nomenclature' },
  { key: 'archive', label: 'Archive' },
] as const

type TabKey = typeof TABS[number]['key']

export function AdministrationPage({ tenantId }: { tenantId: string }) {
  const [tab, setTab] = useState<TabKey>('informations')
  const [etude, setEtude] = useState<Etude | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    supabase.from('etudes').select('*').eq('id', tenantId).single()
      .then(({ data }) => { setEtude(data); setLoading(false) })
  }, [tenantId])

  return (
    <div>
      <h1 style={h1}>Administration de l'étude</h1>
      <p style={subtitle}>Gérez les informations, les accès, la nomenclature de dossiers et les archives de votre étude.</p>

      <div style={tabBar}>
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-6)' }}>
        {loading || !etude ? (
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Chargement…</div>
        ) : tab === 'informations' ? (
          <EtudeInfoSection etude={etude} onUpdated={setEtude} />
        ) : tab === 'acces' ? (
          <EtudeUsersSection etudeId={etude.id} />
        ) : tab === 'nomenclature' ? (
          <NomenclatureSection etude={etude} onUpdated={setEtude} />
        ) : (
          <ArchiveSection etudeId={etude.id} />
        )}
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

const tabBar: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-1)',
  borderBottom: '1px solid var(--border-default)',
  marginTop: 'var(--space-6)',
}

function tabBtn(active: boolean): CSSProperties {
  return {
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: active ? 'var(--n-900)' : 'var(--text-muted)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--n-900)' : '2px solid transparent',
    padding: 'var(--space-3) var(--space-1)',
    marginBottom: '-1px',
    cursor: 'pointer',
  }
}
