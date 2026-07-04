import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Table, type TableColumn } from '../design-system'
import { Badge } from '../design-system/Badge'
import type { Dossier } from '../types/database'
import { ACTE_TYPE_OPTIONS, acteTypeLabel } from '../constants/acteTypes'
import { dossierStatutLabel } from '../constants/dossierStatuts'
import type { Utilisateur } from '../types/database'
import { useAuth } from '../auth/AuthContext'
import { DossierFormDrawer, type DossierFormValues } from './DossierFormDrawer'

function statutBadgeStatus(statut: string): 'ongoing' | 'archived' {
  return statut === 'cloture' ? 'archived' : 'ongoing'
}

interface DossierListPageProps {
  tenantId: string
  onSelect: (dossier: Dossier) => void
}

export function DossierListPage({ tenantId, onSelect }: DossierListPageProps) {
  const { memberships } = useAuth()
  const membership = memberships.find((m) => m.tenant_id === tenantId) ?? null
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [notaires, setNotaires] = useState<Utilisateur[]>([])
  const [clercs, setClercs] = useState<Utilisateur[]>([])
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

  async function loadNotaires() {
    const { data } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('actif', true)
      .contains('roles', ['notaire'])
    setNotaires(data ?? [])
  }

  async function loadClercs() {
    const { data } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('actif', true)
      .contains('roles', ['redacteur'])
    setClercs(data ?? [])
  }

  useEffect(() => { loadDossiers(); loadNotaires(); loadClercs() }, [tenantId])

  async function handleCreate(values: DossierFormValues) {
    setSaving(true)
    const branche = ACTE_TYPE_OPTIONS.find((o) => o.value === values.type_acte)?.branche ?? 'famille'
    const { error } = await supabase.from('dossiers').insert({
      tenant_id: tenantId,
      branche,
      type_acte: values.type_acte,
      numero: values.numero || null,
      notaire_id: values.notaire_id,
      clerc_attitre_id: values.clerc_attitre_id,
    })
    setSaving(false)
    if (error) { setError('Erreur lors de la création : ' + error.message); return }
    setDrawerOpen(false)
    loadDossiers()
  }

  const columns: TableColumn<Dossier>[] = [
    { key: 'numero', label: 'Numéro', mono: true, sortable: true, width: '20%' },
    { key: 'type_acte', label: 'Type', sortable: true, width: '28%', render: (v) => acteTypeLabel(v as string) },
    {
      key: 'statut', label: 'Statut', width: '14%',
      render: (v) => <Badge status={statutBadgeStatus(v as string)} label={dossierStatutLabel(v as string)} />,
    },
    {
      key: 'created_at', label: 'Créé le', width: '18%', sortable: true,
      render: (v) => new Date(v as string).toLocaleDateString('fr-FR'),
    },
    {
      key: 'updated_at', label: 'Mis à jour', width: '20%', sortable: true,
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
        notaires={notaires}
        clercs={clercs}
        defaultClercId={membership?.roles.includes('redacteur') ? membership.id : undefined}
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
