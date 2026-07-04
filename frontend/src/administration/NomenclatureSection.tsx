import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, EditPenButton, Input } from '../design-system'
import type { Etude } from '../types/database'

function formatPreview(format: string, date: Date, compteur: number): string {
  let result = format.replace('YYYY', String(date.getFullYear()))
  result = result.replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
  const match = result.match(/X+/)
  if (match) {
    result = result.replace(match[0], String(compteur).padStart(match[0].length, '0'))
  }
  return result
}

export function NomenclatureSection({ etude, onUpdated }: { etude: Etude; onUpdated: (etude: Etude) => void }) {
  const [editing, setEditing] = useState(false)
  const [format, setFormat] = useState(etude.dossier_numero_format)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCounter, setNextCounter] = useState(1)

  useEffect(() => {
    const annee = new Date().getFullYear()
    supabase
      .from('dossier_numero_compteurs')
      .select('compteur')
      .eq('tenant_id', etude.id)
      .eq('annee', annee)
      .maybeSingle()
      .then(({ data }) => setNextCounter((data?.compteur ?? 0) + 1))
  }, [etude.id])

  function startEdit() {
    setFormat(etude.dossier_numero_format)
    setError(null)
    setEditing(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = format.trim()
    if (!trimmed) { setError('Le format est obligatoire.'); return }
    if (!/X/.test(trimmed)) { setError('Le format doit contenir au moins un X pour le numéro séquentiel (ex. XXXX).'); return }
    setSaving(true)
    const { data, error } = await supabase.from('etudes').update({ dossier_numero_format: trimmed }).eq('id', etude.id).select().single()
    setSaving(false)
    if (error) { setError('Erreur lors de la mise à jour : ' + error.message); return }
    setEditing(false)
    onUpdated(data)
  }

  const currentPreview = formatPreview(etude.dossier_numero_format, new Date(), nextCounter)
  const draftPreview = /X/.test(format) ? formatPreview(format, new Date(), nextCounter) : null

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <div style={sectionLabel}>Nomenclature de dossiers</div>
        {!editing && <EditPenButton label="Modifier la nomenclature de dossiers" onClick={startEdit} />}
      </div>
      <p style={helpText}>
        Détermine le format des numéros de dossier, attribués automatiquement à la création. Utilisez <code>YYYY</code> pour l'année,
        {' '}<code>MM</code> pour le mois, et une suite de <code>X</code> pour le numéro séquentiel (le nombre de X fixe le nombre de chiffres).
        Ce compteur repart à 1 chaque année.
      </p>

      {error && <div style={alertStyle}>{error}</div>}

      {editing ? (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
          <div>
            <label style={labelStyle}>Format</label>
            <Input placeholder="ex. YYYY-MM-XXXX" value={format} onChange={e => setFormat(e.target.value)} />
          </div>
          {draftPreview && (
            <div style={previewBox}>Exemple avec ce format : <strong>{draftPreview}</strong></div>
          )}
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>Annuler</Button>
          </div>
        </form>
      ) : (
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div>
            <label style={labelStyle}>Format actuel</label>
            <div style={valueStyle}>{etude.dossier_numero_format}</div>
          </div>
          <div style={previewBox}>Prochain numéro : <strong>{currentPreview}</strong></div>
        </div>
      )}
    </div>
  )
}

const card: React.CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
  boxShadow: 'var(--shadow-sm)',
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
}

const helpText: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  lineHeight: 'var(--leading-normal)',
  margin: 0,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--n-700)',
  marginBottom: 'var(--space-1)',
}

const valueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
}

const previewBox: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-700)',
  background: 'var(--n-100)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)',
}

const alertStyle: React.CSSProperties = {
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)',
  marginTop: 'var(--space-4)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: '#DC2626',
}
