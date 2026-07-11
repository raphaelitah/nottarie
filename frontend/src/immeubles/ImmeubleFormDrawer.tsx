import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button } from '../design-system'
import { ImmeubleFields } from './ImmeubleFields'
import {
  EMPTY_IMMEUBLE_FORM,
  immeubleFormError,
  type ImmeubleFormValues,
} from './immeubleForm'

interface ImmeubleFormDrawerProps {
  open: boolean
  saving: boolean
  onSave: (values: ImmeubleFormValues) => void
  onClose: () => void
}

// Create-only: editing an existing immeuble happens on ImmeubleDetailPage,
// which has room for the Dossiers/Propriétaires/Documents tabs that a
// drawer can't comfortably fit.
export function ImmeubleFormDrawer({ open, saving, onSave, onClose }: ImmeubleFormDrawerProps) {
  const [values, setValues] = useState<ImmeubleFormValues>(EMPTY_IMMEUBLE_FORM)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(EMPTY_IMMEUBLE_FORM)
      setError(null)
    }
  }, [open])

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
      title="Nouvel immeuble"
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
          } as CSSProperties}>{error}</div>
        )}
        <ImmeubleFields values={values} onChange={setValues} />
      </div>
    </Drawer>
  )
}
