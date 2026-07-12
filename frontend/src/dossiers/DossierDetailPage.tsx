import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Button, EditPenButton, Input, MOBILE_QUERY, Select, STACK_QUERY, useMediaQuery } from '../design-system'
import { Modal } from '../design-system/Modal'
import type { Acte, Comparant, Dossier, Utilisateur } from '../types/database'
import { utilisateurLabel } from '../utilisateurs/utilisateurLabel'
import { useAuth } from '../auth/useAuth'
import { ACTE_TYPE_OPTIONS, acteTypeLabel } from '../constants/acteTypes'
import { suggestDossierNom } from './dossierNom'
import { DOSSIER_STATUT_OPTIONS, dossierStatutLabel } from '../constants/dossierStatuts'
import { ComparantsSection } from './ComparantsSection'
import { ImmeublesSection } from './ImmeublesSection'
import { ActesSection } from './ActesSection'
import { DocumentsSection } from './DocumentsSection'
import { CourriersSection } from './CourriersSection'
import { FormalitesSection } from './FormalitesSection'
import { CoutEstimationSection } from './CoutEstimationSection'
import { AccesSection } from './AccesSection'
import { HistoriqueSection } from './HistoriqueSection'
import { EvenementsSection } from './EvenementsSection'

const TABS = [
  { key: 'general', label: 'Général' },
  { key: 'frais', label: 'Estimation des frais' },
  { key: 'acces', label: 'Accès' },
  { key: 'log', label: 'Log' },
] as const

type TabKey = typeof TABS[number]['key']

function statutBadgeStatus(statut: string): 'ongoing' | 'archived' {
  return statut === 'cloture' ? 'archived' : 'ongoing'
}

