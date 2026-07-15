export const PERSONNE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'physique', label: 'Personne physique' },
  { value: 'morale', label: 'Personne morale' },
  { value: 'tiers_partenaire', label: 'Tiers / partenaire' },
]

export const CIVILITE_OPTIONS = ['M.', 'Mme']

export const FORME_JURIDIQUE_OPTIONS = ['SCI', 'SARL', 'SAS', 'SA', 'Association', 'Autre']

export const SITUATION_MATRIMONIALE_OPTIONS = [
  'Célibataire',
  'Marié(e)',
  'Pacsé(e)',
  'Divorcé(e)',
  'Veuf/Veuve',
]

export const REGIME_MATRIMONIAL_OPTIONS = [
  'Communauté légale',
  'Communauté universelle',
  'Séparation de biens',
  'Participation aux acquêts',
  'Non marié(e)',
]

export const FONCTION_CONTACT_OPTIONS = [
  { value: 'notaire', label: 'Notaire' },
  { value: 'clerc', label: 'Clerc' },
  { value: 'assistant', label: 'Assistant(e)' },
  { value: 'autre', label: 'Autre' },
]

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

// Qualités réservées aux sujets du dossier (parties prenantes de l'acte) : un tiers/partenaire
// ne peut pas les porter, il ne fait que participer (ex. géomètre, expert, notaire adverse).
export const QUALITES_SUJET = ['défunt', 'héritier', 'conjoint survivant', 'donateur', 'donataire']
