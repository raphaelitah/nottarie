import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../../lib/supabase'
import { Button, ConfirmModal, EditPenButton, EmptyState, HoverIconButton, NumberInput, SectionAddButton, Select, trashIcon } from '../../design-system'
import type { NaturePropriete, Personne } from '../../types/database'
import { personneDisplayName } from '../../personnes/personneForm'
import { NATURE_PROPRIETE_OPTIONS, TitulaireDePartsFormDrawer, naturePorprieteLabel, type TitulaireDePartsFormResult } from './TitulaireDePartsFormDrawer'

// Generic shape shared by immeuble_proprietaires (personne_id) and personne_morale_associes (titulaire_personne_id).
export interface TitulaireDeParts {
  id: string
  personne: Personne | null
  nomLibre: string | null
  naturePropriete: NaturePropriete
  quotePart: number | null
  nombreParts: number | null
}

interface TitulairesDePartsSectionProps {
  tenantId: string
  parentId: string
  titulaireTable: string
  parentIdColumn: string
  personneIdColumn: string
  parentTotalTable: string
  sectionTitle: string
  addButtonLabel: string
  drawerTitle: string
  emptyLabel: string
  itemLabelSingular: string
  nombrePartsTotal: number | null
  onNombrePartsTotalChange: (value: number | null) => void
  onSelectPersonne?: (id: string) => void
  excludePersonneId?: string
}

const EPSILON = 0.01

function toTitulaire(row: Record<string, unknown>): TitulaireDeParts {
  return {
    id: row.id as string,
    personne: (row.personne ?? row.titulaire_personne ?? null) as Personne | null,
    nomLibre: (row.nom_libre ?? null) as string | null,
    naturePropriete: (row.nature_propriete ?? 'pleine_propriete') as NaturePropriete,
    quotePart: (row.quote_part ?? null) as number | null,
    nombreParts: (row.nombre_parts ?? null) as number | null,
  }
}

function titulaireDisplayName(t: TitulaireDeParts): string {
  return t.personne ? personneDisplayName(t.personne) : (t.nomLibre ?? 'Sans nom')
}

