import { useEffect, useState } from 'react'
import { Drawer, Button, Input, Select } from '../../design-system'
import type { CSSProperties } from 'react'
import type { ParagraphVariable, TrameParagraph } from '../../types/database'
import { ACTE_TYPE_OPTIONS } from '../../constants/acteTypes'
import { ParagraphEditor } from './editor/ParagraphEditor'

export interface ParagraphFormValues {
  type_acte: string
  category: string
  title: string
  content: Record<string, unknown>
  variables: ParagraphVariable[]
  is_published: boolean
}

interface ParagraphFormDrawerProps {
  open: boolean
  paragraph: TrameParagraph | null
  categoriesByActeType: Record<string, string[]>
  saving: boolean
  onSave: (values: ParagraphFormValues) => void
  onClose: () => void
}

function toFormValues(p: TrameParagraph | null): ParagraphFormValues {
  return {
    type_acte: p?.type_acte ?? ACTE_TYPE_OPTIONS[0].value,
    category: p?.category ?? '',
    title: p?.title ?? '',
    content: p?.content ?? {},
    variables: p?.variables ?? [],
    is_published: p?.is_published ?? false,
  }
}

export function ParagraphFormDrawer({ open, paragraph, categoriesByActeType, saving, onSave, onClose }: ParagraphFormDrawerProps) {
  const [values, setValues] = useState<ParagraphFormValues>(toFormValues(paragraph))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(toFormValues(paragraph))
      setError(null)
    }
  }, [open, paragraph])

  function handleSubmit() {
    if (!values.title.trim()) { setError('Le titre est obligatoire.'); return }
    if (!values.category.trim()) { setError('La catégorie est obligatoire.'); return }
    setError(null)
    onSave({ ...values, title: values.title.trim(), category: values.category.trim() })
  }

  const categoryOptions = categoriesByActeType[values.type_acte] ?? []

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={paragraph ? 'Modifier le paragraphe' : 'Nouveau paragraphe'}
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
        {error && <div style={errorStyle}>{error}</div>}

        <div style={grid2}>
          <Select
            label="Type d'acte"
            options={ACTE_TYPE_OPTIONS}
            value={values.type_acte}
            onChange={(e) => setValues((v) => ({ ...v, type_acte: e.target.value }))}
            required
          />
          <div>
            <Input
              label="Catégorie"
              placeholder="ex. Désignation des parties"
              value={values.category}
              onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
              list="category-options"
              required
            />
            <datalist id="category-options">
              {categoryOptions.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>

        <Input
          label="Titre"
          placeholder="ex. Désignation de l'acquéreur personne physique"
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          required
        />

        <div>
          <label style={labelStyle}>Contenu</label>
          <ParagraphEditor
            content={values.content}
            onChange={(content, variables) => setValues((v) => ({ ...v, content, variables }))}
          />
        </div>

        <Select
          label="Statut"
          options={[{ value: 'false', label: 'Brouillon' }, { value: 'true', label: 'Publié' }]}
          value={String(values.is_published)}
          onChange={(e) => setValues((v) => ({ ...v, is_published: e.target.value === 'true' }))}
        />
      </div>
    </Drawer>
  )
}

const grid2: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--n-700)',
  marginBottom: '6px',
}

const errorStyle: CSSProperties = {
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: '6px',
  padding: '10px 14px',
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  color: '#DC2626',
}
