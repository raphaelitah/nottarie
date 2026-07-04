import { useEffect, useState } from 'react'
import { Modal, Button, Input, Select } from '../../../design-system'
import type { SectionFieldType } from '../../../types/database'
import { SNAKE_CASE_RE, slugifyKey } from './fieldKey'
import type { ChampAttrs } from './fieldNode'
import {
  parseChampSource,
  buildChampSource,
  type ChampSourceKind,
  SESSION_ATTRIBUTE_OPTIONS,
  ETUDE_ATTRIBUTE_OPTIONS,
  PERSONNE_ATTRIBUTE_OPTIONS,
  COMPARANT_QUALITE_OPTIONS,
} from '../../../trames/champSource'

const FIELD_TYPE_OPTIONS: { value: SectionFieldType; label: string }[] = [
  { value: 'auto', label: 'Automatique (rempli depuis le dossier)' },
  { value: 'manuel', label: 'Manuel (saisi par le rédacteur)' },
]

const SOURCE_KIND_OPTIONS: { value: ChampSourceKind; label: string }[] = [
  { value: 'comparant', label: 'Comparant du dossier' },
  { value: 'etude', label: "Étude" },
  { value: 'session', label: 'Séance (date, notaire)' },
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
  const [fieldType, setFieldType] = useState<SectionFieldType>('auto')
  const [sourceKind, setSourceKind] = useState<ChampSourceKind>('comparant')
  const [sourceQualite, setSourceQualite] = useState(COMPARANT_QUALITE_OPTIONS[0])
  const [sourceAttribute, setSourceAttribute] = useState(PERSONNE_ATTRIBUTE_OPTIONS[0].value)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLabel(initialValues?.label ?? '')
    setKey(initialValues?.key ?? '')
    setKeyEdited(!!initialValues?.key)
    setFieldType(initialValues?.fieldType ?? 'auto')
    const parsed = parseChampSource(initialValues?.source)
    setSourceKind(parsed?.kind ?? 'comparant')
    setSourceQualite(parsed?.qualite ?? COMPARANT_QUALITE_OPTIONS[0])
    setSourceAttribute(parsed?.attribute ?? PERSONNE_ATTRIBUTE_OPTIONS[0].value)
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
    const source = fieldType === 'auto'
      ? buildChampSource(
          sourceKind === 'comparant'
            ? { kind: 'comparant', qualite: sourceQualite, attribute: sourceAttribute }
            : { kind: sourceKind, attribute: sourceAttribute }
        )
      : null
    onSave({ key: normalizedKey, label: label.trim(), fieldType, source })
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
          onChange={(e) => setFieldType(e.target.value as SectionFieldType)}
        />

        {fieldType === 'auto' && (
          <>
            <Select
              label="Source"
              options={SOURCE_KIND_OPTIONS}
              value={sourceKind}
              onChange={(e) => {
                const kind = e.target.value as ChampSourceKind
                setSourceKind(kind)
                setSourceAttribute(
                  kind === 'session' ? SESSION_ATTRIBUTE_OPTIONS[0].value
                  : kind === 'etude' ? ETUDE_ATTRIBUTE_OPTIONS[0].value
                  : PERSONNE_ATTRIBUTE_OPTIONS[0].value
                )
              }}
            />
            {sourceKind === 'comparant' && (
              <Select
                label="Qualité du comparant"
                options={COMPARANT_QUALITE_OPTIONS}
                value={sourceQualite}
                onChange={(e) => setSourceQualite(e.target.value)}
              />
            )}
            <Select
              label="Attribut"
              options={
                sourceKind === 'session' ? SESSION_ATTRIBUTE_OPTIONS
                : sourceKind === 'etude' ? ETUDE_ATTRIBUTE_OPTIONS
                : PERSONNE_ATTRIBUTE_OPTIONS
              }
              value={sourceAttribute}
              onChange={(e) => setSourceAttribute(e.target.value)}
            />
          </>
        )}
      </div>
    </Modal>
  )
}
