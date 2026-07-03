import { Input, Select } from '../design-system'
import type { Immeuble, RegimeBien } from '../types/database'
import { REGIME_BIEN_OPTIONS } from '../constants/regimeBien'

export interface ImmeubleFormValues {
  designation: string
  references_cadastrales: string
  regime: RegimeBien | ''
}

export const EMPTY_IMMEUBLE_FORM: ImmeubleFormValues = {
  designation: '',
  references_cadastrales: '',
  regime: '',
}

export function immeubleToForm(i: Immeuble): ImmeubleFormValues {
  return {
    designation: i.designation ?? '',
    references_cadastrales: i.references_cadastrales ?? '',
    regime: i.regime ?? '',
  }
}

export function immeubleDisplayName(i: Pick<Immeuble, 'designation' | 'references_cadastrales'>): string {
  return i.designation || i.references_cadastrales || 'Bien sans désignation'
}

export function immeubleFormError(values: ImmeubleFormValues): string | null {
  if (!values.designation.trim() && !values.references_cadastrales.trim()) {
    return 'Renseignez au moins la désignation ou les références cadastrales.'
  }
  return null
}

export function immeubleFormToInsertPayload(values: ImmeubleFormValues, tenantId: string) {
  return {
    tenant_id: tenantId,
    designation: values.designation.trim() || null,
    references_cadastrales: values.references_cadastrales.trim() || null,
    regime: values.regime || null,
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
      <Input
        label="Désignation"
        placeholder="ex. Maison, 12 rue de la Paix, 75002 Paris"
        value={values.designation}
        onChange={(e) => set({ designation: e.target.value })}
      />
      <Input
        label="Références cadastrales"
        placeholder="ex. Section AB n°123"
        value={values.references_cadastrales}
        onChange={(e) => set({ references_cadastrales: e.target.value })}
      />
      <Select
        label="Régime du bien"
        options={REGIME_BIEN_OPTIONS}
        value={values.regime}
        onChange={(e) => set({ regime: e.target.value as RegimeBien })}
      />
    </div>
  )
}
