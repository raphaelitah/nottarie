import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Input, Table, Tooltip, type TableColumn } from '../design-system'
import { Badge } from '../design-system/Badge'
import { Modal } from '../design-system/Modal'
import type { Comparant, Dossier } from '../types/database'
import { ACTE_TYPE_OPTIONS, acteTypeLabel } from '../constants/acteTypes'
import { dossierStatutLabel } from '../constants/dossierStatuts'
import type { Utilisateur } from '../types/database'
import { useAuth } from '../auth/useAuth'
import { utilisateurLabel } from '../utilisateurs/utilisateurLabel'
import { personneDisplayName } from '../personnes/personneForm'
import { suggestDossierNom } from './dossierNom'
import { DossierFormDrawer, type DossierFormValues } from './DossierFormDrawer'

type DossierRow = Dossier & { comparants?: Comparant[] }

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

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
  const isAdmin = membership?.roles.includes('administrateur') ?? false
  const [dossiers, setDossiers] = useState<DossierRow[]>([])
  const [search, setSearch] = useState('')
  const [notaires, setNotaires] = useState<Utilisateur[]>([])
  const [clercs, setClercs] = useState<Utilisateur[]>([])
  const [utilisateursById, setUtilisateursById] = useState<Record<string, Utilisateur>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DossierRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function loadDossiers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('dossiers')
      .select('*, comparants(qualite, personne:personnes(*))')
      .eq('tenant_id', tenantId)
      .is('archived_at', null)
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

  async function loadUtilisateurs() {
    const { data } = await supabase.from('utilisateurs').select('*').eq('tenant_id', tenantId)
    setUtilisateursById(Object.fromEntries((data ?? []).map((u) => [u.id, u])))
  }

  useEffect(() => {
    loadDossiers(); loadNotaires(); loadClercs(); loadUtilisateurs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  async function handleCreate(values: DossierFormValues) {
    setSaving(true)
    const branche = ACTE_TYPE_OPTIONS.find((o) => o.value === values.type_acte)?.branche ?? 'famille'
    const { error } = await supabase.from('dossiers').insert({
      tenant_id: tenantId,
      branche,
      type_acte: values.type_acte,
      nom: values.nom.trim() || null,
      notaire_id: values.notaire_id,
      clerc_attitre_id: values.clerc_attitre_id,
      dossier_parent_id: values.dossier_parent_id,
    })
    setSaving(false)
    if (error) {
      setError(error.code === '23505' ? 'Un dossier avec ce numéro existe déjà.' : 'Erreur lors de la création : ' + error.message)
      return
    }
    setDrawerOpen(false)
    loadDossiers()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const { error } = await supabase
      .from('dossiers')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', deleteTarget.id)
    setDeleting(false)
    if (error) { setError('Erreur lors de la suppression : ' + error.message); return }
    setDeleteTarget(null)
    loadDossiers()
  }

  const query = search.trim().toLowerCase()
  const filtered = query
    ? dossiers.filter((d) => {
        const nom = (d.nom || suggestDossierNom(d.type_acte, d.comparants ?? []) || acteTypeLabel(d.type_acte)).toLowerCase()
        const noms = (d.comparants ?? []).filter((c) => c.personne).map((c) => personneDisplayName(c.personne!).toLowerCase())
        return (
          (d.numero ?? '').toLowerCase().includes(query) ||
          nom.includes(query) ||
          noms.some((n) => n.includes(query))
        )
      })
    : dossiers

  const columns: TableColumn<DossierRow>[] = [
    { key: 'numero', label: 'Numéro', mono: true, sortable: true, width: '11%' },
    {
      key: 'nom', label: 'Nom', width: '22%',
      render: (v, row) => {
        const nom = (v as string | null) || suggestDossierNom(row.type_acte, row.comparants ?? []) || acteTypeLabel(row.type_acte)
        return <span title={nom} style={truncateCell(220)}>{nom}</span>
      },
    },
    { key: 'type_acte', label: 'Type', sortable: true, width: '11%', render: (v) => acteTypeLabel(v as string) },
    {
      key: 'comparants', label: 'Concerne', width: '18%',
      render: (_v, row) => {
        const noms = (row.comparants ?? []).filter((c) => c.personne).map((c) => personneDisplayName(c.personne!))
        const label = noms.length ? noms.join(', ') : '—'
        return <span title={label} style={truncateCellSmall(200)}>{label}</span>
      },
    },
    {
      key: 'clerc_attitre_id', label: 'Géré par', width: '14%',
      render: (v) => <span style={truncateCellSmall(140)}>{utilisateurLabel(utilisateursById[v as string])}</span>,
    },
    {
      key: 'statut', label: 'Statut', width: '10%',
      render: (v) => <Badge status={statutBadgeStatus(v as string)} label={dossierStatutLabel(v as string)} />,
    },
    {
      key: 'created_at', label: 'Créé le', width: '10%', sortable: true,
      render: (v) => new Date(v as string).toLocaleDateString('fr-FR'),
    },
    ...(isAdmin ? [{
      key: 'actions', label: '', width: '4%', align: 'right' as const,
      render: (_: unknown, row: DossierRow) => (
        <Tooltip label="Supprimer le dossier" align="right">
          <button
            type="button"
            aria-label="Supprimer le dossier"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}
            style={deleteBtn}
          >
            <TrashIcon />
          </button>
        </Tooltip>
      ),
    }] : []),
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

      <div style={{ marginBottom: 'var(--space-4)', maxWidth: '320px' }}>
        <Input placeholder="Rechercher par numéro, nom ou personne…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
        onRowClick={onSelect}
        emptyLabel={query ? 'Aucun dossier ne correspond à cette recherche.' : 'Aucun dossier pour le moment.'}
        defaultSort={{ key: 'created_at', dir: 'desc' }}
      />

      <DossierFormDrawer
        open={drawerOpen}
        saving={saving}
        notaires={notaires}
        clercs={clercs}
        dossiers={dossiers}
        defaultClercId={membership?.roles.includes('redacteur') ? membership.id : undefined}
        onSave={handleCreate}
        onClose={() => setDrawerOpen(false)}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le dossier"
        subtitle={deleteTarget ? `${deleteTarget.numero || 'Dossier sans numéro'} — ${acteTypeLabel(deleteTarget.type_acte)}` : undefined}
        size="sm"
        footer={(
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Suppression…' : 'Supprimer'}
            </Button>
          </>
        )}
      >
        Ce dossier n'apparaîtra plus dans la liste. Il restera consultable et restaurable depuis l'onglet Archive de l'Administration de l'étude.
      </Modal>
    </div>
  )
}

function truncateCell(widthPx: number): CSSProperties {
  return {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: `${widthPx}px`,
  }
}

function truncateCellSmall(widthPx: number): CSSProperties {
  return {
    ...truncateCell(widthPx),
    fontSize: 'var(--text-xs)',
    color: 'var(--text-muted)',
  }
}

const deleteBtn: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid transparent',
  background: 'transparent',
  color: 'var(--n-400)',
  cursor: 'pointer',
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
