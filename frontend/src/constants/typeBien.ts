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
