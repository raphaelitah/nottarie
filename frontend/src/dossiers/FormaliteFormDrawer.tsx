import { useEffect, useState } from 'react'
import { Drawer, Button, Select } from '../design-system'
import { FORMALITE_TYPE_OPTIONS } from '../constants/formaliteTypes'

interface FormaliteFormDrawerProps {
  open: boolean
  saving: boolean
  onSave: (type: string) => void
  onClose: () => void
}

export function FormaliteFormDrawer({ open, saving, onSave, onClose }: FormaliteFormDrawerProps) {
  const [type, setType] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setType('')
    setError(null)
  }, [open])

  function handleSubmit() {
    if (!type) { setError('Le type de formalité est obligatoire.'); return }
    setError(null)
    onSave(type)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nouvelle formalité"
      size="sm"
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
        <Select
          label="Type de formalité"
          required
          options={FORMALITE_TYPE_OPTIONS}
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
      </div>
    </Drawer>
  )
}
