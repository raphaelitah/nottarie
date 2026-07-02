import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button, Input, Select } from '../../design-system'
import type { SectionVariable, TrameSection } from '../../types/database'
import { ContentEditor } from './editor/ContentEditor'

export const STANDARD_MODEL_TITLE = "Modèle d'acte standard"

export interface SectionFormValues {
  category: string | null
  title: string
  content: Record<string, unknown>
  variables: SectionVariable[]
  is_published: boolean
}

interface SectionFormDrawerProps {
  open: boolean
  section: TrameSection | null
  isStandard: boolean
  categoryOptions: string[]
  saving: boolean
  onSave: (values: SectionFormValues) => void
  onClose: () => void
}

function toFormValues(s: TrameSection | null, isStandard: boolean): SectionFormValues {
  return {
    category: isStandard ? null : s?.category ?? '',
    title: isStandard ? STANDARD_MODEL_TITLE : s?.title ?? '',
    content: s?.content ?? {},
    variables: s?.variables ?? [],
    is_published: s?.is_published ?? false,
  }
}

export function SectionFormDrawer({ open, section, isStandard, categoryOptions, saving, onSave, onClose }: SectionFormDrawerProps) {
  const [values, setValues] = useState<SectionFormValues>(toFormValues(section, isStandard))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(toFormValues(section, isStandard))
      setError(null)
    }
  }, [open, section, isStandard])

  function handleSubmit() {
    if (!isStandard && !(values.category ?? '').trim()) { setError('La catégorie est obligatoire.'); return }
    setError(null)
    onSave({ ...values, category: isStandard ? null : (values.category ?? '').trim() })
  }

  const title = isStandard
    ? (section ? "Modifier le modèle d'acte standard" : "Nouveau modèle d'acte standard")
    : (section ? 'Modifier la section' : 'Nouvelle section')

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
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

        {!isStandard && (
          <div style={grid2}>
            <div>
              <Input
                label="Catégorie"
                placeholder="ex. Désignation des parties"
                value={values.category ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
                list="category-options"
                required
              />
              <datalist id="category-options">
                {categoryOptions.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <Input
              label="Titre"
              placeholder="ex. Désignation de l'acquéreur personne physique"
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              required
            />
          </div>
        )}

        <div>
          <label style={labelStyle}>Contenu</label>
          <ContentEditor
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
