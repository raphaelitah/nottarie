import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Input, Table, type TableColumn } from '../design-system'
import type { Immeuble } from '../types/database'
import { regimeBienLabel } from '../constants/regimeBien'
import { typeBienLabel } from '../constants/typeBien'
import { ImmeubleFormDrawer } from './ImmeubleFormDrawer'
import { immeubleDisplayName, immeubleFormToInsertPayload, type ImmeubleFormValues } from './ImmeubleFields'

interface ImmeublesPageProps {
  tenantId: string
  focusId?: string | null
  onFocusHandled?: () => void
}

export function ImmeublesPage({ tenantId, focusId, onFocusHandled }: ImmeublesPageProps) {
  const [immeubles, setImmeubles] = useState<Immeuble[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Immeuble | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!focusId) return
    supabase.from('immeubles').select('*').eq('id', focusId).single().then(({ data }) => {
      if (data) { setEditing(data); setDrawerOpen(true) }
      onFocusHandled?.()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  async function loadImmeubles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('immeubles')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les immeubles : ' + error.message)
    else setError(null)
    setImmeubles(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadImmeubles() }, [tenantId])

  function openCreate() {
    setEditing(null)
    setDrawerOpen(true)
  }

  function openEdit(i: Immeuble) {
    setEditing(i)
    setDrawerOpen(true)
  }

  async function handleSave(values: ImmeubleFormValues) {
    setSaving(true)
    const payload = immeubleFormToInsertPayload(values, tenantId)
    const { error } = editing
      ? await supabase.from('immeubles').update(payload).eq('id', editing.id)
      : await supabase.from('immeubles').insert(payload)
    setSaving(false)
    if (error) { setError("Erreur lors de l'enregistrement : " + error.message); return }
    setDrawerOpen(false)
    loadImmeubles()
  }

  const query = search.trim().toLowerCase()
  const filtered = query
    ? immeubles.filter((i) =>
        immeubleDisplayName(i).toLowerCase().includes(query) ||
        (i.references_cadastrales ?? '').toLowerCase().includes(query) ||
        (i.ville ?? '').toLowerCase().includes(query)
      )
    : immeubles

  const columns: TableColumn<Immeuble>[] = [
    { key: 'designation', label: 'Désignation', width: '30%', render: (_v, row) => immeubleDisplayName(row) },
    { key: 'type_bien', label: 'Type', width: '20%', render: (v) => typeBienLabel(v as string | null) },
    { key: 'ville', label: 'Ville', width: '20%' },
    { key: 'references_cadastrales', label: 'Références cadastrales', width: '20%' },
    { key: 'regime', label: 'Régime', width: '10%', render: (v) => regimeBienLabel(v as string | null) },
  ]

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={h1}>Immeubles</h1>
          <p style={subtitle}>Retrouvez et créez les biens de l'étude.</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>+ Nouvel immeuble</Button>
      </div>

      <div style={{ marginBottom: 'var(--space-4)', maxWidth: '320px' }}>
        <Input placeholder="Rechercher par désignation ou référence…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

      <Table
        columns={columns}
        rows={filtered}
        loading={loading}
        onRowClick={openEdit}
        emptyLabel={query ? 'Aucun immeuble ne correspond à cette recherche.' : 'Aucun immeuble pour le moment.'}
      />

      <ImmeubleFormDrawer
        open={drawerOpen}
        immeuble={editing}
        saving={saving}
        onSave={handleSave}
        onClose={() => setDrawerOpen(false)}
      />
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
