import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Input, Table, type TableColumn } from '../design-system'
import type { Personne } from '../types/database'
import { PERSONNE_TYPE_OPTIONS } from '../constants/personneTypes'
import { PersonneFormDrawer } from './PersonneFormDrawer'
import { personneDisplayName, personneFormToInsertPayload, type PersonneFormValues } from './PersonneFields'

function personneTypeLabel(type: string): string {
  return PERSONNE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}

interface PersonnesPageProps {
  tenantId: string
}

export function PersonnesPage({ tenantId }: PersonnesPageProps) {
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Personne | null>(null)
  const [saving, setSaving] = useState(false)

  async function loadPersonnes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('personnes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les personnes : ' + error.message)
    else setError(null)
    setPersonnes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadPersonnes() }, [tenantId])

  function openCreate() {
    setEditing(null)
    setDrawerOpen(true)
  }

  function openEdit(p: Personne) {
    setEditing(p)
    setDrawerOpen(true)
  }

  async function handleSave(values: PersonneFormValues) {
    setSaving(true)
    const payload = personneFormToInsertPayload(values, tenantId)
    const { error } = editing
      ? await supabase.from('personnes').update(payload).eq('id', editing.id)
      : await supabase.from('personnes').insert(payload)
    setSaving(false)
    if (error) { setError("Erreur lors de l'enregistrement : " + error.message); return }
    setDrawerOpen(false)
    loadPersonnes()
  }

  const query = search.trim().toLowerCase()
  const filtered = query
    ? personnes.filter((p) =>
        personneDisplayName(p).toLowerCase().includes(query) ||
        (p.email ?? '').toLowerCase().includes(query)
      )
    : personnes

  const columns: TableColumn<Personne>[] = [
    { key: 'nom', label: 'Nom', width: '35%', render: (_v, row) => personneDisplayName(row) },
    { key: 'type', label: 'Type', width: '20%', render: (v) => personneTypeLabel(v as string) },
    { key: 'email', label: 'Email', width: '25%' },
    { key: 'telephone', label: 'Téléphone', width: '20%' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={h1}>Personnes</h1>
          <p style={subtitle}>Retrouvez et créez les personnes de l'étude.</p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>+ Nouvelle personne</Button>
      </div>

      <div style={{ marginBottom: 'var(--space-4)', maxWidth: '320px' }}>
        <Input placeholder="Rechercher par nom ou email…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
        emptyLabel={query ? 'Aucune personne ne correspond à cette recherche.' : 'Aucune personne pour le moment.'}
      />

      <PersonneFormDrawer
        open={drawerOpen}
        personne={editing}
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
