export const PERSONNE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'physique', label: 'Personne physique' },
  { value: 'morale', label: 'Personne morale' },
  { value: 'tiers_partenaire', label: 'Tiers / partenaire' },
]

export const CIVILITE_OPTIONS = ['M.', 'Mme']

// Common comparant qualités across the MVP acte types (succession, donation) — offered
// as suggestions, not an enum: qualite is freeform text (BRD doesn't constrain it).
export const QUALITE_SUGGESTIONS = [
  'Défunt',
  'Héritier',
  'Conjoint survivant',
  'Donateur',
  'Donataire',
  'Notaire',
  'Tiers',
]
