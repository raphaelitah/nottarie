import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button, HoverIconButton, Input, Table, Modal, folderPlusIcon, type TableColumn } from '../design-system'
import type { Dossier, Immeuble, ImmeubleProprietaire, Utilisateur } from '../types/database'
import { regimeBienLabel } from '../constants/regimeBien'
import { typeBienLabel } from '../constants/typeBien'
import { ACTE_TYPE_OPTIONS } from '../constants/acteTypes'
import { useAuth } from '../auth/useAuth'
import { ImmeubleFormDrawer } from './ImmeubleFormDrawer'
import { immeubleDisplayName, immeubleFormToInsertPayload, type ImmeubleFormValues } from './immeubleForm'
import { personneDisplayName } from '../personnes/personneForm'
import { DossierFormDrawer, type DossierFormValues } from '../dossiers/DossierFormDrawer'

function proprietaireDisplayName(p: ImmeubleProprietaire): string {
  return p.personne ? personneDisplayName(p.personne) : (p.nom_libre ?? 'Propriétaire sans nom')
}

function formatValeur(v: number | null): string {
  return v != null ? `${v.toLocaleString('fr-FR')} €` : '—'
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

interface ImmeublesPageProps {
  tenantId: string
  focusId?: string | null
  onFocusHandled?: () => void
  onSelectDossier?: (id: string) => void
}

export function ImmeublesPage({ tenantId, focusId, onFocusHandled, onSelectDossier }: ImmeublesPageProps) {
  const { memberships } = useAuth()
  const membership = memberships.find((m) => m.tenant_id === tenantId) ?? null
  const canArchive = membership?.roles.some((r) => r === 'administrateur' || r === 'notaire') ?? false
  const [immeubles, setImmeubles] = useState<Immeuble[]>([])
  const [proprietairesByImmeuble, setProprietairesByImmeuble] = useState<Record<string, ImmeubleProprietaire[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Immeuble | null>(null)
  const [saving, setSaving] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<Immeuble | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [dossierDrawerFor, setDossierDrawerFor] = useState<Immeuble | null>(null)
  const [dossierSaving, setDossierSaving] = useState(false)
  const [notaires, setNotaires] = useState<Utilisateur[]>([])
  const [clercs, setClercs] = useState<Utilisateur[]>([])
  const [dossiers, setDossiers] = useState<Dossier[]>([])

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
      .is('archived_at', null)
      .order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les immeubles : ' + error.message)
    else setError(null)
    setImmeubles(data ?? [])
    setLoading(false)

    const { data: proprietaires } = await supabase
      .from('immeuble_proprietaires')
      .select('*, personne:personnes(*)')
      .eq('tenant_id', tenantId)
    const grouped: Record<string, ImmeubleProprietaire[]> = {}
    for (const p of proprietaires ?? []) {
      (grouped[p.immeuble_id] ??= []).push(p)
    }
    setProprietairesByImmeuble(grouped)
  }

  useEffect(() => {
    loadImmeubles()
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

  function openNewDossier(i: Immeuble) {
    loadDossierCreationData()
    setDossierDrawerFor(i)
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
    const { error: linkError } = await supabase.from('dossier_immeubles').insert({
      tenant_id: tenantId,
      dossier_id: data.id,
      immeuble_id: dossierDrawerFor.id,
    })
    setDossierSaving(false)
    if (linkError) { setError("Erreur lors du rattachement de l'immeuble au dossier : " + linkError.message); return }
    setDossierDrawerFor(null)
    onSelectDossier?.(data.id)
  }

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

  async function handleArchive() {
    if (!archiveTarget) return
    setArchiving(true)
    const { error } = await supabase
      .from('immeubles')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', archiveTarget.id)
    setArchiving(false)
    if (error) { setError("Erreur lors de l'archivage : " + error.message); return }
    setArchiveTarget(null)
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
    { key: 'designation', label: 'Désignation', width: '22%', render: (_v, row) => immeubleDisplayName(row) },
    { key: 'type_bien', label: 'Type', width: '13%', render: (v) => typeBienLabel(v as string | null) },
    { key: 'ville', label: 'Ville', width: '13%' },
    {
      key: 'proprietaires', label: 'Propriétaire(s)', width: '20%',
      render: (_v, row) => {
        const proprietaires = proprietairesByImmeuble[row.id] ?? []
        return proprietaires.length > 0 ? proprietaires.map(proprietaireDisplayName).join(', ') : '—'
      },
    },
    {
      key: 'valeur_declaree', label: 'Valeur déclarée', width: '12%',
      render: (v) => formatValeur(v as number | null),
    },
    { key: 'regime', label: 'Régime', width: '10%', render: (v) => regimeBienLabel(v as string | null) },
    {
      key: 'actions', label: '', width: canArchive ? '10%' : '5%', align: 'right' as const,
      render: (_: unknown, row: Immeuble) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
          <HoverIconButton icon={folderPlusIcon} label="Nouveau dossier" onClick={() => openNewDossier(row)} />
          {canArchive && (
            <button
              type="button"
              title="Archiver l'immeuble"
              aria-label="Archiver l'immeuble"
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
        tenantId={tenantId}
        immeuble={editing}
        saving={saving}
        onSave={handleSave}
        onClose={() => setDrawerOpen(false)}
      />

      <DossierFormDrawer
        open={!!dossierDrawerFor}
        saving={dossierSaving}
        notaires={notaires}
        clercs={clercs}
        dossiers={dossiers}
        defaultClercId={membership?.roles.includes('redacteur') ? membership.id : undefined}
        prefillImmeuble={dossierDrawerFor}
        onSave={handleCreateDossier}
        onClose={() => setDossierDrawerFor(null)}
      />

      <Modal
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        title="Archiver l'immeuble"
        subtitle={archiveTarget ? immeubleDisplayName(archiveTarget) : undefined}
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
        Cet immeuble n'apparaîtra plus dans la liste. Il restera consultable et restaurable depuis l'onglet Archive de l'Administration de l'étude.
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
