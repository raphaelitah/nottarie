import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button, Input, Select } from '../../design-system'
import type { BaremeSousType, BaremeTranche } from '../../types/database'

export interface BaremeFormValues {
  libelle: string
  sous_type: BaremeSousType | ''
  source: string
  effective_date: string
  tva_taux_pct: string
  csi_taux_pct: string
  debours_estimation_defaut: string
  tranches: { jusqu_a: string; taux_pct: string }[]
}

const SOUS_TYPE_OPTIONS: { value: BaremeSousType; label: string }[] = [
  { value: 'acceptee', label: 'Acceptée' },
  { value: 'non_acceptee', label: 'Non acceptée' },
  { value: 'sur_acceptation', label: 'Sur acceptation' },
  { value: 'valeurs_mobilieres', label: 'Valeurs mobilières et sommes d’argent' },
]

const EMPTY: BaremeFormValues = {
  libelle: '',
  sous_type: '',
  source: '',
  effective_date: '',
  tva_taux_pct: '20',
  csi_taux_pct: '0.10',
  debours_estimation_defaut: '300',
  tranches: [
    { jusqu_a: '6500', taux_pct: '' },
    { jusqu_a: '17000', taux_pct: '' },
    { jusqu_a: '', taux_pct: '' },
  ],
}

interface BaremeFormDrawerProps {
  open: boolean
  typeActe: 'succession' | 'donation'
  saving: boolean
  onSave: (values: BaremeFormValues) => void
  onClose: () => void
}

export function BaremeFormDrawer({ open, typeActe, saving, onSave, onClose }: BaremeFormDrawerProps) {
  const [values, setValues] = useState<BaremeFormValues>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(EMPTY)
      setError(null)
    }
  }, [open])

  function set(patch: Partial<BaremeFormValues>) {
    setValues((v) => ({ ...v, ...patch }))
  }

  function setTranche(i: number, patch: Partial<BaremeFormValues['tranches'][number]>) {
    setValues((v) => ({ ...v, tranches: v.tranches.map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }))
  }

  function addTranche() {
    setValues((v) => ({ ...v, tranches: [...v.tranches, { jusqu_a: '', taux_pct: '' }] }))
  }

  function removeTranche(i: number) {
    setValues((v) => ({ ...v, tranches: v.tranches.filter((_, idx) => idx !== i) }))
  }

  function handleSubmit() {
    if (!values.libelle.trim()) { setError('Le libellé est obligatoire.'); return }
    if (typeActe === 'donation' && !values.sous_type) { setError('La nature de la donation est obligatoire.'); return }
    if (values.tranches.some((t) => !t.taux_pct.trim())) { setError('Chaque tranche doit avoir un taux.'); return }
    if (values.tranches.some((t, i) => i < values.tranches.length - 1 && !t.jusqu_a.trim())) {
      setError('Seule la dernière tranche peut être sans plafond.')
      return
    }
    setError(null)
    onSave(values)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Nouvelle version — ${typeActe === 'succession' ? 'Succession' : 'Donation'}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Créer cette version'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
            padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#DC2626',
          }}>{error}</div>
        )}

        <Input label="Libellé" required value={values.libelle} onChange={(e) => set({ libelle: e.target.value })} />

        {typeActe === 'donation' && (
          <Select
            label="Nature de la donation"
            required
            options={SOUS_TYPE_OPTIONS}
            value={values.sous_type}
            onChange={(e) => set({ sous_type: e.target.value as BaremeSousType })}
          />
        )}

        <Input label="Source (article, arrêté)" placeholder="ex. Code de commerce, Article A444-63" value={values.source} onChange={(e) => set({ source: e.target.value })} />
        <Input label="Date d'effet" type="date" value={values.effective_date} onChange={(e) => set({ effective_date: e.target.value })} />

        <div style={grid3}>
          <Input label="TVA (%)" type="number" value={values.tva_taux_pct} onChange={(e) => set({ tva_taux_pct: e.target.value })} />
          <Input label="CSI (%)" type="number" value={values.csi_taux_pct} onChange={(e) => set({ csi_taux_pct: e.target.value })} />
          <Input label="Débours estimés (€)" type="number" value={values.debours_estimation_defaut} onChange={(e) => set({ debours_estimation_defaut: e.target.value })} />
        </div>

        <div>
          <div style={sectionLabel}>Tranches</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {values.tranches.map((t, i) => {
              const isLast = i === values.tranches.length - 1
              return (
                <div key={i} style={trancheRow}>
                  <Input
                    placeholder={isLast ? 'Illimité' : 'Jusqu\'à (€)'}
                    type="number"
                    disabled={isLast}
                    value={isLast ? '' : t.jusqu_a}
                    onChange={(e) => setTranche(i, { jusqu_a: e.target.value })}
                  />
                  <Input
                    placeholder="Taux (%)"
                    type="number"
                    value={t.taux_pct}
                    onChange={(e) => setTranche(i, { taux_pct: e.target.value })}
                  />
                  <Button variant="ghost" size="sm" disabled={values.tranches.length <= 1} onClick={() => removeTranche(i)}>✕</Button>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: '10px' }}>
            <Button variant="secondary" size="sm" onClick={addTranche}>+ Ajouter une tranche</Button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}

export function baremeFormToTranches(values: BaremeFormValues): BaremeTranche[] {
  return values.tranches.map((t, i) => ({
    jusqu_a: i === values.tranches.length - 1 ? null : Number(t.jusqu_a),
    taux: Number(t.taux_pct) / 100,
  }))
}

const grid3: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '16px',
}

const trancheRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr auto',
  gap: '10px',
  alignItems: 'end',
}

const sectionLabel: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-3)',
}
