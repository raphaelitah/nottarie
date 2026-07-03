import { Input, Select } from '../design-system'
import type { Personne, PersonneType } from '../types/database'
import { PERSONNE_TYPE_OPTIONS, CIVILITE_OPTIONS } from '../constants/personneTypes'

export interface PersonneFormValues {
  type: PersonneType
  civilite: string
  nom: string
  prenom: string
  raison_sociale: string
  email: string
  telephone: string
  adresse: string
}

export const EMPTY_PERSONNE_FORM: PersonneFormValues = {
  type: 'physique',
  civilite: '',
  nom: '',
  prenom: '',
  raison_sociale: '',
  email: '',
  telephone: '',
  adresse: '',
}

export function personneToForm(p: Personne): PersonneFormValues {
  return {
    type: p.type,
    civilite: p.civilite ?? '',
    nom: p.nom ?? '',
    prenom: p.prenom ?? '',
    raison_sociale: p.raison_sociale ?? '',
    email: p.email ?? '',
    telephone: p.telephone ?? '',
    adresse: p.adresse ?? '',
  }
}

export function personneDisplayName(p: Pick<Personne, 'type' | 'civilite' | 'nom' | 'prenom' | 'raison_sociale'>): string {
  if (p.type === 'physique') {
    return [p.civilite, p.prenom, p.nom].filter(Boolean).join(' ') || 'Personne sans nom'
  }
  return p.raison_sociale || 'Sans raison sociale'
}

export function personneFormError(values: PersonneFormValues): string | null {
  if (values.type === 'physique' && !values.nom.trim()) return 'Le nom est obligatoire.'
  if (values.type !== 'physique' && !values.raison_sociale.trim()) return 'La raison sociale est obligatoire.'
  return null
}

export function personneFormToInsertPayload(values: PersonneFormValues, tenantId: string) {
  return {
    tenant_id: tenantId,
    type: values.type,
    civilite: values.type === 'physique' ? (values.civilite || null) : null,
    nom: values.type === 'physique' ? (values.nom.trim() || null) : null,
    prenom: values.type === 'physique' ? (values.prenom.trim() || null) : null,
    raison_sociale: values.type !== 'physique' ? (values.raison_sociale.trim() || null) : null,
    email: values.email.trim() || null,
    telephone: values.telephone.trim() || null,
    adresse: values.adresse.trim() || null,
  }
}

interface PersonneFieldsProps {
  values: PersonneFormValues
  onChange: (values: PersonneFormValues) => void
}

export function PersonneFields({ values, onChange }: PersonneFieldsProps) {
  const set = (patch: Partial<PersonneFormValues>) => onChange({ ...values, ...patch })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Select
        label="Type"
        required
        options={PERSONNE_TYPE_OPTIONS}
        value={values.type}
        onChange={(e) => set({ type: e.target.value as PersonneType })}
      />

      {values.type === 'physique' ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '16px' }}>
            <Select
              label="Civilité"
              options={CIVILITE_OPTIONS}
              value={values.civilite}
              onChange={(e) => set({ civilite: e.target.value })}
            />
            <Input label="Prénom" value={values.prenom} onChange={(e) => set({ prenom: e.target.value })} />
            <Input label="Nom" required value={values.nom} onChange={(e) => set({ nom: e.target.value })} />
          </div>
        </>
      ) : (
        <Input
          label="Raison sociale"
          required
          placeholder={values.type === 'morale' ? 'ex. SCI Les Tilleuls' : 'ex. Crédit Agricole'}
          value={values.raison_sociale}
          onChange={(e) => set({ raison_sociale: e.target.value })}
        />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Input label="Email" type="email" value={values.email} onChange={(e) => set({ email: e.target.value })} />
        <Input label="Téléphone" value={values.telephone} onChange={(e) => set({ telephone: e.target.value })} />
      </div>

      <Input label="Adresse" value={values.adresse} onChange={(e) => set({ adresse: e.target.value })} />
    </div>
  )
}
