import { Input, Select } from '../design-system'
import type { Immeuble, RegimeBien } from '../types/database'
import { REGIME_BIEN_OPTIONS } from '../constants/regimeBien'
import { TYPE_BIEN_OPTIONS } from '../constants/typeBien'

export interface ImmeubleFormValues {
  type_bien: string
  designation: string
  references_cadastrales: string
  regime: RegimeBien | ''
  adresse: string
  ville: string
  code_postal: string
  pays: string
}

export const EMPTY_IMMEUBLE_FORM: ImmeubleFormValues = {
  type_bien: '',
  designation: '',
  references_cadastrales: '',
  regime: '',
  adresse: '',
  ville: '',
  code_postal: '',
  pays: 'France',
}

export function immeubleToForm(i: Immeuble): ImmeubleFormValues {
  return {
    type_bien: i.type_bien ?? '',
    designation: i.designation ?? '',
    references_cadastrales: i.references_cadastrales ?? '',
    regime: i.regime ?? '',
    adresse: i.adresse ?? '',
    ville: i.ville ?? '',
    code_postal: i.code_postal ?? '',
    pays: i.pays ?? 'France',
  }
}

export function immeubleDisplayName(i: Pick<Immeuble, 'designation' | 'adresse' | 'references_cadastrales'>): string {
  return i.designation || i.adresse || i.references_cadastrales || 'Bien sans désignation'
}

export function immeubleFormError(values: ImmeubleFormValues): string | null {
  if (!values.designation.trim() && !values.adresse.trim() && !values.references_cadastrales.trim()) {
    return 'Renseignez au moins la désignation, l\'adresse ou les références cadastrales.'
  }
  return null
}

export function immeubleFormToInsertPayload(values: ImmeubleFormValues, tenantId: string) {
  return {
    tenant_id: tenantId,
    type_bien: values.type_bien || null,
    designation: values.designation.trim() || null,
    references_cadastrales: values.references_cadastrales.trim() || null,
    regime: values.regime || null,
    adresse: values.adresse.trim() || null,
    ville: values.ville.trim() || null,
    code_postal: values.code_postal.trim() || null,
    pays: values.pays.trim() || 'France',
  }
}

interface ImmeubleFieldsProps {
  values: ImmeubleFormValues
  onChange: (values: ImmeubleFormValues) => void
}

export function ImmeubleFields({ values, onChange }: ImmeubleFieldsProps) {
  const set = (patch: Partial<ImmeubleFormValues>) => onChange({ ...values, ...patch })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Select
          label="Type de bien"
          options={TYPE_BIEN_OPTIONS}
          value={values.type_bien}
          onChange={(e) => set({ type_bien: e.target.value })}
        />
        <Select
          label="Régime du bien"
          options={REGIME_BIEN_OPTIONS}
          value={values.regime}
          onChange={(e) => set({ regime: e.target.value as RegimeBien })}
        />
      </div>

      <Input
        label="Désignation"
        placeholder="ex. Maison familiale, Appartement T3…"
        value={values.designation}
        onChange={(e) => set({ designation: e.target.value })}
      />

      <Input
        label="Adresse"
        placeholder="ex. 12 rue de la Paix"
        value={values.adresse}
        onChange={(e) => set({ adresse: e.target.value })}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        <Input
          label="Code postal"
          value={values.code_postal}
          onChange={(e) => set({ code_postal: e.target.value })}
        />
        <Input
          label="Ville"
          value={values.ville}
          onChange={(e) => set({ ville: e.target.value })}
        />
      </div>

      <Input
        label="Pays"
        value={values.pays}
        onChange={(e) => set({ pays: e.target.value })}
      />

      <Input
        label="Références cadastrales"
        placeholder="ex. Section AB n°123"
        value={values.references_cadastrales}
        onChange={(e) => set({ references_cadastrales: e.target.value })}
      />
    </div>
  )
}
