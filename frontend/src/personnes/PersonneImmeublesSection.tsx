import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { EmptyState, SectionAddButton } from '../design-system'
import type { Immeuble, ImmeubleProprietaire } from '../types/database'
import { immeubleDisplayName, immeubleFormToInsertPayload, type ImmeubleFormValues } from '../immeubles/immeubleForm'
import { ImmeubleFormDrawer } from '../immeubles/ImmeubleFormDrawer'

interface PersonneImmeublesSectionProps {
  tenantId: string
  personneId: string
}

function formatValeur(v: number | null): string | null {
  return v != null ? `${v.toLocaleString('fr-FR')} €` : null
}

export function PersonneImmeublesSection({ tenantId, personneId }: PersonneImmeublesSectionProps) {
  const [proprietaires, setProprietaires] = useState<ImmeubleProprietaire[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Immeuble | null>(null)
  const [saving, setSaving] = useState(false)

  async function loadImmeubles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('immeuble_proprietaires')
      .select('*, immeuble:immeubles(*)')
      .eq('personne_id', personneId)
      .order('created_at')
    if (error) setError('Impossible de charger les immeubles : ' + error.message)
    else setError(null)
    setProprietaires((data ?? []).filter((p) => p.immeuble && !p.immeuble.archived_at))
    setLoading(false)
  }

  useEffect(() => {
    loadImmeubles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personneId])

  function openCreate() {
    setEditing(null)
    setDrawerOpen(true)
  }

  function openEdit(immeuble: Immeuble) {
    setEditing(immeuble)
    setDrawerOpen(true)
  }

  async function handleSave(values: ImmeubleFormValues) {
    setSaving(true)
    const payload = immeubleFormToInsertPayload(values, tenantId)
    if (editing) {
      const { error } = await supabase.from('immeubles').update(payload).eq('id', editing.id)
      setSaving(false)
      if (error) { setError("Erreur lors de l'enregistrement : " + error.message); return }
      setDrawerOpen(false)
      loadImmeubles()
      return
    }
    const { data, error } = await supabase.from('immeubles').insert(payload).select().single()
    if (error) { setSaving(false); setError("Erreur lors de la création de l'immeuble : " + error.message); return }
    const { error: linkError } = await supabase.from('immeuble_proprietaires').insert({
      tenant_id: tenantId,
      immeuble_id: data.id,
      personne_id: personneId,
    })
    setSaving(false)
    if (linkError) { setError("Erreur lors du rattachement du propriétaire : " + linkError.message); return }
    setDrawerOpen(false)
    loadImmeubles()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Immeubles</h3>
        <SectionAddButton label="Ajouter un immeuble" onClick={openCreate} />
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

      {loading ? (
        <EmptyState>Chargement…</EmptyState>
      ) : proprietaires.length === 0 ? (
        <EmptyState>Aucun immeuble rattaché à cette personne.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {proprietaires.map((p) => (
            <div key={p.id} style={row} onClick={() => openEdit(p.immeuble!)}>
              <div style={{ minWidth: 0 }}>
                <span style={name}>{immeubleDisplayName(p.immeuble!)}</span>
                {p.immeuble?.ville && <span style={meta}>{p.immeuble.ville}</span>}
                {p.quote_part != null && <span style={meta}>{p.quote_part}%</span>}
              </div>
              {formatValeur(p.immeuble?.valeur_declaree ?? null) && (
                <span style={valeur}>{formatValeur(p.immeuble!.valeur_declaree)}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <ImmeubleFormDrawer
        open={drawerOpen}
        tenantId={tenantId}
        immeuble={editing}
        saving={saving}
        onSave={handleSave}
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
  cursor: 'pointer',
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

const valeur: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  color: 'var(--n-900)',
  flexShrink: 0,
}
