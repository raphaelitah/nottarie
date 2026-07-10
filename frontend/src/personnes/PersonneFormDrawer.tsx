import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button } from '../design-system'
import type { Personne } from '../types/database'
import { PersonneFields } from './PersonneFields'
import { PersonneDocumentsSection } from './PersonneDocumentsSection'
import { PersonneImmeublesSection } from './PersonneImmeublesSection'
import { PersonneMoraleContactsSection } from './PersonneMoraleContactsSection'
import {
  EMPTY_PERSONNE_FORM,
  personneToForm,
  personneFormError,
  type PersonneFormValues,
} from './personneForm'

const TABS = [
  { key: 'informations', label: 'Informations' },
  { key: 'immeubles', label: 'Immeubles' },
  { key: 'contacts', label: 'Contacts' },
  { key: 'documents', label: 'Documents' },
] as const

type TabKey = typeof TABS[number]['key']

interface PersonneFormDrawerProps {
  open: boolean
  personne: Personne | null
  saving: boolean
  onSave: (values: PersonneFormValues) => void
  onClose: () => void
}

export function PersonneFormDrawer({ open, personne, saving, onSave, onClose }: PersonneFormDrawerProps) {
  const [values, setValues] = useState<PersonneFormValues>(EMPTY_PERSONNE_FORM)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('informations')

  useEffect(() => {
    if (open) {
      setValues(personne ? personneToForm(personne) : EMPTY_PERSONNE_FORM)
      setError(null)
      setTab('informations')
    }
  }, [open, personne])

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
      title={personne ? 'Modifier la personne' : 'Nouvelle personne'}
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
          }}>{error}</div>
        )}

        {personne && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-default)' }}>
            {TABS.filter((t) => t.key !== 'contacts' || personne.type === 'morale').map((t) => (
              <button key={t.key} type="button" onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {tab === 'informations' || !personne ? (
          <PersonneFields values={values} onChange={setValues} />
        ) : tab === 'immeubles' ? (
          <PersonneImmeublesSection tenantId={personne.tenant_id} personneId={personne.id} />
        ) : tab === 'contacts' && personne.type === 'morale' ? (
          <PersonneMoraleContactsSection tenantId={personne.tenant_id} personneMoraleId={personne.id} />
        ) : (
          <PersonneDocumentsSection tenantId={personne.tenant_id} personneId={personne.id} />
        )}
      </div>
    </Drawer>
  )
}

function tabBtn(active: boolean): CSSProperties {
  return {
    appearance: 'none',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--n-900)' : '2px solid transparent',
    padding: '0 0 var(--space-2)',
    marginBottom: '-1px',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    color: active ? 'var(--n-900)' : 'var(--text-muted)',
    cursor: 'pointer',
  }
}
