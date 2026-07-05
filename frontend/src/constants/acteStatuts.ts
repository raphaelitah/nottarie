import type { BadgeStatus } from '../design-system'

const LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  a_signer: 'À signer',
  signe: 'Signé',
}

const BADGE_STATUS: Record<string, BadgeStatus> = {
  brouillon: 'draft',
  a_signer: 'pending',
  signe: 'signed',
}

export function acteStatutLabel(statut: string): string {
  return LABELS[statut] ?? statut
}

export function acteStatutBadgeStatus(statut: string): BadgeStatus {
  return BADGE_STATUS[statut] ?? 'ongoing'
}
