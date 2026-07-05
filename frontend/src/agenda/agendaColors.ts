import type { EvenementCategorie } from '../types/database'

export const DEFAULT_EVENT_COLOR = '#1E2D45'

export const CATEGORY_COLOR_PRESETS = [
  '#1E2D45', '#A07600', '#7F1D1D', '#14532D', '#1E3A8A', '#713F12', '#575468', '#9B2C6F',
]

export function resolveEventColor(event: { couleur: string | null; categorie?: EvenementCategorie | null }): string {
  return event.couleur || event.categorie?.couleur || DEFAULT_EVENT_COLOR
}
