import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, HoverIconButton, SectionAddButton, Select, trashIcon } from '../design-system'
import type { Formalite } from '../types/database'
import { formaliteTypeLabel } from '../constants/formaliteTypes'
import { FORMALITE_STATUT_OPTIONS, formaliteBadgeStatus, formaliteStatutLabel } from '../constants/formaliteStatuts'
import { FormaliteFormDrawer } from './FormaliteFormDrawer'

interface FormalitesSectionProps {
  tenantId: string
  dossierId: string
}

export function FormalitesSection({ tenantId, dossierId }: FormalitesSectionProps) {
  const [formalites, setFormalites] = useState<Formalite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function loadFormalites() {
    setLoading(true)
    const { data, error } = await supabase
      .from('formalites')
      .select('*')
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les formalités : ' + error.message)
    else setError(null)
    setFormalites(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadFormalites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dossierId])

  async function handleAdd(type: string) {
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('formalites').insert({
      tenant_id: tenantId,
      dossier_id: dossierId,
      type,
    })
    setSaving(false)
    if (error) { setError("Erreur lors de l'ajout de la formalité : " + error.message); return }
    setDrawerOpen(false)
    loadFormalites()
  }

  async function handleStatutChange(formalite: Formalite, statut: string) {
    setUpdatingId(formalite.id)
    const { error } = await supabase.from('formalites').update({ statut }).eq('id', formalite.id)
    setUpdatingId(null)
    if (error) { setError('Erreur lors de la mise à jour du statut : ' + error.message); return }
    loadFormalites()
  }

  async function handleRemove(formalite: Formalite) {
    setRemovingId(formalite.id)
    const { error } = await supabase.from('formalites').delete().eq('id', formalite.id)
    setRemovingId(null)
    if (error) { setError('Erreur lors de la suppression : ' + error.message); return }
    loadFormalites()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Formalités</h3>
        <SectionAddButton label="Nouvelle formalité" onClick={() => setDrawerOpen(true)} />
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

      {loading ? (
        <div style={emptyCard}>Chargement…</div>
      ) : formalites.length === 0 ? (
        <div style={emptyCard}>Aucune formalité pour ce dossier.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {formalites.map((f) => (
            <div key={f.id} style={row}>
              <div style={{ minWidth: 0 }}>
                <span style={name}>{formaliteTypeLabel(f.type)}</span>
                <span style={meta}>{formatDateTime(f.updated_at)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                <Badge status={formaliteBadgeStatus(f.statut)} label={formaliteStatutLabel(f.statut)} />
                <div style={{ width: '160px' }}>
                  <Select
                    options={FORMALITE_STATUT_OPTIONS}
                    value={f.statut}
                    disabled={updatingId === f.id}
                    onChange={(e) => handleStatutChange(f, e.target.value)}
                  />
                </div>
                <HoverIconButton icon={trashIcon} label="Supprimer" danger disabled={removingId === f.id} onClick={() => handleRemove(f)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <FormaliteFormDrawer
        open={drawerOpen}
        saving={saving}
        onSave={handleAdd}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

const h3: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: 'var(--n-900)',
  margin: 0,
}

const emptyCard: CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  minHeight: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-3) var(--space-6)',
  textAlign: 'center',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  minHeight: '60px',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
}

const name: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const meta: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginLeft: 'var(--space-3)',
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}
