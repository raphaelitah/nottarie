import type { BadgeStatus } from '../design-system'

export const FORMALITE_STATUT_OPTIONS: { value: string; label: string }[] = [
  { value: 'a_envoyer', label: 'À envoyer' },
  { value: 'envoyee', label: 'Envoyée' },
  { value: 'relancee', label: 'Relancée' },
  { value: 'recue', label: 'Reçue' },
  { value: 'annulee', label: 'Annulée' },
]

export function formaliteStatutLabel(statut: string): string {
  return FORMALITE_STATUT_OPTIONS.find((o) => o.value === statut)?.label ?? statut
}

const BADGE_STATUS: Record<string, BadgeStatus> = {
  a_envoyer: 'draft',
  envoyee: 'pending',
  relancee: 'pending',
  recue: 'signed',
  annulee: 'refused',
}

export function formaliteBadgeStatus(statut: string): BadgeStatus {
  return BADGE_STATUS[statut] ?? 'draft'
}
