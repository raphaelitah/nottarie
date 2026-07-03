import { useEffect, useState } from 'react'
import { Drawer, Button } from '../design-system'
import type { Immeuble } from '../types/database'
import {
  ImmeubleFields,
  EMPTY_IMMEUBLE_FORM,
  immeubleToForm,
  immeubleFormError,
  type ImmeubleFormValues,
} from './ImmeubleFields'

interface ImmeubleFormDrawerProps {
  open: boolean
  immeuble: Immeuble | null
  saving: boolean
  onSave: (values: ImmeubleFormValues) => void
  onClose: () => void
}

export function ImmeubleFormDrawer({ open, immeuble, saving, onSave, onClose }: ImmeubleFormDrawerProps) {
  const [values, setValues] = useState<ImmeubleFormValues>(EMPTY_IMMEUBLE_FORM)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(immeuble ? immeubleToForm(immeuble) : EMPTY_IMMEUBLE_FORM)
      setError(null)
    }
  }, [open, immeuble])

  function handleSubmit() {
    const err = immeubleFormError(values)
    if (err) { setError(err); return }
    setError(null)
    onSave(values)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={immeuble ? "Modifier l'immeuble" : 'Nouvel immeuble'}
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
        <ImmeubleFields values={values} onChange={setValues} />
      </div>
    </Drawer>
  )
}
