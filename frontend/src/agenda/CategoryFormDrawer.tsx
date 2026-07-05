import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button, Input } from '../design-system'
import type { EvenementCategorie } from '../types/database'
import { CATEGORY_COLOR_PRESETS } from './agendaColors'

export interface CategoryFormResult {
  nom: string
  couleur: string
}

interface CategoryFormDrawerProps {
  open: boolean
  initialValues?: EvenementCategorie | null
  saving: boolean
  onSave: (result: CategoryFormResult) => void
  onClose: () => void
}

export function CategoryFormDrawer({ open, initialValues, saving, onSave, onClose }: CategoryFormDrawerProps) {
  const [nom, setNom] = useState('')
  const [couleur, setCouleur] = useState(CATEGORY_COLOR_PRESETS[0])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setNom(initialValues?.nom ?? '')
    setCouleur(initialValues?.couleur ?? CATEGORY_COLOR_PRESETS[0])
    setError(null)
  }, [open, initialValues])

  function handleSubmit() {
    if (!nom.trim()) { setError('Le nom est obligatoire.'); return }
    setError(null)
    onSave({ nom: nom.trim(), couleur })
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={initialValues ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
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

        <Input
          label="Nom"
          required
          placeholder="ex. RDV client, Signature, Interne"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>Couleur</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORY_COLOR_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setCouleur(preset)}
                aria-label={preset}
                style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: preset,
                  border: couleur.toLowerCase() === preset.toLowerCase() ? '2px solid var(--n-900)' : '2px solid transparent',
                  boxShadow: '0 0 0 1px var(--border-default)',
                  cursor: 'pointer', padding: 0,
                }}
              />
            ))}
            <input
              type="color"
              value={couleur}
              onChange={(e) => setCouleur(e.target.value)}
              style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
              aria-label="Couleur personnalisée"
            />
          </div>
        </div>
      </div>
    </Drawer>
  )
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--n-800)',
  letterSpacing: '-0.01em',
}
