import { useEffect, useState } from 'react'
import { Drawer, Button } from '../design-system'
import type { Personne } from '../types/database'
import {
  PersonneFields,
  EMPTY_PERSONNE_FORM,
  personneToForm,
  personneFormError,
  type PersonneFormValues,
} from './PersonneFields'

interface PersonneFormDrawerProps {
  open: boolean
  personne: Personne | null
  saving: boolean
  onSave: (values: PersonneFormValues) => void
  onClose: () => void
}

export function PersonneFormDrawer({ open, personne, saving, onSave, onClose }: PersonneFormDrawerProps) {
  const [values, setValues] = useState<PersonneFormValues>(EMPTY_PERSONNE_FORM)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(personne ? personneToForm(personne) : EMPTY_PERSONNE_FORM)
      setError(null)
    }
  }, [open, personne])

  function handleSubmit() {
    const err = personneFormError(values)
    if (err) { setError(err); return }
    setError(null)
    onSave(values)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={personne ? 'Modifier la personne' : 'Nouvelle personne'}
      size="md"
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
        <PersonneFields values={values} onChange={setValues} />
      </div>
    </Drawer>
  )
}
