import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Modal, Button, Textarea } from '../../design-system'
import type { Comparant } from '../../types/database'
import { comparantDisplayName, formatComparantIdentification, formatComparantsList } from './comparantFormat'

interface FieldFillModalProps {
  open: boolean
  label: string
  value: string
  comparants: Comparant[]
  onSave: (value: string) => void
  onClose: () => void
}

export function FieldFillModal({ open, label, value, comparants, onSave, onClose }: FieldFillModalProps) {
  const [draft, setDraft] = useState(value)

  useEffect(() => {
    if (open) setDraft(value)
  }, [open, value])

  function insert(text: string) {
    setDraft((current) => (current.trim() ? `${current.trim()} ${text}` : text))
  }

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
      {comparants.length > 0 && (
        <div style={chipsWrap}>
          {comparants.length > 1 && (
            <button type="button" style={chipStyle} onClick={() => insert(formatComparantsList(comparants))}>
              + Tous les comparants
            </button>
          )}
          {comparants.map((c) => (
            <button key={c.id} type="button" style={chipStyle} onClick={() => insert(formatComparantIdentification(c))}>
              + {comparantDisplayName(c)}
            </button>
          ))}
        </div>
      )}
      <Textarea label="Valeur" value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
    </Modal>
  )
}

const chipsWrap: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginBottom: 'var(--space-3)',
}

const chipStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  color: 'var(--color-seal)',
  background: 'var(--color-seal-10)',
  border: '1px solid var(--color-seal-hover)',
  borderRadius: 'var(--radius-md)',
  padding: '4px 8px',
  cursor: 'pointer',
}
