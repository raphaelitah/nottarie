import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../design-system'
import type { DossierImmeuble, Immeuble } from '../types/database'
import { immeubleDisplayName, immeubleFormToInsertPayload } from '../immeubles/immeubleForm'
import { regimeBienLabel } from '../constants/regimeBien'
import { typeBienLabel } from '../constants/typeBien'
import { ImmeubleAttachDrawer, type ImmeubleAttachResult } from './ImmeubleAttachDrawer'

interface ImmeublesSectionProps {
  tenantId: string
  dossierId: string
}

export function ImmeublesSection({ tenantId, dossierId }: ImmeublesSectionProps) {
  const [links, setLinks] = useState<DossierImmeuble[]>([])
  const [immeubles, setImmeubles] = useState<Immeuble[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function loadLinks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('dossier_immeubles')
      .select('*, immeuble:immeubles(*)')
      .eq('dossier_id', dossierId)
    if (error) setError('Impossible de charger les immeubles : ' + error.message)
    else setError(null)
    setLinks(data ?? [])
    setLoading(false)
  }

  async function loadImmeubles() {
    const { data } = await supabase.from('immeubles').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    setImmeubles(data ?? [])
  }

  useEffect(() => {
    loadLinks(); loadImmeubles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, dossierId])

  async function handleAttach(result: ImmeubleAttachResult) {
    setSaving(true)
    setError(null)

    let immeubleId = result.immeubleId
    if (!immeubleId && result.newImmeuble) {
      const { data, error } = await supabase
        .from('immeubles')
        .insert(immeubleFormToInsertPayload(result.newImmeuble, tenantId))
        .select()
        .single()
      if (error) { setSaving(false); setError("Erreur lors de la création de l'immeuble : " + error.message); return }
      immeubleId = data.id
    }

    const { error } = await supabase.from('dossier_immeubles').insert({
      tenant_id: tenantId,
      dossier_id: dossierId,
      immeuble_id: immeubleId,
    })
    setSaving(false)
    if (error) { setError("Erreur lors de l'attachement : " + error.message); return }
    setDrawerOpen(false)
    loadLinks()
    loadImmeubles()
  }

  async function handleDetach(link: DossierImmeuble) {
    setRemovingId(link.id)
    const { error } = await supabase.from('dossier_immeubles').delete().eq('id', link.id)
    setRemovingId(null)
    if (error) { setError('Erreur lors du détachement : ' + error.message); return }
    loadLinks()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Immeubles</h3>
        <Button variant="primary" size="sm" onClick={() => setDrawerOpen(true)}>+ Attacher un immeuble</Button>
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
      ) : links.length === 0 ? (
        <div style={emptyCard}>Aucun immeuble rattaché à ce dossier.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {links.map((l) => (
            <div key={l.id} style={row}>
              <div style={{ minWidth: 0 }}>
                <span style={name}>{l.immeuble ? immeubleDisplayName(l.immeuble) : 'Immeuble inconnu'}</span>
                {l.immeuble?.type_bien && <span style={meta}>{typeBienLabel(l.immeuble.type_bien)}</span>}
                {l.immeuble?.regime && <span style={meta}>{regimeBienLabel(l.immeuble.regime)}</span>}
              </div>
              <Button variant="ghost" size="sm" disabled={removingId === l.id} onClick={() => handleDetach(l)}>
                {removingId === l.id ? '…' : 'Détacher'}
              </Button>
            </div>
          ))}
        </div>
      )}

      <ImmeubleAttachDrawer
        open={drawerOpen}
        immeubles={immeubles}
        attachedIds={links.map((l) => l.immeuble_id)}
        saving={saving}
        onSave={handleAttach}
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
