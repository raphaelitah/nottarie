import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button } from '../design-system'
import type { Immeuble } from '../types/database'
import { ImmeubleFields } from './ImmeubleFields'
import { ImmeubleDocumentsSection } from './ImmeubleDocumentsSection'
import { ImmeubleProprietairesSection } from './ImmeubleProprietairesSection'
import {
  EMPTY_IMMEUBLE_FORM,
  immeubleToForm,
  immeubleFormError,
  type ImmeubleFormValues,
} from './immeubleForm'

interface ImmeubleFormDrawerProps {
  open: boolean
  tenantId: string
  immeuble: Immeuble | null
  saving: boolean
  onSave: (values: ImmeubleFormValues) => void
  onClose: () => void
}

const TABS = [
  { key: 'informations', label: 'Informations' },
  { key: 'proprietaires', label: 'Propriétaires' },
  { key: 'documents', label: 'Documents' },
] as const
type TabKey = typeof TABS[number]['key']

export function ImmeubleFormDrawer({ open, tenantId, immeuble, saving, onSave, onClose }: ImmeubleFormDrawerProps) {
  const [values, setValues] = useState<ImmeubleFormValues>(EMPTY_IMMEUBLE_FORM)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('informations')

  useEffect(() => {
    if (open) {
      setValues(immeuble ? immeubleToForm(immeuble) : EMPTY_IMMEUBLE_FORM)
      setError(null)
      setTab('informations')
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
        tab === 'informations' ? (
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={onClose}>Fermer</Button>
        )
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {immeuble && (
          <div style={tabBar}>
            {TABS.map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {tab === 'informations' && (
          <>
            {error && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
                padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#DC2626',
              }}>{error}</div>
            )}
            <ImmeubleFields values={values} onChange={setValues} />
          </>
        )}

        {tab === 'proprietaires' && immeuble && (
          <ImmeubleProprietairesSection tenantId={tenantId} immeubleId={immeuble.id} />
        )}

        {tab === 'documents' && immeuble && (
          <ImmeubleDocumentsSection tenantId={tenantId} immeubleId={immeuble.id} />
        )}
      </div>
    </Drawer>
  )
}

const tabBar: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-4)',
  borderBottom: '1px solid var(--border-default)',
}

function tabBtn(active: boolean): CSSProperties {
  return {
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--n-900)' : '2px solid transparent',
    padding: '8px 2px',
    marginBottom: '-1px',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: active ? 600 : 500,
    color: active ? 'var(--n-900)' : 'var(--text-muted)',
    cursor: 'pointer',
  }
}
