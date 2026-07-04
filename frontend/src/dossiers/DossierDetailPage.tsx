import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Button, Input, Select } from '../design-system'
import type { Dossier, Utilisateur } from '../types/database'
import { utilisateurLabel } from '../utilisateurs/utilisateurLabel'
import { acteTypeLabel } from '../constants/acteTypes'
import { DOSSIER_STATUT_OPTIONS, dossierStatutLabel } from '../constants/dossierStatuts'
import { ComparantsSection } from './ComparantsSection'
import { ImmeublesSection } from './ImmeublesSection'
import { ActesSection } from './ActesSection'
import { AccesSection } from './AccesSection'

function statutBadgeStatus(statut: string): 'ongoing' | 'archived' {
  return statut === 'cloture' ? 'archived' : 'ongoing'
}

interface DossierDetailPageProps {
  dossier: Dossier
  onBack: () => void
  onUpdated: (dossier: Dossier) => void
  onOpenComposer: () => void
}

export function DossierDetailPage({ dossier, onBack, onUpdated, onOpenComposer }: DossierDetailPageProps) {
  const [editingNumero, setEditingNumero] = useState(false)
  const [numeroDraft, setNumeroDraft] = useState(dossier.numero ?? '')
  const [savingNumero, setSavingNumero] = useState(false)
  const [savingStatut, setSavingStatut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notaire, setNotaire] = useState<Utilisateur | null>(null)
  const [createur, setCreateur] = useState<Utilisateur | null>(null)

  useEffect(() => {
    supabase.from('utilisateurs').select('*').eq('id', dossier.notaire_id).maybeSingle()
      .then(({ data }) => setNotaire(data))
    if (dossier.cree_par) {
      supabase.from('utilisateurs').select('*').eq('id', dossier.cree_par).maybeSingle()
        .then(({ data }) => setCreateur(data))
    } else {
      setCreateur(null)
    }
  }, [dossier.notaire_id, dossier.cree_par])

  async function handleSaveNumero() {
    setSavingNumero(true)
    setError(null)
    const { data, error } = await supabase
      .from('dossiers')
      .update({ numero: numeroDraft.trim() || null })
      .eq('id', dossier.id)
      .select()
      .single()
    setSavingNumero(false)
    if (error) { setError('Erreur lors de l\'enregistrement : ' + error.message); return }
    setEditingNumero(false)
    onUpdated(data)
  }

  async function handleChangeStatut(statut: string) {
    setSavingStatut(true)
    setError(null)
    const { data, error } = await supabase
      .from('dossiers')
      .update({ statut })
      .eq('id', dossier.id)
      .select()
      .single()
    setSavingStatut(false)
    if (error) { setError('Erreur lors de l\'enregistrement : ' + error.message); return }
    onUpdated(data)
  }

  return (
    <div>
      <button onClick={onBack} style={breadcrumbBtn}>‹ Dossiers</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
        <h1 style={h1}>{dossier.numero || 'Dossier sans numéro'}</h1>
        <Badge status={statutBadgeStatus(dossier.statut)} label={dossierStatutLabel(dossier.statut)} />
      </div>
      <p style={subtitle}>{acteTypeLabel(dossier.type_acte)}</p>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', margin: 'var(--space-4) 0',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

      <div style={{ ...card, marginTop: 'var(--space-6)' }}>
        <div style={sectionLabel}>Informations générales</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={grid2}>
            <div>
              <label style={labelStyle}>Numéro de dossier</label>
              {editingNumero ? (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <Input value={numeroDraft} onChange={(e) => setNumeroDraft(e.target.value)} placeholder="ex. 2026-0142" />
                  <Button size="sm" variant="primary" disabled={savingNumero} onClick={handleSaveNumero}>
                    {savingNumero ? '…' : 'OK'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { setEditingNumero(false); setNumeroDraft(dossier.numero ?? '') }}>Annuler</Button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span style={valueStyle}>{dossier.numero || '—'}</span>
                  <button style={linkBtn} onClick={() => setEditingNumero(true)}>Modifier</button>
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Statut</label>
              <Select
                value={dossier.statut}
                options={DOSSIER_STATUT_OPTIONS}
                onChange={(e) => handleChangeStatut(e.target.value)}
                disabled={savingStatut}
              />
            </div>
          </div>

          <div style={grid2}>
            <div>
              <label style={labelStyle}>Type de dossier</label>
              <div style={valueStyle}>{acteTypeLabel(dossier.type_acte)}</div>
            </div>
            <div>
              <label style={labelStyle}>Créé le</label>
              <div style={valueStyle}>{new Date(dossier.created_at).toLocaleDateString('fr-FR')}</div>
            </div>
          </div>

          <div style={grid2}>
            <div>
              <label style={labelStyle}>Notaire responsable</label>
              <div style={valueStyle}>{utilisateurLabel(notaire)}</div>
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

const linkBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  color: 'var(--color-accent)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}
