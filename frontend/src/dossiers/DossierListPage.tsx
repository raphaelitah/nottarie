import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Table, type TableColumn } from '../design-system'
import { Badge } from '../design-system/Badge'
import type { Dossier } from '../types/database'
import { ACTE_TYPE_OPTIONS, acteTypeLabel } from '../constants/acteTypes'
import { dossierStatutLabel } from '../constants/dossierStatuts'
import { DossierFormDrawer, type DossierFormValues } from './DossierFormDrawer'

function statutBadgeStatus(statut: string): 'ongoing' | 'archived' {
  return statut === 'cloture' ? 'archived' : 'ongoing'
}

interface DossierListPageProps {
  tenantId: string
  onSelect: (dossier: Dossier) => void
}

export function DossierListPage({ tenantId, onSelect }: DossierListPageProps) {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadDossiers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les dossiers : ' + error.message)
    else setError(null)
    setDossiers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadDossiers() }, [tenantId])

  async function handleCreate(values: DossierFormValues) {
    setSaving(true)
    const branche = ACTE_TYPE_OPTIONS.find((o) => o.value === values.type_acte)?.branche ?? 'famille'
    const { error } = await supabase.from('dossiers').insert({
      tenant_id: tenantId,
      branche,
      type_acte: values.type_acte,
      numero: values.numero || null,
    })
    setSaving(false)
    if (error) { setError('Erreur lors de la création : ' + error.message); return }
    setDrawerOpen(false)
    loadDossiers()
  }

  const columns: TableColumn<Dossier>[] = [
    { key: 'numero', label: 'Numéro', mono: true, sortable: true, width: '25%' },
    { key: 'type_acte', label: 'Type', sortable: true, width: '35%', render: (v) => acteTypeLabel(v as string) },
    {
      key: 'statut', label: 'Statut', width: '18%',
      render: (v) => <Badge status={statutBadgeStatus(v as string)} label={dossierStatutLabel(v as string)} />,
    },
    {
      key: 'created_at', label: 'Créé le', width: '22%', sortable: true,
      render: (v) => new Date(v as string).toLocaleDateString('fr-FR'),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={h1}>Dossiers</h1>
          <p style={subtitle}>Retrouvez et créez les dossiers de l'étude.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setDrawerOpen(true)}>+ Nouveau dossier</Button>
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
        rows={dossiers}
        loading={loading}
        onRowClick={onSelect}
        emptyLabel="Aucun dossier pour le moment."
        defaultSort={{ key: 'created_at', dir: 'desc' }}
      />

      <DossierFormDrawer
        open={drawerOpen}
        saving={saving}
        onSave={handleCreate}
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
