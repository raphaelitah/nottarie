import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button, Input } from '../design-system'
import type { Personne } from '../types/database'
import { QUALITE_SUGGESTIONS } from '../constants/personneTypes'
import {
  PersonneFields,
  EMPTY_PERSONNE_FORM,
  personneDisplayName,
  personneFormError,
  type PersonneFormValues,
} from '../personnes/PersonneFields'

export interface ComparantFormResult {
  qualite: string
  personneId: string | null
  newPersonne: PersonneFormValues | null
}

interface ComparantFormDrawerProps {
  open: boolean
  personnes: Personne[]
  saving: boolean
  onSave: (result: ComparantFormResult) => void
  onClose: () => void
}

export function ComparantFormDrawer({ open, personnes, saving, onSave, onClose }: ComparantFormDrawerProps) {
  const [mode, setMode] = useState<'existante' | 'nouvelle'>('existante')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newPersonne, setNewPersonne] = useState<PersonneFormValues>(EMPTY_PERSONNE_FORM)
  const [qualite, setQualite] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setMode('existante')
      setSearch('')
      setSelectedId(null)
      setNewPersonne(EMPTY_PERSONNE_FORM)
      setQualite('')
      setError(null)
    }
  }, [open])

  const query = search.trim().toLowerCase()
  const results = query
    ? personnes.filter((p) => personneDisplayName(p).toLowerCase().includes(query)).slice(0, 8)
    : []
  const selected = personnes.find((p) => p.id === selectedId) ?? null

  function handleSubmit() {
    if (!qualite.trim()) { setError('La qualité est obligatoire.'); return }
    if (mode === 'existante') {
      if (!selectedId) { setError('Sélectionnez une personne.'); return }
      setError(null)
      onSave({ qualite: qualite.trim(), personneId: selectedId, newPersonne: null })
    } else {
      const err = personneFormError(newPersonne)
      if (err) { setError(err); return }
      setError(null)
      onSave({ qualite: qualite.trim(), personneId: null, newPersonne })
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Ajouter un comparant"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Ajout…' : 'Ajouter'}
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
          <Button variant={mode === 'existante' ? 'primary' : 'secondary'} size="sm" onClick={() => { setMode('existante'); setError(null) }}>
            Personne existante
          </Button>
          <Button variant={mode === 'nouvelle' ? 'primary' : 'secondary'} size="sm" onClick={() => { setMode('nouvelle'); setError(null) }}>
            Nouvelle personne
          </Button>
        </div>

        {mode === 'existante' ? (
          selected ? (
            <div style={selectedCard}>
              <span>{personneDisplayName(selected)}</span>
              <button style={linkBtn} onClick={() => setSelectedId(null)}>Changer</button>
            </div>
          ) : (
            <div>
              <Input
                label="Rechercher une personne"
                placeholder="Nom, raison sociale…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {results.length > 0 && (
                <div style={resultsList}>
                  {results.map((p) => (
                    <button key={p.id} style={resultRow} onClick={() => { setSelectedId(p.id); setSearch('') }}>
                      {personneDisplayName(p)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        ) : (
          <PersonneFields values={newPersonne} onChange={setNewPersonne} />
        )}

        <div>
          <Input
            label="Qualité"
            required
            placeholder="ex. Héritier, Donateur…"
            value={qualite}
            onChange={(e) => setQualite(e.target.value)}
            list="qualite-suggestions"
          />
          <datalist id="qualite-suggestions">
            {QUALITE_SUGGESTIONS.map((q) => <option key={q} value={q} />)}
          </datalist>
        </div>
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
