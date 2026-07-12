import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button, ConfirmModal, EditPenButton, EmptyState, HoverIconButton, NumberInput, SectionAddButton, trashIcon } from '../design-system'
import type { ImmeubleProprietaire, Personne } from '../types/database'
import { personneDisplayName } from '../personnes/personneForm'
import { ImmeubleProprietaireFormDrawer, type ImmeubleProprietaireFormResult } from './ImmeubleProprietaireFormDrawer'

interface ImmeubleProprietairesSectionProps {
  tenantId: string
  immeubleId: string
  nombrePartsTotal: number | null
  onNombrePartsTotalChange: (value: number | null) => void
  onSelectPersonne?: (id: string) => void
}

const EPSILON = 0.01

function proprietaireDisplayName(p: ImmeubleProprietaire): string {
  return p.personne ? personneDisplayName(p.personne) : (p.nom_libre ?? 'Propriétaire sans nom')
}

export function ImmeubleProprietairesSection({ tenantId, immeubleId, nombrePartsTotal, onNombrePartsTotalChange, onSelectPersonne }: ImmeubleProprietairesSectionProps) {
  const [proprietaires, setProprietaires] = useState<ImmeubleProprietaire[]>([])
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<ImmeubleProprietaire | null>(null)
  const [editingPartsTotal, setEditingPartsTotal] = useState(false)
  const [partsTotalValue, setPartsTotalValue] = useState('')
  const [savingPartsTotal, setSavingPartsTotal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuotePart, setEditQuotePart] = useState('')
  const [editNombreParts, setEditNombreParts] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  function handleStartEditPartsTotal() {
    setPartsTotalValue(nombrePartsTotal != null ? String(nombrePartsTotal) : '')
    setEditingPartsTotal(true)
  }

  async function handleSavePartsTotal() {
    const value = partsTotalValue.trim() ? Number(partsTotalValue) : null
    setSavingPartsTotal(true)
    const { error } = await supabase.from('immeubles').update({ nombre_parts_total: value }).eq('id', immeubleId)
    setSavingPartsTotal(false)
    if (error) { setError('Erreur lors de la mise à jour du nombre de parts total : ' + error.message); return }
    setEditingPartsTotal(false)
    onNombrePartsTotalChange(value)
  }

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

  function displayNombreParts(p: ImmeubleProprietaire): number | null {
    if (p.nombre_parts != null) return p.nombre_parts
    if (p.quote_part != null && nombrePartsTotal) return Math.round((p.quote_part / 100) * nombrePartsTotal)
    return null
  }

  function handleStartEdit(p: ImmeubleProprietaire) {
    setEditingId(p.id)
    setEditQuotePart(p.quote_part != null ? String(p.quote_part) : '')
    setEditNombreParts(p.nombre_parts != null ? String(p.nombre_parts) : (displayNombreParts(p) != null ? String(displayNombreParts(p)) : ''))
  }

  function handleEditQuotePartChange(value: string) {
    setEditQuotePart(value)
    if (nombrePartsTotal && value.trim()) {
      setEditNombreParts(String(Math.round((Number(value) / 100) * nombrePartsTotal)))
    } else if (!value.trim()) {
      setEditNombreParts('')
    }
  }

  function handleEditNombrePartsChange(value: string) {
    setEditNombreParts(value)
    if (nombrePartsTotal && value.trim()) {
      setEditQuotePart((Number(value) / nombrePartsTotal * 100).toFixed(2).replace(/\.?0+$/, ''))
    } else if (!value.trim()) {
      setEditQuotePart('')
    }
  }

  async function handleSaveEdit(proprietaire: ImmeubleProprietaire) {
    const newQuotePart = editQuotePart.trim() ? Number(editQuotePart) : null
    const otherTotal = totalQuotePart - (proprietaire.quote_part ?? 0)
    if (newQuotePart != null && otherTotal + newQuotePart > 100 + EPSILON) {
      setError(`Cette quote-part porterait le total à ${(otherTotal + newQuotePart).toFixed(2)}%, au-delà de 100%. Ajustez la répartition.`)
      return
    }
    setSavingEdit(true)
    setError(null)
    const { error } = await supabase.from('immeuble_proprietaires').update({
      quote_part: newQuotePart,
      nombre_parts: editNombreParts.trim() ? Number(editNombreParts) : null,
    }).eq('id', proprietaire.id)
    setSavingEdit(false)
    if (error) { setError('Erreur lors de la mise à jour du propriétaire : ' + error.message); return }
    setEditingId(null)
    loadProprietaires()
  }

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

      <div style={partsTotalBar}>
        {editingPartsTotal ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
            <div style={{ width: '160px' }}>
              <NumberInput
                label="Nombre de parts total"
                placeholder="ex. 100"
                value={partsTotalValue}
                onChange={(e) => setPartsTotalValue(e.target.value)}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={() => setEditingPartsTotal(false)}>Annuler</Button>
            <Button variant="primary" size="sm" disabled={savingPartsTotal} onClick={handleSavePartsTotal}>
              {savingPartsTotal ? '…' : 'Enregistrer'}
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={partsTotalLabel}>
              Nombre de parts total : {nombrePartsTotal ?? '—'}
            </span>
            <EditPenButton label="Modifier le nombre de parts total" onClick={handleStartEditPartsTotal} />
          </div>
        )}
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
              style={{ ...row, cursor: !editingId && p.personne && onSelectPersonne ? 'pointer' : 'default' }}
              onClick={() => { if (!editingId && p.personne && onSelectPersonne) onSelectPersonne(p.personne.id) }}
            >
              {editingId === p.id ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                  <span style={{ ...name, flex: 1, minWidth: 0 }}>{proprietaireDisplayName(p)}</span>
                  <div style={{ width: '120px' }}>
                    <NumberInput
                      label="Quote-part (%)"
                      value={editQuotePart}
                      onChange={(e) => handleEditQuotePartChange(e.target.value)}
                    />
                  </div>
                  <div style={{ width: '120px' }}>
                    <NumberInput
                      label="Nombre de parts"
                      placeholder={nombrePartsTotal ? `sur ${nombrePartsTotal}` : 'ex. 50'}
                      disabled={!nombrePartsTotal}
                      value={editNombreParts}
                      onChange={(e) => handleEditNombrePartsChange(e.target.value)}
                    />
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>Annuler</Button>
                  <Button variant="primary" size="sm" disabled={savingEdit} onClick={() => handleSaveEdit(p)}>
                    {savingEdit ? '…' : 'Enregistrer'}
                  </Button>
                </div>
              ) : (
                <>
                  <div style={{ minWidth: 0 }}>
                    <span style={name}>{proprietaireDisplayName(p)}</span>
                    {p.quote_part != null && (
                      <span style={quotePart}>
                        {p.quote_part}%{displayNombreParts(p) != null && ` (${displayNombreParts(p)} parts)`}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <EditPenButton label="Modifier" onClick={() => handleStartEdit(p)} />
                    <HoverIconButton icon={trashIcon} label="Retirer" disabled={removingId === p.id} onClick={() => setRemoveTarget(p)} />
                  </div>
                </>
              )}
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

const partsTotalBar: CSSProperties = {
  marginBottom: 'var(--space-4)',
}

const partsTotalLabel: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  color: 'var(--n-700)',
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
