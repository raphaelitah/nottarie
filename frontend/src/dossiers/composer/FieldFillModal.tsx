import { useEffect, useState } from 'react'
import { Modal, Button, Input } from '../../design-system'

interface FieldFillModalProps {
  open: boolean
  label: string
  value: string
  onSave: (value: string) => void
  onClose: () => void
}

export function FieldFillModal({ open, label, value, onSave, onClose }: FieldFillModalProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={label}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={() => onSave(draft)}>Enregistrer</Button>
        </>
      }
    >
      <Input label="Valeur" value={draft} onChange={(e) => setDraft(e.target.value)} />
    </Modal>
  )
}
