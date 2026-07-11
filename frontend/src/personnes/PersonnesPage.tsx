import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button, HoverIconButton, Input, Table, Modal, folderPlusIcon, type TableColumn } from '../design-system'
import type { Dossier, Personne, Utilisateur } from '../types/database'
import { PERSONNE_TYPE_OPTIONS } from '../constants/personneTypes'
import { ACTE_TYPE_OPTIONS } from '../constants/acteTypes'
import { useAuth } from '../auth/useAuth'
import { PersonneFormDrawer } from './PersonneFormDrawer'
import { personneDisplayName, personneFormToInsertPayload, type PersonneFormValues } from './personneForm'
import { DossierFormDrawer, type DossierFormValues } from '../dossiers/DossierFormDrawer'

function personneTypeLabel(type: string): string {
  return PERSONNE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}

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

interface PersonnesPageProps {
  tenantId: string
  focusId?: string | null
  onFocusHandled?: () => void
  onSelectDossier?: (id: string) => void
}

export function PersonnesPage({ tenantId, focusId, onFocusHandled, onSelectDossier }: PersonnesPageProps) {
  const { memberships } = useAuth()
  const membership = memberships.find((m) => m.tenant_id === tenantId) ?? null
  const canArchive = membership?.roles.some((r) => r === 'administrateur' || r === 'notaire') ?? false
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Personne | null>(null)
  const [saving, setSaving] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<Personne | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [dossierDrawerFor, setDossierDrawerFor] = useState<Personne | null>(null)
  const [dossierSaving, setDossierSaving] = useState(false)
  const [notaires, setNotaires] = useState<Utilisateur[]>([])
  const [clercs, setClercs] = useState<Utilisateur[]>([])
  const [dossiers, setDossiers] = useState<Dossier[]>([])

  useEffect(() => {
    if (!focusId) return
    supabase.from('personnes').select('*').eq('id', focusId).single().then(({ data }) => {
      if (data) { setEditing(data); setDrawerOpen(true) }
      onFocusHandled?.()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId])

  async function loadPersonnes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('personnes')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les personnes : ' + error.message)
    else setError(null)
    setPersonnes(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadPersonnes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  async function loadDossierCreationData() {
    const [{ data: n }, { data: c }, { data: d }] = await Promise.all([
      supabase.from('utilisateurs').select('*').eq('tenant_id', tenantId).eq('actif', true).contains('roles', ['notaire']),
      supabase.from('utilisateurs').select('*').eq('tenant_id', tenantId).eq('actif', true).contains('roles', ['redacteur']),
      supabase.from('dossiers').select('*').eq('tenant_id', tenantId).is('archived_at', null).order('created_at', { ascending: false }),
    ])
    setNotaires(n ?? [])
    setClercs(c ?? [])
    setDossiers(d ?? [])
  }

  function openNewDossier(p: Personne) {
    loadDossierCreationData()
    setDossierDrawerFor(p)
  }

  async function handleCreateDossier(values: DossierFormValues) {
    if (!dossierDrawerFor) return
    setDossierSaving(true)
    const branche = ACTE_TYPE_OPTIONS.find((o) => o.value === values.type_acte)?.branche ?? 'famille'
    const { data, error } = await supabase.from('dossiers').insert({
      tenant_id: tenantId,
      branche,
      type_acte: values.type_acte,
      nom: values.nom.trim() || null,
      notaire_id: values.notaire_id,
      clerc_attitre_id: values.clerc_attitre_id,
      dossier_parent_id: values.dossier_parent_id,
    }).select().single()
    if (error) {
      setDossierSaving(false)
      setError(error.code === '23505' ? 'Un dossier avec ce numéro existe déjà.' : 'Erreur lors de la création : ' + error.message)
      return
    }
    const { error: comparantError } = await supabase.from('comparants').insert({
      tenant_id: tenantId,
      dossier_id: data.id,
      personne_id: dossierDrawerFor.id,
      qualite: values.comparant_qualite,
    })
    setDossierSaving(false)
    if (comparantError) { setError("Erreur lors du rattachement de la personne au dossier : " + comparantError.message); return }
    setDossierDrawerFor(null)
    onSelectDossier?.(data.id)
  }

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

  async function handleArchive() {
    if (!archiveTarget) return
    setArchiving(true)
    const { error } = await supabase
      .from('personnes')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', archiveTarget.id)
    setArchiving(false)
    if (error) { setError("Erreur lors de l'archivage : " + error.message); return }
    setArchiveTarget(null)
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
    {
      key: 'actions', label: '', width: canArchive ? '10%' : '5%', align: 'right' as const,
      render: (_: unknown, row: Personne) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <HoverIconButton icon={folderPlusIcon} label="Nouveau dossier" onClick={() => openNewDossier(row)} />
          {canArchive && (
            <button
              type="button"
              title="Archiver la personne"
              aria-label="Archiver la personne"
              onClick={() => setArchiveTarget(row)}
              style={archiveBtn}
            >
              <TrashIcon />
            </button>
          )}
        </div>
      ),
    },
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
        onSelectDossier={onSelectDossier}
      />

      <DossierFormDrawer
        open={!!dossierDrawerFor}
        saving={dossierSaving}
        notaires={notaires}
        clercs={clercs}
        dossiers={dossiers}
        defaultClercId={membership?.roles.includes('redacteur') ? membership.id : undefined}
        prefillPersonne={dossierDrawerFor}
        onSave={handleCreateDossier}
        onClose={() => setDossierDrawerFor(null)}
      />

      <Modal
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title="Archiver la personne"
        subtitle={archiveTarget ? personneDisplayName(archiveTarget) : undefined}
        size="sm"
        footer={(
          <>
            <Button variant="secondary" size="sm" onClick={() => setArchiveTarget(null)}>Annuler</Button>
            <Button variant="destructive" size="sm" disabled={archiving} onClick={handleArchive}>
              {archiving ? 'Archivage…' : 'Archiver'}
            </Button>
          </>
        )}
      >
        Cette personne n'apparaîtra plus dans la liste. Elle restera consultable et restaurable depuis l'onglet Archive de l'Administration de l'étude.
      </Modal>
    </div>
  )
}

const archiveBtn: CSSProperties = {
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
