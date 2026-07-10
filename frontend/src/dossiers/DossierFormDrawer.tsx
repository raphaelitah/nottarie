import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button, Input, Select } from '../design-system'
import { ACTE_TYPE_OPTIONS } from '../constants/acteTypes'
import { QUALITE_SUGGESTIONS } from '../constants/personneTypes'
import type { Dossier, Immeuble, Personne, Utilisateur } from '../types/database'
import { utilisateurLabel } from '../utilisateurs/utilisateurLabel'
import { personneDisplayName } from '../personnes/personneForm'
import { immeubleDisplayName } from '../immeubles/immeubleForm'

export interface DossierFormValues {
  type_acte: string
  nom: string
  notaire_id: string
  clerc_attitre_id: string
  dossier_parent_id: string | null
  comparant_qualite?: string
}

const EMPTY: DossierFormValues = {
  type_acte: '',
  nom: '',
  notaire_id: '',
  clerc_attitre_id: '',
  dossier_parent_id: null,
}

interface DossierFormDrawerProps {
  open: boolean
  saving: boolean
  notaires: Utilisateur[]
  clercs: Utilisateur[]
  dossiers: Dossier[]
  defaultClercId?: string
  prefillPersonne?: Personne | null
  prefillImmeuble?: Immeuble | null
  onSave: (values: DossierFormValues) => void
  onClose: () => void
}

export function DossierFormDrawer({ open, saving, notaires, clercs, dossiers, defaultClercId, prefillPersonne, prefillImmeuble, onSave, onClose }: DossierFormDrawerProps) {
  const [values, setValues] = useState<DossierFormValues>(EMPTY)
  const [linking, setLinking] = useState(false)
  const [parentSearch, setParentSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues({ ...EMPTY, clerc_attitre_id: defaultClercId ?? '', comparant_qualite: prefillPersonne ? QUALITE_SUGGESTIONS[0] : '' })
      setLinking(false)
      setParentSearch('')
      setError(null)
    }
  }, [open, defaultClercId, prefillPersonne])

  const parentQuery = parentSearch.trim().toLowerCase()
  const parentResults = parentQuery
    ? dossiers.filter((d) => d.numero && d.numero.toLowerCase().includes(parentQuery)).slice(0, 8)
    : []
  const selectedParent = dossiers.find((d) => d.id === values.dossier_parent_id) ?? null

  function handleSubmit() {
    if (!values.type_acte) { setError("Le type de dossier est obligatoire."); return }
    if (!values.notaire_id) { setError("Le notaire responsable est obligatoire."); return }
    if (!values.clerc_attitre_id) { setError("Le clerc attitré est obligatoire."); return }
    if (linking && !values.dossier_parent_id) { setError("Sélectionnez le dossier auquel lier ce nouveau dossier."); return }
    if (prefillPersonne && !values.comparant_qualite?.trim()) { setError("La qualité de la personne dans ce dossier est obligatoire."); return }
    setError(null)
    onSave(linking ? values : { ...values, dossier_parent_id: null })
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Nouveau dossier"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Création…' : 'Créer le dossier'}
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

        {(prefillPersonne || prefillImmeuble) && (
          <div style={selectedCard}>
            <span>
              Lié à {prefillPersonne ? personneDisplayName(prefillPersonne) : immeubleDisplayName(prefillImmeuble!)}
            </span>
          </div>
        )}

        {prefillPersonne && (
          <Select
            label="Qualité de cette personne dans le dossier"
            required
            options={QUALITE_SUGGESTIONS.map((q) => ({ value: q, label: q }))}
            value={values.comparant_qualite ?? ''}
            onChange={(e) => setValues((v) => ({ ...v, comparant_qualite: e.target.value }))}
          />
        )}

        <Select
          label="Type de dossier"
          required
          options={ACTE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={values.type_acte}
          onChange={(e) => setValues((v) => ({ ...v, type_acte: e.target.value }))}
        />

        <Input
          label="Nom du dossier"
          placeholder="Ex. Succession M. Jean DUPONT"
          helper="Facultatif. Si laissé vide, un nom sera suggéré automatiquement à partir des comparants (défunt, donataires…) une fois ajoutés."
          value={values.nom}
          onChange={(e) => setValues((v) => ({ ...v, nom: e.target.value }))}
        />

        <Select
          label="Notaire responsable"
          required
          helper="Accès par défaut au dossier, avec la personne qui le crée."
          options={notaires.map((n) => ({ value: n.id, label: utilisateurLabel(n) }))}
          value={values.notaire_id}
          onChange={(e) => setValues((v) => ({ ...v, notaire_id: e.target.value }))}
        />

        <Select
          label="Clerc attitré"
          required
          helper="Responsable du suivi du dossier. Par défaut, la personne qui le crée si c'est un clerc."
          options={clercs.map((c) => ({ value: c.id, label: utilisateurLabel(c) }))}
          value={values.clerc_attitre_id}
          onChange={(e) => setValues((v) => ({ ...v, clerc_attitre_id: e.target.value }))}
        />

        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={linking}
            onChange={(e) => {
              setLinking(e.target.checked)
              if (!e.target.checked) setValues((v) => ({ ...v, dossier_parent_id: null }))
            }}
          />
          Lier ce dossier à un dossier existant
        </label>

        {linking && (
          selectedParent ? (
            <div style={selectedCard}>
              <span>{selectedParent.numero ?? 'Dossier sans numéro'}</span>
              <button type="button" style={linkBtn} onClick={() => setValues((v) => ({ ...v, dossier_parent_id: null }))}>Changer</button>
            </div>
          ) : (
            <div>
              <Input
                label="Dossier parent"
                required
                placeholder="Rechercher par numéro…"
                value={parentSearch}
                onChange={(e) => setParentSearch(e.target.value)}
                helper="Le numéro du nouveau dossier sera dérivé de celui du parent."
              />
              {parentResults.length > 0 && (
                <div style={resultsList}>
                  {parentResults.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      style={resultRow}
                      onClick={() => { setValues((v) => ({ ...v, dossier_parent_id: d.id })); setParentSearch('') }}
                    >
                      {d.numero ?? 'Dossier sans numéro'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </Drawer>
  )
}

const checkboxRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  color: '#2D2C3C',
  cursor: 'pointer',
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
