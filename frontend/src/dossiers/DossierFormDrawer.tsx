import { useEffect, useState } from 'react'
import { Drawer, Button, Input, Select } from '../design-system'
import { ACTE_TYPE_OPTIONS } from '../constants/acteTypes'
import type { Utilisateur } from '../types/database'
import { utilisateurLabel } from '../utilisateurs/utilisateurLabel'

export interface DossierFormValues {
  type_acte: string
  numero: string
  notaire_id: string
  clerc_attitre_id: string
}

const EMPTY: DossierFormValues = {
  type_acte: '',
  numero: '',
  notaire_id: '',
  clerc_attitre_id: '',
}

interface DossierFormDrawerProps {
  open: boolean
  saving: boolean
  notaires: Utilisateur[]
  clercs: Utilisateur[]
  defaultClercId?: string
  onSave: (values: DossierFormValues) => void
  onClose: () => void
}

export function DossierFormDrawer({ open, saving, notaires, clercs, defaultClercId, onSave, onClose }: DossierFormDrawerProps) {
  const [values, setValues] = useState<DossierFormValues>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues({ ...EMPTY, clerc_attitre_id: defaultClercId ?? '' })
      setError(null)
    }
  }, [open, defaultClercId])

  function handleSubmit() {
    if (!values.type_acte) { setError("Le type de dossier est obligatoire."); return }
    if (!values.notaire_id) { setError("Le notaire responsable est obligatoire."); return }
    if (!values.clerc_attitre_id) { setError("Le clerc attitré est obligatoire."); return }
    setError(null)
    onSave({ ...values, numero: values.numero.trim() })
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

        <Select
          label="Type de dossier"
          required
          options={ACTE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          value={values.type_acte}
          onChange={(e) => setValues((v) => ({ ...v, type_acte: e.target.value }))}
        />

        <Input
          label="Numéro de dossier"
          placeholder="ex. 2026-0142"
          helper="Facultatif — peut être renseigné plus tard."
          value={values.numero}
          onChange={(e) => setValues((v) => ({ ...v, numero: e.target.value }))}
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
      </div>
    </Drawer>
  )
}
