import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button, EmptyState, NumberInput, Select } from '../design-system'
import type { Bareme, BaremeSousType, Dossier } from '../types/database'
import { computeCout } from '../lib/bareme/computeCout'

interface CoutEstimationSectionProps {
  dossier: Dossier
  onUpdated: (dossier: Dossier) => void
}

const SOUS_TYPE_OPTIONS: { value: BaremeSousType; label: string }[] = [
  { value: 'acceptee', label: 'Donation acceptée' },
  { value: 'non_acceptee', label: 'Donation non acceptée' },
  { value: 'sur_acceptation', label: "Sur acceptation d'une donation antérieure" },
  { value: 'valeurs_mobilieres', label: 'Valeurs mobilières et sommes d’argent uniquement' },
]

const EUR = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export function CoutEstimationSection({ dossier, onUpdated }: CoutEstimationSectionProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [sousType, setSousType] = useState<BaremeSousType>('acceptee')
  const [bareme, setBareme] = useState<Bareme | null>(null)

  const [immeubleTotal, setImmeubleTotal] = useState('0')
  const [autresActifs, setAutresActifs] = useState('')
  const [passif, setPassif] = useState('')

  useEffect(() => {
    setAutresActifs(dossier.autres_actifs != null ? String(dossier.autres_actifs) : '')
    setPassif(dossier.passif != null ? String(dossier.passif) : '')
  }, [dossier.autres_actifs, dossier.passif])

  // Runs once per dossier — deliberately excludes sousType so switching the
  // donation variant below doesn't clobber a manually-edited immeuble total.
  useEffect(() => {
    let cancelled = false
    async function loadImmeubleTotal() {
      const { data: links, error: linksError } = await supabase
        .from('dossier_immeubles')
        .select('immeuble:immeubles(valeur_declaree)')
        .eq('dossier_id', dossier.id)
      if (linksError) { if (!cancelled) setError('Impossible de charger les immeubles : ' + linksError.message); return }
      const sum = (links ?? []).reduce((acc, l) => {
        const immeuble = (l as unknown as { immeuble: { valeur_declaree: number | null } | null }).immeuble
        return acc + (immeuble?.valeur_declaree ?? 0)
      }, 0)
      if (!cancelled) setImmeubleTotal(String(sum))
    }
    loadImmeubleTotal()
    return () => { cancelled = true }
  }, [dossier.id])

  useEffect(() => {
    let cancelled = false
    async function loadBareme() {
      setLoading(true)
      setError(null)

      let baremeQuery = supabase
        .from('baremes')
        .select('*')
        .eq('type_acte', dossier.type_acte)
        .order('version', { ascending: false })
        .limit(1)
      if (dossier.type_acte === 'donation') baremeQuery = baremeQuery.eq('sous_type', sousType)
      const { data: baremeRows, error: baremeError } = await baremeQuery
      if (baremeError) { if (!cancelled) { setError('Impossible de charger le barème : ' + baremeError.message); setLoading(false) }; return }

      if (!cancelled) {
        setBareme(baremeRows?.[0] ?? null)
        setLoading(false)
      }
    }
    loadBareme()
    return () => { cancelled = true }
  }, [dossier.type_acte, sousType])

  const breakdown = useMemo(() => {
    if (!bareme) return null
    return computeCout(bareme.bareme, {
      immeubles: Number(immeubleTotal) || 0,
      autresActifs: Number(autresActifs) || 0,
      passif: dossier.type_acte === 'succession' ? Number(passif) || 0 : 0,
    })
  }, [bareme, immeubleTotal, autresActifs, passif, dossier.type_acte])

  async function handleSaveActifs() {
    setSaving(true)
    setError(null)
    const payload = {
      autres_actifs: autresActifs.trim() ? Number(autresActifs) : null,
      passif: dossier.type_acte === 'succession' && passif.trim() ? Number(passif) : null,
    }
    const { data, error } = await supabase.from('dossiers').update(payload).eq('id', dossier.id).select().single()
    setSaving(false)
    if (error) { setError("Erreur lors de l'enregistrement : " + error.message); return }
    onUpdated(data)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Estimation des frais</h3>
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
      ) : !bareme ? (
        <EmptyState>Aucun barème disponible pour ce type d'acte.</EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {dossier.type_acte === 'donation' && (
            <Select
              label="Nature de la donation"
              options={SOUS_TYPE_OPTIONS}
              value={sousType}
              onChange={(e) => setSousType(e.target.value as BaremeSousType)}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: dossier.type_acte === 'succession' ? '1fr 1fr' : '1fr', gap: 'var(--space-4)' }}>
            <NumberInput
              label="Valeur des immeubles rattachés (€)"
              value={immeubleTotal}
              onChange={(e) => setImmeubleTotal(e.target.value)}
              helper="Somme des valeurs déclarées des immeubles attachés au dossier — ajustable ici."
            />
            <NumberInput
              label="Autres actifs (€)"
              placeholder="ex. comptes, meubles, parts sociales…"
              value={autresActifs}
              onChange={(e) => setAutresActifs(e.target.value)}
            />
            {dossier.type_acte === 'succession' && (
              <NumberInput
                label="Passif déductible (€)"
                value={passif}
                onChange={(e) => setPassif(e.target.value)}
              />
            )}
          </div>

          <div>
            <Button variant="ghost" size="sm" disabled={saving} onClick={handleSaveActifs}>
              {saving ? 'Enregistrement…' : 'Enregistrer les actifs/passif sur le dossier'}
            </Button>
          </div>

          {breakdown && (
            <div style={breakdownCard}>
              <BreakdownRow label="Émoluments HT" value={breakdown.emolumentsHt} />
              <BreakdownRow label={`TVA (${(bareme.bareme.tva_taux * 100).toFixed(0)} %)`} value={breakdown.tva} />
              {breakdown.csi > 0 && <BreakdownRow label="Contribution de sécurité immobilière" value={breakdown.csi} />}
              <BreakdownRow label="Débours estimés" value={breakdown.debours} note="estimation" />
              <div style={totalRow}>
                <span>Total estimé</span>
                <span>{EUR.format(breakdown.total)}</span>
              </div>
            </div>
          )}

          <p style={caption}>
            Émoluments du notaire uniquement — hors droits de mutation à titre gratuit (succession/donation), à calculer séparément. Source : {bareme.bareme.source}, en vigueur au {bareme.bareme.effective_date}. Débours forfaitisés à titre indicatif.
          </p>
        </div>
      )}
    </div>
  )
}

function BreakdownRow({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div style={row}>
      <span style={rowLabel}>{label}{note && <span style={rowNote}> ({note})</span>}</span>
      <span style={rowValue}>{EUR.format(value)}</span>
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

const breakdownCard: CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4) var(--space-5)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-2)',
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-700)',
}

const rowLabel: CSSProperties = {}

const rowNote: CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 'var(--text-xs)',
}

const rowValue: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
}

const totalRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 'var(--space-2)',
  paddingTop: 'var(--space-3)',
  borderTop: '1px solid var(--border-default)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-lg)',
  fontWeight: 700,
  color: 'var(--n-900)',
}

const caption: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  margin: 0,
}
