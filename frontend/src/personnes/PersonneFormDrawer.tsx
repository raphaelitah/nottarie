import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button } from '../design-system'
import { PersonneFields } from './PersonneFields'
import {
  EMPTY_PERSONNE_FORM,
  personneFormError,
  type PersonneFormValues,
} from './personneForm'

interface PersonneFormDrawerProps {
  open: boolean
  saving: boolean
  onSave: (values: PersonneFormValues) => void
  onClose: () => void
}

// Create-only: editing an existing personne happens on PersonneDetailPage,
// which has room for the Dossiers/Immeubles/Contacts/Documents tabs that a
// drawer can't comfortably fit.
export function PersonneFormDrawer({ open, saving, onSave, onClose }: PersonneFormDrawerProps) {
  const [values, setValues] = useState<PersonneFormValues>(EMPTY_PERSONNE_FORM)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(EMPTY_PERSONNE_FORM)
      setError(null)
    }
  }, [open])

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
      title="Nouvelle personne"
      size="lg"
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
          } as CSSProperties}>{error}</div>
        )}
        <PersonneFields values={values} onChange={setValues} />
      </div>
    </Drawer>
  )
}
