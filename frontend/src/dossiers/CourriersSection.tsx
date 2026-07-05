import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../design-system'
import { Modal } from '../design-system/Modal'
import type { Courrier } from '../types/database'
import { CourrierFormDrawer, type CourrierFormResult } from './CourrierFormDrawer'

interface CourriersSectionProps {
  tenantId: string
  dossierId: string
}

export function CourriersSection({ tenantId, dossierId }: CourriersSectionProps) {
  const [courriers, setCourriers] = useState<Courrier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [viewing, setViewing] = useState<Courrier | null>(null)

  async function loadCourriers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('courriers')
      .select('*')
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les courriers : ' + error.message)
    else setError(null)
    setCourriers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadCourriers() }, [dossierId])

  async function handleAdd(result: CourrierFormResult) {
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('courriers').insert({
      tenant_id: tenantId,
      dossier_id: dossierId,
      objet: result.objet,
      contenu: result.contenu || null,
    })
    setSaving(false)
    if (error) { setError("Erreur lors de l'enregistrement du courrier : " + error.message); return }
    setDrawerOpen(false)
    loadCourriers()
  }

  async function handleRemove(courrier: Courrier) {
    setRemovingId(courrier.id)
    const { error } = await supabase.from('courriers').delete().eq('id', courrier.id)
    setRemovingId(null)
    if (error) { setError('Erreur lors de la suppression : ' + error.message); return }
    loadCourriers()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Courriers</h3>
        <Button variant="primary" size="sm" onClick={() => setDrawerOpen(true)}>+ Nouveau courrier</Button>
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
      ) : courriers.length === 0 ? (
        <div style={emptyCard}>Aucun courrier pour ce dossier.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {courriers.map((c) => (
            <div key={c.id} style={row}>
              <div style={{ minWidth: 0 }}>
                <span style={name}>{c.objet || 'Sans objet'}</span>
                <span style={meta}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                <Button variant="ghost" size="sm" onClick={() => setViewing(c)}>Voir</Button>
                <Button variant="ghost" size="sm" disabled={removingId === c.id} onClick={() => handleRemove(c)}>
                  {removingId === c.id ? '…' : 'Supprimer'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CourrierFormDrawer
        open={drawerOpen}
        saving={saving}
        onSave={handleAdd}
        onClose={() => setDrawerOpen(false)}
      />

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing?.objet || 'Courrier'}
        subtitle={viewing ? new Date(viewing.created_at).toLocaleDateString('fr-FR') : undefined}
        size="lg"
        footer={<Button variant="secondary" size="sm" onClick={() => setViewing(null)}>Fermer</Button>}
      >
        <div style={{ whiteSpace: 'pre-wrap' }}>{viewing?.contenu || 'Aucun contenu.'}</div>
      </Modal>
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
  padding: 'var(--space-6)',
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
