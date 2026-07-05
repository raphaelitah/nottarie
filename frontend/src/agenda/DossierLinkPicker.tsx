import { MultiSelectPicker } from './MultiSelectPicker'
import type { Dossier } from '../types/database'

function dossierLabel(d: Dossier): string {
  return d.numero ? `${d.numero} — ${d.type_acte}` : d.type_acte
}

interface DossierLinkPickerProps {
  label?: string
  dossiers: Dossier[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function DossierLinkPicker({ label = 'Dossiers liés', dossiers, selectedIds, onChange }: DossierLinkPickerProps) {
  return (
    <MultiSelectPicker
      label={label}
      placeholder="Rechercher un dossier par numéro…"
      options={dossiers}
      selectedIds={selectedIds}
      onChange={onChange}
      getId={(d) => d.id}
      getLabel={dossierLabel}
      emptyHint="Aucun dossier à lier."
    />
  )
}
