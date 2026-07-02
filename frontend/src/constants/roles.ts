import type { RoleNotarial } from '../types/database'

export const ROLE_OPTIONS: { value: RoleNotarial; label: string }[] = [
  { value: 'notaire', label: 'Notaire' },
  { value: 'redacteur', label: 'Clerc' },
  { value: 'formaliste', label: 'Formaliste' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'administrateur', label: 'Administrateur' },
]
