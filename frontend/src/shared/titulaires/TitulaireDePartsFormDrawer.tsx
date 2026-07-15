import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button, Input, NumberInput, Select } from '../../design-system'
import type { NaturePropriete, Personne } from '../../types/database'
import { personneDisplayName } from '../../personnes/personneForm'

export const NATURE_PROPRIETE_OPTIONS: { value: NaturePropriete; label: string }[] = [
  { value: 'pleine_propriete', label: 'Pleine propriété' },
  { value: 'usufruit', label: 'Usufruit' },
  { value: 'nue_propriete', label: 'Nue-propriété' },
]

export function naturePorprieteLabel(value: NaturePropriete): string {
  return NATURE_PROPRIETE_OPTIONS.find((o) => o.value === value)?.label ?? value
}

export interface TitulaireDePartsFormResult {
  personneId: string | null
  nomLibre: string | null
  naturePropriete: NaturePropriete
  quotePart: string
  nombreParts: string
}

interface TitulaireDePartsFormDrawerProps {
  open: boolean
  title: string
  personnes: Personne[]
  saving: boolean
  nombrePartsTotal: number | null
  onSave: (result: TitulaireDePartsFormResult) => void
  onClose: () => void
}

export function TitulaireDePartsFormDrawer({ open, title, personnes, saving, nombrePartsTotal, onSave, onClose }: TitulaireDePartsFormDrawerProps) {
  const [mode, setMode] = useState<'existante' | 'libre'>('existante')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [nomLibre, setNomLibre] = useState('')
  const [naturePropriete, setNaturePropriete] = useState<NaturePropriete>('pleine_propriete')
  const [quotePart, setQuotePart] = useState('')
  const [nombreParts, setNombreParts] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setMode('existante')
    setSearch('')
    setSelectedId(null)
    setNomLibre('')
    setNaturePropriete('pleine_propriete')
    setQuotePart('')
    setNombreParts('')
    setError(null)
  }, [open])

  const query = search.trim().toLowerCase()
  const results = query
    ? personnes.filter((p) => personneDisplayName(p).toLowerCase().includes(query)).slice(0, 8)
    : []
  const selected = personnes.find((p) => p.id === selectedId) ?? null

  function handleQuotePartChange(value: string) {
    setQuotePart(value)
    if (nombrePartsTotal && value.trim()) {
      setNombreParts(String(Math.round((Number(value) / 100) * nombrePartsTotal)))
    } else if (!value.trim()) {
      setNombreParts('')
    }
  }

  function handleNombrePartsChange(value: string) {
    setNombreParts(value)
    if (nombrePartsTotal && value.trim()) {
      setQuotePart((Number(value) / nombrePartsTotal * 100).toFixed(2).replace(/\.?0+$/, ''))
    } else if (!value.trim()) {
      setQuotePart('')
    }
  }

  function handleSubmit() {
    if (mode === 'existante') {
      if (!selectedId) { setError('Sélectionnez une personne.'); return }
      setError(null)
      onSave({ personneId: selectedId, nomLibre: null, naturePropriete, quotePart, nombreParts })
    } else {
      if (!nomLibre.trim()) { setError('Le nom est obligatoire.'); return }
      setError(null)
      onSave({ personneId: null, nomLibre: nomLibre.trim(), naturePropriete, quotePart, nombreParts })
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Ajout…' : 'Ajouter'}
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

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant={mode === 'existante' ? 'primary' : 'secondary'} size="sm" onClick={() => { setMode('existante'); setError(null) }}>
            Personne existante
          </Button>
          <Button variant={mode === 'libre' ? 'primary' : 'secondary'} size="sm" onClick={() => { setMode('libre'); setError(null) }}>
            Personne hors base
          </Button>
        </div>

        {mode === 'existante' ? (
          selected ? (
            <div style={selectedCard}>
              <span>{personneDisplayName(selected)}</span>
              <button style={linkBtn} onClick={() => setSelectedId(null)}>Changer</button>
            </div>
          ) : (
            <div>
              <Input
                label="Rechercher une personne"
                placeholder="Nom, raison sociale…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {results.length > 0 && (
                <div style={resultsList}>
                  {results.map((p) => (
                    <button key={p.id} style={resultRow} onClick={() => { setSelectedId(p.id); setSearch('') }}>
                      {personneDisplayName(p)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          <Input
            label="Nom"
            placeholder="ex. Jean Dupont"
            value={nomLibre}
            onChange={(e) => setNomLibre(e.target.value)}
          />
        )}

        <Select
          label="Nature de propriété"
          value={naturePropriete}
          options={NATURE_PROPRIETE_OPTIONS}
          onChange={(e) => setNaturePropriete(e.target.value as NaturePropriete)}
        />

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <NumberInput
              label="Quote-part (%)"
              placeholder="ex. 50"
              value={quotePart}
              onChange={(e) => handleQuotePartChange(e.target.value)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <NumberInput
              label="Nombre de parts"
              placeholder={nombrePartsTotal ? `sur ${nombrePartsTotal}` : 'ex. 50'}
              disabled={!nombrePartsTotal}
              helper={!nombrePartsTotal ? "Renseignez d'abord le nombre de parts total." : undefined}
              value={nombreParts}
              onChange={(e) => handleNombrePartsChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Drawer>
  )
}

const selectedCard: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  background: 'var(--surface-muted)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
}

const linkBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  color: 'var(--color-accent)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}

const resultsList: CSSProperties = {
  marginTop: '8px',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
}

const resultRow: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '10px 14px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
  background: 'var(--surface-base)',
  border: 'none',
  borderBottom: '1px solid var(--border-default)',
  cursor: 'pointer',
}
