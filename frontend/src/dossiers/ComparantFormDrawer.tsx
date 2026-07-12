import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Drawer, Button, Input, Select } from '../design-system'
import type { Personne } from '../types/database'
import { QUALITE_SUGGESTIONS, QUALITES_SUJET } from '../constants/personneTypes'
import { PersonneFields } from '../personnes/PersonneFields'
import {
  EMPTY_PERSONNE_FORM,
  personneDisplayName,
  personneFormError,
  type PersonneFormValues,
} from '../personnes/personneForm'

const ADD_QUALITE_VALUE = '__add__'

export interface ComparantFormResult {
  qualite: string
  personneId: string | null
  newPersonne: PersonneFormValues | null
}

interface ComparantFormDrawerProps {
  open: boolean
  tenantId: string
  personnes: Personne[]
  saving: boolean
  onSave: (result: ComparantFormResult) => void
  onClose: () => void
}

export function ComparantFormDrawer({ open, tenantId, personnes, saving, onSave, onClose }: ComparantFormDrawerProps) {
  const [mode, setMode] = useState<'existante' | 'nouvelle'>('existante')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newPersonne, setNewPersonne] = useState<PersonneFormValues>(EMPTY_PERSONNE_FORM)
  const [qualiteOptions, setQualiteOptions] = useState<string[]>(QUALITE_SUGGESTIONS)
  const [qualite, setQualite] = useState('')
  const [addingQualite, setAddingQualite] = useState(false)
  const [newQualiteLabel, setNewQualiteLabel] = useState('')
  const [savingQualite, setSavingQualite] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setMode('existante')
    setSearch('')
    setSelectedId(null)
    setNewPersonne(EMPTY_PERSONNE_FORM)
    setQualite('')
    setAddingQualite(false)
    setNewQualiteLabel('')
    setError(null)

    supabase.from('qualites_comparant').select('*').eq('tenant_id', tenantId).order('libelle').then(({ data }) => {
      const custom = (data ?? []).map((q) => q.libelle)
      setQualiteOptions(Array.from(new Set([...QUALITE_SUGGESTIONS, ...custom])))
    })
  }, [open, tenantId])

  const query = search.trim().toLowerCase()
  const results = query
    ? personnes.filter((p) => personneDisplayName(p).toLowerCase().includes(query)).slice(0, 8)
    : []
  const selected = personnes.find((p) => p.id === selectedId) ?? null
  const personneType = mode === 'existante' ? (selected?.type ?? null) : (newPersonne.type || null)
  const isTiersPartenaire = personneType === 'tiers_partenaire'
  const availableQualiteOptions = isTiersPartenaire
    ? qualiteOptions.filter((q) => !QUALITES_SUJET.includes(q.trim().toLowerCase()))
    : qualiteOptions

  useEffect(() => {
    if (isTiersPartenaire && QUALITES_SUJET.includes(qualite.trim().toLowerCase())) {
      setQualite('')
    }
  }, [isTiersPartenaire, qualite])

  async function handleAddQualite() {
    const libelle = newQualiteLabel.trim()
    if (!libelle) { setError('Le libellé de la qualité est obligatoire.'); return }
    setSavingQualite(true)
    setError(null)
    const { error } = await supabase.from('qualites_comparant').insert({ tenant_id: tenantId, libelle })
    setSavingQualite(false)
    if (error && !error.message.includes('duplicate')) {
      setError("Erreur lors de l'ajout de la qualité : " + error.message)
      return
    }
    setQualiteOptions((prev) => Array.from(new Set([...prev, libelle])))
    setQualite(libelle)
    setAddingQualite(false)
  }

  function handleSubmit() {
    if (!qualite.trim()) { setError('La qualité est obligatoire.'); return }
    if (isTiersPartenaire && QUALITES_SUJET.includes(qualite.trim().toLowerCase())) {
      setError('Un tiers/partenaire ne peut pas être défunt ni sujet du dossier : il ne fait que participer.')
      return
    }
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
      size="lg"
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

        {addingQualite ? (
          <div>
            <Input
              label="Nouvelle qualité"
              placeholder="ex. Usufruitier"
              value={newQualiteLabel}
              onChange={(e) => setNewQualiteLabel(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <Button size="sm" variant="primary" disabled={savingQualite} onClick={handleAddQualite}>
                {savingQualite ? 'Ajout…' : 'Ajouter à la liste'}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setAddingQualite(false)}>Annuler</Button>
            </div>
          </div>
        ) : (
          <Select
            label="Qualité"
            required
            options={[
              ...availableQualiteOptions.map((q) => ({ value: q, label: q })),
              { value: ADD_QUALITE_VALUE, label: '+ Ajouter une qualité…' },
            ]}
            value={qualite}
            onChange={(e) => {
              if (e.target.value === ADD_QUALITE_VALUE) { setAddingQualite(true); setNewQualiteLabel('') }
              else setQualite(e.target.value)
            }}
          />
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