export function TitulairesDePartsSection({
  tenantId, parentId, titulaireTable, parentIdColumn, personneIdColumn, parentTotalTable,
  sectionTitle, addButtonLabel, drawerTitle, emptyLabel, itemLabelSingular,
  nombrePartsTotal, onNombrePartsTotalChange, onSelectPersonne, excludePersonneId,
}: TitulairesDePartsSectionProps) {
  const [titulaires, setTitulaires] = useState<TitulaireDeParts[]>([])
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [removeTarget, setRemoveTarget] = useState<TitulaireDeParts | null>(null)
  const [editingPartsTotal, setEditingPartsTotal] = useState(false)
  const [partsTotalValue, setPartsTotalValue] = useState('')
  const [savingPartsTotal, setSavingPartsTotal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuotePart, setEditQuotePart] = useState('')
  const [editNombreParts, setEditNombreParts] = useState('')
  const [editNaturePropriete, setEditNaturePropriete] = useState<NaturePropriete>('pleine_propriete')
  const [savingEdit, setSavingEdit] = useState(false)

  const personneJoinAlias = personneIdColumn === 'titulaire_personne_id'
    ? `titulaire_personne:personnes!${titulaireTable}_titulaire_personne_id_fkey(*)`
    : 'personne:personnes(*)'

  function handleStartEditPartsTotal() {
    setPartsTotalValue(nombrePartsTotal != null ? String(nombrePartsTotal) : '')
    setEditingPartsTotal(true)
  }

  async function handleSavePartsTotal() {
    const value = partsTotalValue.trim() ? Number(partsTotalValue) : null
    setSavingPartsTotal(true)
    const { error } = await supabase.from(parentTotalTable).update({ nombre_parts_total: value }).eq('id', parentId)
    setSavingPartsTotal(false)
    if (error) { setError('Erreur lors de la mise à jour du nombre de parts total : ' + error.message); return }
    setEditingPartsTotal(false)
    onNombrePartsTotalChange(value)
  }

  async function loadTitulaires() {
    setLoading(true)
    const { data, error } = await supabase
      .from(titulaireTable)
      .select(`*, ${personneJoinAlias}`)
      .eq(parentIdColumn, parentId)
      .order('created_at')
    if (error) setError('Impossible de charger la liste : ' + error.message)
    else setError(null)
    setTitulaires(((data ?? []) as Record<string, unknown>[]).map((r) => toTitulaire(r)))
    setLoading(false)
  }

  async function loadPersonnes() {
    const { data } = await supabase.from('personnes').select('*').eq('tenant_id', tenantId).is('archived_at', null).order('created_at', { ascending: false })
    setPersonnes(((data ?? []) as Personne[]).filter((p) => p.id !== excludePersonneId))
  }

  useEffect(() => {
    loadTitulaires(); loadPersonnes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, parentId])

  async function handleAdd(result: TitulaireDePartsFormResult) {
    const newQuotePart = result.quotePart.trim() ? Number(result.quotePart) : null
    if (newQuotePart != null && totalQuotePart + newQuotePart > 100 + EPSILON) {
      setError(`Cette quote-part porterait le total à ${(totalQuotePart + newQuotePart).toFixed(2)}%, au-delà de 100%. Ajustez la répartition.`)
      return
    }
    setSaving(true)
    setError(null)
    const { error } = await supabase.from(titulaireTable).insert({
      tenant_id: tenantId,
      [parentIdColumn]: parentId,
      [personneIdColumn]: result.personneId,
      nom_libre: result.nomLibre,
      nature_propriete: result.naturePropriete,
      quote_part: newQuotePart,
      nombre_parts: result.nombreParts.trim() ? Number(result.nombreParts) : null,
    })
    setSaving(false)
    if (error) {
      setError(error.code === '23505'
        ? `Cette personne figure déjà dans les ${itemLabelSingular}s.`
        : "Erreur lors de l'ajout : " + error.message)
      return
    }
    setDrawerOpen(false)
    loadTitulaires()
  }

  const totalQuotePart = titulaires.reduce((sum, t) => sum + (t.quotePart ?? 0), 0)
  const totalExceeded = totalQuotePart > 100 + EPSILON

  function displayNombreParts(t: TitulaireDeParts): number | null {
    if (t.nombreParts != null) return t.nombreParts
    if (t.quotePart != null && nombrePartsTotal) return Math.round((t.quotePart / 100) * nombrePartsTotal)
    return null
  }

  function handleStartEdit(t: TitulaireDeParts) {
    setEditingId(t.id)
    setEditQuotePart(t.quotePart != null ? String(t.quotePart) : '')
    setEditNombreParts(t.nombreParts != null ? String(t.nombreParts) : (displayNombreParts(t) != null ? String(displayNombreParts(t)) : ''))
    setEditNaturePropriete(t.naturePropriete)
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

  async function handleSaveEdit(titulaire: TitulaireDeParts) {
    const newQuotePart = editQuotePart.trim() ? Number(editQuotePart) : null
    const otherTotal = totalQuotePart - (titulaire.quotePart ?? 0)
    if (newQuotePart != null && otherTotal + newQuotePart > 100 + EPSILON) {
      setError(`Cette quote-part porterait le total à ${(otherTotal + newQuotePart).toFixed(2)}%, au-delà de 100%. Ajustez la répartition.`)
      return
    }
    setSavingEdit(true)
    setError(null)
    const { error } = await supabase.from(titulaireTable).update({
      quote_part: newQuotePart,
      nombre_parts: editNombreParts.trim() ? Number(editNombreParts) : null,
      nature_propriete: editNaturePropriete,
    }).eq('id', titulaire.id)
    setSavingEdit(false)
    if (error) { setError('Erreur lors de la mise à jour : ' + error.message); return }
    setEditingId(null)
    loadTitulaires()
  }

  async function handleRemove(titulaire: TitulaireDeParts) {
    setRemovingId(titulaire.id)
    const { error } = await supabase.from(titulaireTable).delete().eq('id', titulaire.id)
    setRemovingId(null)
    setRemoveTarget(null)
    if (error) { setError('Erreur lors de la suppression : ' + error.message); return }
    loadTitulaires()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>{sectionTitle}</h3>
        <SectionAddButton label={addButtonLabel} onClick={() => setDrawerOpen(true)} />
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
      ) : titulaires.length === 0 ? (
        <EmptyState>{emptyLabel}</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {totalQuotePart > 0 && (
            <div style={{ ...totalBar, color: totalExceeded ? '#DC2626' : 'var(--text-muted)' }}>
              Total attribué : {totalQuotePart.toFixed(2).replace(/\.00$/, '')}%{totalExceeded && ' — dépasse 100%'}
            </div>
          )}
          {titulaires.map((t) => (
            <div
              key={t.id}
              style={{ ...row, cursor: !editingId && t.personne && onSelectPersonne ? 'pointer' : 'default' }}
              onClick={() => { if (!editingId && t.personne && onSelectPersonne) onSelectPersonne(t.personne.id) }}
            >
              {editingId === t.id ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-3)', width: '100%', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                  <span style={{ ...name, flex: 1, minWidth: '140px' }}>{titulaireDisplayName(t)}</span>
                  <div style={{ width: '170px' }}>
                    <Select
                      label="Nature de propriété"
                      value={editNaturePropriete}
                      options={NATURE_PROPRIETE_OPTIONS}
                      onChange={(e) => setEditNaturePropriete(e.target.value as NaturePropriete)}
                    />
                  </div>
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
                  <Button variant="primary" size="sm" disabled={savingEdit} onClick={() => handleSaveEdit(t)}>
                    {savingEdit ? '…' : 'Enregistrer'}
                  </Button>
                </div>
              ) : (
                <>
                  <div style={{ minWidth: 0 }}>
                    <span style={name}>{titulaireDisplayName(t)}</span>
                    <span style={quotePart}>{naturePorprieteLabel(t.naturePropriete)}</span>
                    {t.quotePart != null && (
                      <span style={quotePart}>
                        {t.quotePart}%{displayNombreParts(t) != null && ` (${displayNombreParts(t)} parts)`}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <EditPenButton label="Modifier" onClick={() => handleStartEdit(t)} />
                    <HoverIconButton icon={trashIcon} label="Retirer" disabled={removingId === t.id} onClick={() => setRemoveTarget(t)} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <TitulaireDePartsFormDrawer
        open={drawerOpen}
        title={drawerTitle}
        personnes={personnes}
        saving={saving}
        nombrePartsTotal={nombrePartsTotal}
        onSave={handleAdd}
        onClose={() => setDrawerOpen(false)}
      />

      <ConfirmModal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Retirer"
        subtitle={removeTarget ? titulaireDisplayName(removeTarget) : undefined}
        confirmLabel="Retirer"
        confirmingLabel="Retrait…"
        confirming={removingId === removeTarget?.id}
        onConfirm={() => removeTarget && handleRemove(removeTarget)}
      >
        Cette entrée sera retirée de la liste.
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
