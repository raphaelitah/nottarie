import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { ConfirmModal, EmptyState, HoverIconButton, SectionAddButton, trashIcon } from '../design-system'
import type { ImmeubleProprietaire, Personne } from '../types/database'
import { personneDisplayName } from '../personnes/personneForm'
import { ImmeubleProprietaireFormDrawer, type ImmeubleProprietaireFormResult } from './ImmeubleProprietaireFormDrawer'

interface ImmeubleProprietairesSectionProps {
  tenantId: string
  immeubleId: string
  nombrePartsTotal: number | null
  onSelectPersonne?: (id: string) => void
}

const EPSILON = 0.01

function proprietaireDisplayName(p: ImmeubleProprietaire): string {
  return p.personne ? personneDisplayName(p.personne) : (p.nom_libre ?? 'Propriétaire sans nom')
}

export function ImmeubleProprietairesSection({ tenantId, immeubleId, nombrePartsTotal, onSelectPersonne }: ImmeubleProprietairesSectionProps) {
  const [proprietaires, setProprietaires] = useState<ImmeubleProprietaire[]>([])
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<ImmeubleProprietaire | null>(null)

  async function loadProprietaires() {
    setLoading(true)
    const { data, error } = await supabase
      .from('immeuble_proprietaires')
      .select('*, personne:personnes(*)')
      .eq('immeuble_id', immeubleId)
      .order('created_at')
    if (error) setError('Impossible de charger les propriétaires : ' + error.message)
    else setError(null)
    setProprietaires(data ?? [])
    setLoading(false)
  }

  async function loadPersonnes() {
    const { data } = await supabase.from('personnes').select('*').eq('tenant_id', tenantId).is('archived_at', null).order('created_at', { ascending: false })
    setPersonnes(data ?? [])
  }

  useEffect(() => {
    loadProprietaires(); loadPersonnes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, immeubleId])

  async function handleAdd(result: ImmeubleProprietaireFormResult) {
    const newQuotePart = result.quotePart.trim() ? Number(result.quotePart) : null
    if (newQuotePart != null && totalQuotePart + newQuotePart > 100 + EPSILON) {
      setError(`Cette quote-part porterait le total à ${(totalQuotePart + newQuotePart).toFixed(2)}%, au-delà de 100%. Ajustez la répartition.`)
      return
    }
    setSaving(true)
    setError(null)
    const { error } = await supabase.from('immeuble_proprietaires').insert({
      tenant_id: tenantId,
      immeuble_id: immeubleId,
      personne_id: result.personneId,
      nom_libre: result.nomLibre,
      quote_part: newQuotePart,
      nombre_parts: result.nombreParts.trim() ? Number(result.nombreParts) : null,
    })
    setSaving(false)
    if (error) {
      setError(error.code === '23505'
        ? 'Cette personne est déjà propriétaire de ce bien.'
        : "Erreur lors de l'ajout du propriétaire : " + error.message)
      return
    }
    setDrawerOpen(false)
    loadProprietaires()
  }

  const totalQuotePart = proprietaires.reduce((sum, p) => sum + (p.quote_part ?? 0), 0)
  const totalExceeded = totalQuotePart > 100 + EPSILON

  async function handleRemove(proprietaire: ImmeubleProprietaire) {
    setRemovingId(proprietaire.id)
    const { error } = await supabase.from('immeuble_proprietaires').delete().eq('id', proprietaire.id)
    setRemovingId(null)
    setRemoveTarget(null)
    if (error) { setError('Erreur lors de la suppression : ' + error.message); return }
    loadProprietaires()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Propriétaires</h3>
        <SectionAddButton label="Ajouter un propriétaire" onClick={() => setDrawerOpen(true)} />
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
        <EmptyState>Aucun propriétaire rattaché à ce bien.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {totalQuotePart > 0 && (
            <div style={{ ...totalBar, color: totalExceeded ? '#DC2626' : 'var(--text-muted)' }}>
              Total attribué : {totalQuotePart.toFixed(2).replace(/\.00$/, '')}%{totalExceeded && ' — dépasse 100%'}
            </div>
          )}
          {proprietaires.map((p) => (
            <div
              key={p.id}
              style={{ ...row, cursor: p.personne && onSelectPersonne ? 'pointer' : 'default' }}
              onClick={() => { if (p.personne && onSelectPersonne) onSelectPersonne(p.personne.id) }}
            >
              <div style={{ minWidth: 0 }}>
                <span style={name}>{proprietaireDisplayName(p)}</span>
                {p.quote_part != null && (
                  <span style={quotePart}>
                    {p.quote_part}%{p.nombre_parts != null && ` (${p.nombre_parts} parts)`}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                <HoverIconButton icon={trashIcon} label="Retirer" disabled={removingId === p.id} onClick={() => setRemoveTarget(p)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <ImmeubleProprietaireFormDrawer
        open={drawerOpen}
        personnes={personnes}
        saving={saving}
        nombrePartsTotal={nombrePartsTotal}
        onSave={handleAdd}
        onClose={() => setDrawerOpen(false)}
      />

      <ConfirmModal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Retirer le propriétaire"
        subtitle={removeTarget ? proprietaireDisplayName(removeTarget) : undefined}
        confirmLabel="Retirer"
        confirmingLabel="Retrait…"
        confirming={removingId === removeTarget?.id}
        onConfirm={() => removeTarget && handleRemove(removeTarget)}
      >
        Cette personne ne sera plus propriétaire de ce bien.
      </ConfirmModal>
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
}

const name: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const totalBar: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  padding: '0 var(--space-1)',
  marginBottom: 'var(--space-1)',
}

const quotePart: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginLeft: 'var(--space-3)',
}
