import { Input, NumberInput, Select } from '../design-system'
import type { RegimeBien } from '../types/database'
import { REGIME_BIEN_OPTIONS } from '../constants/regimeBien'
import { TYPE_BIEN_OPTIONS } from '../constants/typeBien'
import type { ImmeubleFormValues } from './immeubleForm'

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

      <NumberInput
        label="Valeur déclarée (€)"
        placeholder="ex. 250 000"
        value={values.valeur_declaree}
        onChange={(e) => set({ valeur_declaree: e.target.value })}
      />

      <NumberInput
        label="Nombre de parts total"
        placeholder="ex. 100"
        helper="Utilisé pour répartir la propriété entre les propriétaires en nombre de parts."
        value={values.nombre_parts_total}
        onChange={(e) => set({ nombre_parts_total: e.target.value })}
      />
    </div>
  )
}
