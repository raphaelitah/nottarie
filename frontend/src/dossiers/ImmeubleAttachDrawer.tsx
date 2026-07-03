import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button, Input } from '../design-system'
import type { Immeuble } from '../types/database'
import {
  ImmeubleFields,
  EMPTY_IMMEUBLE_FORM,
  immeubleDisplayName,
  immeubleFormError,
  type ImmeubleFormValues,
} from '../immeubles/ImmeubleFields'

export interface ImmeubleAttachResult {
  immeubleId: string | null
  newImmeuble: ImmeubleFormValues | null
}

interface ImmeubleAttachDrawerProps {
  open: boolean
  immeubles: Immeuble[]
  attachedIds: string[]
  saving: boolean
  onSave: (result: ImmeubleAttachResult) => void
  onClose: () => void
}

export function ImmeubleAttachDrawer({ open, immeubles, attachedIds, saving, onSave, onClose }: ImmeubleAttachDrawerProps) {
  const [mode, setMode] = useState<'existant' | 'nouveau'>('existant')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newImmeuble, setNewImmeuble] = useState<ImmeubleFormValues>(EMPTY_IMMEUBLE_FORM)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setMode('existant')
      setSearch('')
      setSelectedId(null)
      setNewImmeuble(EMPTY_IMMEUBLE_FORM)
      setError(null)
    }
  }, [open])

  const query = search.trim().toLowerCase()
  const results = query
    ? immeubles
        .filter((i) => !attachedIds.includes(i.id))
        .filter((i) => immeubleDisplayName(i).toLowerCase().includes(query))
        .slice(0, 8)
    : []
  const selected = immeubles.find((i) => i.id === selectedId) ?? null

  function handleSubmit() {
    if (mode === 'existant') {
      if (!selectedId) { setError('Sélectionnez un immeuble.'); return }
      setError(null)
      onSave({ immeubleId: selectedId, newImmeuble: null })
    } else {
      const err = immeubleFormError(newImmeuble)
      if (err) { setError(err); return }
      setError(null)
      onSave({ immeubleId: null, newImmeuble })
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Attacher un immeuble"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Ajout…' : 'Attacher'}
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

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant={mode === 'existant' ? 'primary' : 'secondary'} size="sm" onClick={() => { setMode('existant'); setError(null) }}>
            Immeuble existant
          </Button>
          <Button variant={mode === 'nouveau' ? 'primary' : 'secondary'} size="sm" onClick={() => { setMode('nouveau'); setError(null) }}>
            Nouvel immeuble
          </Button>
        </div>

        {mode === 'existant' ? (
          selected ? (
            <div style={selectedCard}>
              <span>{immeubleDisplayName(selected)}</span>
              <button style={linkBtn} onClick={() => setSelectedId(null)}>Changer</button>
            </div>
          ) : (
            <div>
              <Input
                label="Rechercher un immeuble"
                placeholder="Désignation, référence cadastrale…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {results.length > 0 && (
                <div style={resultsList}>
                  {results.map((i) => (
                    <button key={i.id} style={resultRow} onClick={() => { setSelectedId(i.id); setSearch('') }}>
                      {immeubleDisplayName(i)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          <ImmeubleFields values={newImmeuble} onChange={setNewImmeuble} />
        )}
      </div>
    </Drawer>
  )
}

const selectedCard: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  background: 'var(--surface-muted)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
}

const linkBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  color: 'var(--color-accent)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}

const resultsList: CSSProperties = {
  marginTop: '8px',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
}

const resultRow: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '10px 14px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
  background: 'var(--surface-base)',
  border: 'none',
  borderBottom: '1px solid var(--border-default)',
  cursor: 'pointer',
}
