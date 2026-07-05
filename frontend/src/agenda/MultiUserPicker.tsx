import { MultiSelectPicker } from './MultiSelectPicker'
import type { Utilisateur } from '../types/database'
import { utilisateurLabel } from '../utilisateurs/utilisateurLabel'

interface MultiUserPickerProps {
  label?: string
  utilisateurs: Utilisateur[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function MultiUserPicker({ label = 'Participants', utilisateurs, selectedIds, onChange }: MultiUserPickerProps) {
  return (
    <MultiSelectPicker
      label={label}
      placeholder="Rechercher une personne de l'étude…"
      options={utilisateurs}
      selectedIds={selectedIds}
      onChange={onChange}
      getId={(u) => u.id}
      getLabel={(u) => utilisateurLabel(u)}
      emptyHint="Aucun autre membre à inviter."
    />
  )
}
