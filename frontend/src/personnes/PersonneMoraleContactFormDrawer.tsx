import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button, Input, Select } from '../design-system'
import type { Personne } from '../types/database'
import { personneDisplayName } from './personneForm'
import { FONCTION_CONTACT_OPTIONS } from '../constants/personneTypes'

export interface PersonneMoraleContactFormResult {
  personnePhysiqueId: string | null
  nomLibre: string | null
  fonction: string
  email: string
  telephone: string
  isPrincipal: boolean
}

interface PersonneMoraleContactFormDrawerProps {
  open: boolean
  personnesPhysiques: Personne[]
  saving: boolean
  onSave: (result: PersonneMoraleContactFormResult) => void
  onClose: () => void
}

export function PersonneMoraleContactFormDrawer({ open, personnesPhysiques, saving, onSave, onClose }: PersonneMoraleContactFormDrawerProps) {
  const [mode, setMode] = useState<'existante' | 'libre'>('existante')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [nomLibre, setNomLibre] = useState('')
  const [fonction, setFonction] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [isPrincipal, setIsPrincipal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setMode('existante')
    setSearch('')
    setSelectedId(null)
    setNomLibre('')
    setFonction('')
    setEmail('')
    setTelephone('')
    setIsPrincipal(false)
    setError(null)
  }, [open])

  const query = search.trim().toLowerCase()
  const results = query
    ? personnesPhysiques.filter((p) => personneDisplayName(p).toLowerCase().includes(query)).slice(0, 8)
    : []
  const selected = personnesPhysiques.find((p) => p.id === selectedId) ?? null

  function handleSubmit() {
    if (mode === 'existante') {
      if (!selectedId) { setError('Sélectionnez une personne.'); return }
      setError(null)
      onSave({ personnePhysiqueId: selectedId, nomLibre: null, fonction, email, telephone, isPrincipal })
    } else {
      if (!nomLibre.trim()) { setError('Le nom du contact est obligatoire.'); return }
      setError(null)
      onSave({ personnePhysiqueId: null, nomLibre: nomLibre.trim(), fonction, email, telephone, isPrincipal })
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Ajouter un contact"
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
          <Button variant={mode === 'libre' ? 'primary' : 'secondary'} size="sm" onClick={() => { setMode('libre'); setError(null) }}>
            Personne hors base
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
                label="Rechercher une personne physique"
                placeholder="Nom, prénom…"
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
          <Input
            label="Nom du contact"
            placeholder="ex. Jean Dupont"
            value={nomLibre}
            onChange={(e) => setNomLibre(e.target.value)}
          />
        )}

        <Select
          label="Fonction"
          options={FONCTION_CONTACT_OPTIONS}
          value={fonction}
          onChange={(e) => setFonction(e.target.value)}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        </div>

        <label style={checkboxRow}>
          <input type="checkbox" checked={isPrincipal} onChange={(e) => setIsPrincipal(e.target.checked)} />
          Contact principal
        </label>
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

const checkboxRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
}
