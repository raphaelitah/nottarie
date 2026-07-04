import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Button, Select } from '../design-system'
import type { Dossier, Utilisateur } from '../types/database'
import { utilisateurLabel } from '../utilisateurs/utilisateurLabel'
import { ACTE_TYPE_OPTIONS, acteTypeLabel } from '../constants/acteTypes'
import { DOSSIER_STATUT_OPTIONS, dossierStatutLabel } from '../constants/dossierStatuts'
import { ComparantsSection } from './ComparantsSection'
import { ImmeublesSection } from './ImmeublesSection'
import { ActesSection } from './ActesSection'
import { AccesSection } from './AccesSection'

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
  statut: string
  type_acte: string
  notaire_id: string
}

interface DossierDetailPageProps {
  dossier: Dossier
  onBack: () => void
  onUpdated: (dossier: Dossier) => void
  onOpenComposer: () => void
}

export function DossierDetailPage({ dossier, onBack, onUpdated, onOpenComposer }: DossierDetailPageProps) {
  const [editingGeneral, setEditingGeneral] = useState(false)
  const [draft, setDraft] = useState<GeneralInfoDraft>({ statut: dossier.statut, type_acte: dossier.type_acte, notaire_id: dossier.notaire_id })
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notaire, setNotaire] = useState<Utilisateur | null>(null)
  const [createur, setCreateur] = useState<Utilisateur | null>(null)
  const [misAJourPar, setMisAJourPar] = useState<Utilisateur | null>(null)
  const [notaires, setNotaires] = useState<Utilisateur[]>([])

  useEffect(() => {
    supabase.from('utilisateurs').select('*').eq('id', dossier.notaire_id).maybeSingle()
      .then(({ data }) => setNotaire(data))
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
  }, [dossier.notaire_id, dossier.cree_par, dossier.mis_a_jour_par])

  useEffect(() => {
    supabase.from('utilisateurs').select('*')
      .eq('tenant_id', dossier.tenant_id)
      .eq('actif', true)
      .contains('roles', ['notaire'])
      .then(({ data }) => setNotaires(data ?? []))
  }, [dossier.tenant_id])

  function handleStartEditGeneral() {
    setDraft({ statut: dossier.statut, type_acte: dossier.type_acte, notaire_id: dossier.notaire_id })
    setError(null)
    setEditingGeneral(true)
  }

  async function handleSaveGeneral() {
    setSavingGeneral(true)
    setError(null)
    const branche = ACTE_TYPE_OPTIONS.find((o) => o.value === draft.type_acte)?.branche ?? dossier.branche
    const { data, error } = await supabase
      .from('dossiers')
      .update({ statut: draft.statut, type_acte: draft.type_acte, branche, notaire_id: draft.notaire_id })
      .eq('id', dossier.id)
      .select()
      .single()
    setSavingGeneral(false)
    if (error) { setError('Erreur lors de l\'enregistrement : ' + error.message); return }
    setEditingGeneral(false)
    onUpdated(data)
  }

  return (
    <div>
      <button onClick={onBack} style={breadcrumbBtn}>‹ Dossiers</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
        <h1 style={h1}>{dossier.numero || 'Dossier sans numéro'}</h1>
        <Badge status={statutBadgeStatus(dossier.statut)} label={dossierStatutLabel(dossier.statut)} />
      </div>
      <p style={subtitle}>
        {acteTypeLabel(dossier.type_acte)}
        {' · Mis à jour : '}{formatDateTimeFr(dossier.updated_at)}{' par '}{misAJourPar ? utilisateurLabel(misAJourPar) : '…'}
      </p>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', margin: 'var(--space-4) 0',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

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
            <EditPenButton onClick={handleStartEditGeneral} />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={grid2}>
            <div>
              <label style={labelStyle}>Numéro de dossier</label>
              <div style={valueStyle}>{dossier.numero || '—'}</div>
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
          </div>

          <div style={grid2}>
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
          </div>

          <div style={grid2}>
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
              <label style={labelStyle}>Créé par</label>
              <div style={valueStyle}>{createur ? utilisateurLabel(createur) : '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-6)' }}>
        <ComparantsSection tenantId={dossier.tenant_id} dossierId={dossier.id} />
      </div>

      <div style={{ marginTop: 'var(--space-6)' }}>
        <ImmeublesSection tenantId={dossier.tenant_id} dossierId={dossier.id} />
      </div>

      <div style={{ marginTop: 'var(--space-6)' }}>
        <ActesSection dossier={dossier} onOpenComposer={onOpenComposer} />
      </div>

      <div style={{ marginTop: 'var(--space-6)' }}>
        <AccesSection dossier={dossier} onUpdated={onUpdated} />
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

const grid2: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--space-4)',
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

function EditPenButton({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      title="Modifier les informations générales"
      aria-label="Modifier les informations générales"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid',
        borderColor: hover ? 'var(--border-default)' : 'transparent',
        background: hover ? 'var(--n-100)' : 'transparent',
        color: hover ? 'var(--n-900)' : 'var(--n-400)',
        cursor: 'pointer',
        transition: 'all 120ms ease',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    </button>
  )
}
