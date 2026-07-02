import { useEffect, useState } from 'react'
import { Modal, Button, Input, Select } from '../../../design-system'
import type { ParagraphFieldType } from '../../../types/database'
import { SNAKE_CASE_RE, slugifyKey } from './fieldKey'
import type { ChampAttrs } from './fieldNode'

const FIELD_TYPE_OPTIONS: { value: ParagraphFieldType; label: string }[] = [
  { value: 'auto', label: 'Automatique (rempli depuis le dossier)' },
  { value: 'manuel', label: 'Manuel (saisi par le rédacteur)' },
]

interface FieldFormModalProps {
  open: boolean
  initialValues?: ChampAttrs
  existingKeys: string[]
  onSave: (attrs: ChampAttrs) => void
  onDelete?: () => void
  onClose: () => void
}

export function FieldFormModal({ open, initialValues, existingKeys, onSave, onDelete, onClose }: FieldFormModalProps) {
  const [label, setLabel] = useState('')
  const [key, setKey] = useState('')
  const [keyEdited, setKeyEdited] = useState(false)
  const [fieldType, setFieldType] = useState<ParagraphFieldType>('auto')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLabel(initialValues?.label ?? '')
    setKey(initialValues?.key ?? '')
    setKeyEdited(!!initialValues?.key)
    setFieldType(initialValues?.fieldType ?? 'auto')
    setError(null)
  }, [open, initialValues])

  function handleLabelChange(value: string) {
    setLabel(value)
    if (!keyEdited) setKey(slugifyKey(value))
  }

  function handleKeyChange(value: string) {
    setKeyEdited(true)
    setKey(value)
  }

  function handleSave() {
    const normalizedKey = slugifyKey(key)
    if (!normalizedKey || !SNAKE_CASE_RE.test(normalizedKey)) {
      setError('La clé doit être en snake_case (ex. nom_client, date_deces).')
      return
    }
    const isDuplicate = existingKeys
      .filter((k) => k !== initialValues?.key)
      .includes(normalizedKey)
    if (isDuplicate) {
      setError('Cette clé est déjà utilisée par un autre champ de ce paragraphe.')
      return
    }
    if (!label.trim()) {
      setError('Le libellé est obligatoire.')
      return
    }
    onSave({ key: normalizedKey, label: label.trim(), fieldType })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialValues ? 'Modifier le champ' : 'Insérer un champ'}
      size="sm"
      footer={
        <>
          {initialValues && onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>Supprimer</Button>
          )}
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSave}>{initialValues ? 'Enregistrer' : 'Insérer'}</Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Libellé"
          placeholder="ex. Date de décès"
          value={label}
          onChange={(e) => handleLabelChange(e.target.value)}
          required
        />
        <Input
          label="Clé (variable Jinja)"
          placeholder="ex. date_deces"
          value={key}
          onChange={(e) => handleKeyChange(e.target.value)}
          error={error ?? undefined}
          helper={!error ? 'snake_case, utilisée comme nom de variable dans le modèle .docx' : undefined}
          required
        />
        <Select
          label="Type de champ"
          options={FIELD_TYPE_OPTIONS}
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value as ParagraphFieldType)}
        />
      </div>
    </Modal>
  )
}