function formatDateTimeFr(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('fr-FR')
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${date} à ${time}`
}

interface GeneralInfoDraft {
  numero: string
  nom: string
  statut: string
  type_acte: string
  notaire_id: string
  clerc_attitre_id: string
}

interface DossierDetailPageProps {
  dossier: Dossier
  onBack: () => void
  onUpdated: (dossier: Dossier) => void
  onOpenComposer: () => void
  onEditActe: (acte: Acte) => void
  onOpenRelecture: (acte: Acte) => void
  onSelectPersonne?: (id: string) => void
  onSelectImmeuble?: (id: string) => void
  onOpenAgenda?: () => void
}

export function DossierDetailPage({ dossier, onBack, onUpdated, onOpenComposer, onEditActe, onOpenRelecture, onSelectPersonne, onSelectImmeuble, onOpenAgenda }: DossierDetailPageProps) {
  const stack = useMediaQuery(STACK_QUERY)
  const mobile = useMediaQuery(MOBILE_QUERY)
  const { memberships } = useAuth()
  const membership = memberships.find((m) => m.tenant_id === dossier.tenant_id) ?? null
  const isAdmin = membership?.roles.includes('administrateur') ?? false
  const canManageAcces = !!membership && (
    membership.roles.includes('administrateur')
    || membership.roles.includes('notaire')
    || membership.id === dossier.clerc_attitre_id
  )

  const [tab, setTab] = useState<TabKey>('general')
  const [editingGeneral, setEditingGeneral] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [draft, setDraft] = useState<GeneralInfoDraft>({ numero: dossier.numero ?? '', nom: dossier.nom ?? '', statut: dossier.statut, type_acte: dossier.type_acte, notaire_id: dossier.notaire_id, clerc_attitre_id: dossier.clerc_attitre_id })
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notaire, setNotaire] = useState<Utilisateur | null>(null)
  const [clercAttitre, setClercAttitre] = useState<Utilisateur | null>(null)
  const [createur, setCreateur] = useState<Utilisateur | null>(null)
  const [misAJourPar, setMisAJourPar] = useState<Utilisateur | null>(null)
  const [notaires, setNotaires] = useState<Utilisateur[]>([])
  const [clercs, setClercs] = useState<Utilisateur[]>([])
  const [dossierParent, setDossierParent] = useState<Dossier | null>(null)
  const [comparants, setComparants] = useState<Comparant[]>([])

  useEffect(() => {
    supabase.from('comparants').select('*, personne:personnes(*)').eq('dossier_id', dossier.id)
      .then(({ data }) => setComparants(data ?? []))
  }, [dossier.id])

  const suggestedNom = suggestDossierNom(dossier.type_acte, comparants)

  useEffect(() => {
    if (dossier.dossier_parent_id) {
      supabase.from('dossiers').select('*').eq('id', dossier.dossier_parent_id).maybeSingle()
        .then(({ data }) => setDossierParent(data))
    } else {
      setDossierParent(null)
    }
  }, [dossier.dossier_parent_id])

  useEffect(() => {
    supabase.from('utilisateurs').select('*').eq('id', dossier.notaire_id).maybeSingle()
      .then(({ data }) => setNotaire(data))
    supabase.from('utilisateurs').select('*').eq('id', dossier.clerc_attitre_id).maybeSingle()
      .then(({ data }) => setClercAttitre(data))
    if (dossier.cree_par) {
      supabase.from('utilisateurs').select('*').eq('id', dossier.cree_par).maybeSingle()
        .then(({ data }) => setCreateur(data))
    } else {
      setCreateur(null)
    }
    if (dossier.mis_a_jour_par) {
      supabase.from('utilisateurs').select('*').eq('id', dossier.mis_a_jour_par).maybeSingle()
        .then(({ data }) => setMisAJourPar(data))
    } else {
      setMisAJourPar(null)
    }
  }, [dossier.notaire_id, dossier.clerc_attitre_id, dossier.cree_par, dossier.mis_a_jour_par])

  useEffect(() => {
    supabase.from('utilisateurs').select('*')
      .eq('tenant_id', dossier.tenant_id)
      .eq('actif', true)
      .contains('roles', ['notaire'])
      .then(({ data }) => setNotaires(data ?? []))
    supabase.from('utilisateurs').select('*')
      .eq('tenant_id', dossier.tenant_id)
      .eq('actif', true)
      .contains('roles', ['redacteur'])
      .then(({ data }) => setClercs(data ?? []))
  }, [dossier.tenant_id])

  function handleStartEditGeneral() {
    setDraft({ numero: dossier.numero ?? '', nom: dossier.nom ?? '', statut: dossier.statut, type_acte: dossier.type_acte, notaire_id: dossier.notaire_id, clerc_attitre_id: dossier.clerc_attitre_id })
    setError(null)
    setEditingGeneral(true)
  }

  async function handleSaveGeneral() {
    setSavingGeneral(true)
    setError(null)
    const branche = ACTE_TYPE_OPTIONS.find((o) => o.value === draft.type_acte)?.branche ?? dossier.branche
    const { data, error } = await supabase
      .from('dossiers')
      .update({ numero: draft.numero.trim() || null, nom: draft.nom.trim() || null, statut: draft.statut, type_acte: draft.type_acte, branche, notaire_id: draft.notaire_id, clerc_attitre_id: draft.clerc_attitre_id })
      .eq('id', dossier.id)
      .select()
      .single()
    setSavingGeneral(false)
    if (error) {
      setError(error.code === '23505' ? 'Ce numéro de dossier existe déjà. Choisissez-en un autre.' : 'Erreur lors de l\'enregistrement : ' + error.message)
      return
    }
    setEditingGeneral(false)
    onUpdated(data)
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    const { error } = await supabase
      .from('dossiers')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', dossier.id)
    setDeleting(false)
    if (error) { setError('Erreur lors de la suppression : ' + error.message); return }
    setConfirmDelete(false)
    onBack()
  }

  return (
    <div>
      <button onClick={onBack} style={breadcrumbBtn}>‹ Dossiers</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
            <h1 style={h1}>{dossier.nom || suggestedNom || dossier.numero || 'Dossier sans numéro'}</h1>
            <Badge status={statutBadgeStatus(dossier.statut)} label={dossierStatutLabel(dossier.statut)} />
          </div>
          <p style={subtitle}>
            {dossier.numero || 'Sans numéro'}{' · '}{acteTypeLabel(dossier.type_acte)}
            {' · Mis à jour : '}{formatDateTimeFr(dossier.updated_at)}{' par '}{misAJourPar ? utilisateurLabel(misAJourPar) : '…'}
          </p>
        </div>
        {isAdmin && (
          <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>Supprimer le dossier</Button>
        )}
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', margin: 'var(--space-4) 0',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

      <div style={tabBar}>
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <>
        <div style={{ ...card, marginTop: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div style={{ ...sectionLabel, marginBottom: 0 }}>Informations générales</div>
            {editingGeneral ? (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button size="sm" variant="secondary" onClick={() => setEditingGeneral(false)}>Annuler</Button>
                <Button size="sm" variant="primary" disabled={savingGeneral} onClick={handleSaveGeneral}>
                  {savingGeneral ? '…' : 'Enregistrer'}
                </Button>
              </div>
            ) : (
              <EditPenButton label="Modifier les informations générales" onClick={handleStartEditGeneral} />
            )}
          </div>
          <div style={grid3(stack, mobile)}>
            <div>
              <label style={labelStyle}>Nom du dossier</label>
              {editingGeneral ? (
                <Input
                  value={draft.nom}
                  placeholder={suggestedNom ?? undefined}
                  onChange={(e) => setDraft((d) => ({ ...d, nom: e.target.value }))}
                />
              ) : (
                <div style={valueStyle}>{dossier.nom || suggestedNom || '—'}</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Numéro de dossier</label>
              {editingGeneral ? (
                <Input value={draft.numero} onChange={(e) => setDraft((d) => ({ ...d, numero: e.target.value }))} />
              ) : (
                <div style={valueStyle}>{dossier.numero || '—'}</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Statut</label>
              {editingGeneral ? (
                <Select
                  value={draft.statut}
                  options={DOSSIER_STATUT_OPTIONS}
                  onChange={(e) => setDraft((d) => ({ ...d, statut: e.target.value }))}
                />
              ) : (
                <div style={valueStyle}>{dossierStatutLabel(dossier.statut)}</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Type de dossier</label>
              {editingGeneral ? (
                <Select
                  value={draft.type_acte}
                  options={ACTE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  onChange={(e) => setDraft((d) => ({ ...d, type_acte: e.target.value }))}
                />
              ) : (
                <div style={valueStyle}>{acteTypeLabel(dossier.type_acte)}</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Créé le</label>
              <div style={valueStyle}>{new Date(dossier.created_at).toLocaleDateString('fr-FR')}</div>
            </div>
            <div>
              <label style={labelStyle}>Notaire responsable</label>
              {editingGeneral ? (
                <Select
                  value={draft.notaire_id}
                  options={notaires.map((n) => ({ value: n.id, label: utilisateurLabel(n) }))}
                  onChange={(e) => setDraft((d) => ({ ...d, notaire_id: e.target.value }))}
                />
              ) : (
                <div style={valueStyle}>{utilisateurLabel(notaire)}</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Clerc attitré</label>
              {editingGeneral ? (
                <Select
                  value={draft.clerc_attitre_id}
                  options={clercs.map((c) => ({ value: c.id, label: utilisateurLabel(c) }))}
                  onChange={(e) => setDraft((d) => ({ ...d, clerc_attitre_id: e.target.value }))}
                />
              ) : (
                <div style={valueStyle}>{utilisateurLabel(clercAttitre)}</div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Créé par</label>
              <div style={valueStyle}>{createur ? utilisateurLabel(createur) : '—'}</div>
            </div>
            {dossier.dossier_parent_id && (
              <div>
                <label style={labelStyle}>Dossier parent</label>
                <div style={valueStyle}>{dossierParent?.numero ?? '…'}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ ...grid2(stack), marginTop: 'var(--space-6)' }}>
          <ComparantsSection tenantId={dossier.tenant_id} dossierId={dossier.id} onSelectPersonne={onSelectPersonne} />
          <ImmeublesSection tenantId={dossier.tenant_id} dossierId={dossier.id} onSelectImmeuble={onSelectImmeuble} />
        </div>

        <div style={{ ...grid2(stack), marginTop: 'var(--space-6)' }}>
          <ActesSection dossier={dossier} onOpenComposer={onOpenComposer} onEditActe={onEditActe} onOpenRelecture={onOpenRelecture} />
          <DocumentsSection tenantId={dossier.tenant_id} dossierId={dossier.id} />
        </div>

        <div style={{ ...grid2(stack), marginTop: 'var(--space-6)' }}>
          <CourriersSection tenantId={dossier.tenant_id} dossierId={dossier.id} />
          <FormalitesSection tenantId={dossier.tenant_id} dossierId={dossier.id} />
        </div>

        <div style={{ marginTop: 'var(--space-6)' }}>
          <EvenementsSection dossierId={dossier.id} onOpenAgenda={onOpenAgenda} />
        </div>
        </>
      )}

      {tab === 'frais' && (
        <div style={{ ...card, marginTop: 'var(--space-6)' }}>
          <CoutEstimationSection dossier={dossier} onUpdated={onUpdated} />
        </div>
      )}

      {tab === 'acces' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <AccesSection dossier={dossier} canManage={canManageAcces} onUpdated={onUpdated} />
        </div>
      )}

      {tab === 'log' && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <HistoriqueSection dossierId={dossier.id} />
        </div>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Supprimer le dossier"
        subtitle={`${dossier.numero || 'Dossier sans numéro'} — ${acteTypeLabel(dossier.type_acte)}`}
        size="sm"
        footer={(
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>Annuler</Button>
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

const h1: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xl)',
  fontWeight: 700,
  color: 'var(--n-900)',
  letterSpacing: 'var(--tracking-tight)',
  margin: 0,
}

const subtitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: 0,
}

const card: CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
  boxShadow: 'var(--shadow-sm)',
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

const sectionLabel: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-2xs)',
  fontWeight: 600,
  color: 'var(--n-500)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-4)',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  color: 'var(--n-700)',
  marginBottom: 'var(--space-1-5)',
}

const valueStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
}

function grid2(stack: boolean): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: stack ? '1fr' : '1fr 1fr',
    gap: 'var(--space-4)',
  }
}

function grid3(stack: boolean, mobile: boolean): CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: mobile ? '1fr' : stack ? '1fr 1fr' : '1fr 1fr 1fr',
    gap: 'var(--space-4)',
  }
}

const breadcrumbBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  marginBottom: 'var(--space-4)',
  display: 'inline-block',
}

