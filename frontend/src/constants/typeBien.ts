export const TYPE_BIEN_OPTIONS: { value: string; label: string }[] = [
  { value: 'maison', label: 'Maison' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'immeuble', label: 'Immeuble entier' },
  { value: 'local_commercial', label: 'Local commercial' },
  { value: 'local_professionnel', label: 'Local professionnel' },
  { value: 'terrain_a_batir', label: 'Terrain à bâtir' },
  { value: 'terrain_agricole', label: 'Terrain agricole' },
  { value: 'garage_parking', label: 'Garage / Parking' },
  { value: 'cave', label: 'Cave' },
  { value: 'local_industriel', label: 'Local industriel' },
  { value: 'bien_mixte', label: 'Bien à usage mixte' },
  { value: 'autre', label: 'Autre' },
]

export function typeBienLabel(type: string | null): string {
  if (!type) return '—'
  return TYPE_BIEN_OPTIONS.find((o) => o.value === type)?.label ?? type
}

export type TypeBienGroup = 'residentiel' | 'commercial' | 'terrain' | 'autre'

const TYPE_BIEN_GROUPS: Record<string, TypeBienGroup> = {
  maison: 'residentiel',
  appartement: 'residentiel',
  immeuble: 'residentiel',
  local_commercial: 'commercial',
  local_professionnel: 'commercial',
  local_industriel: 'commercial',
  terrain_a_batir: 'terrain',
  terrain_agricole: 'terrain',
  garage_parking: 'autre',
  cave: 'autre',
  bien_mixte: 'autre',
  autre: 'autre',
}

export function typeBienGroup(type: string | null): TypeBienGroup | null {
  if (!type) return null
  return TYPE_BIEN_GROUPS[type] ?? 'autre'
}
