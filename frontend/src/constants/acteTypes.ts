import type { BrancheDroit } from '../types/database'

// MVP scope (BRD §10): 2-type trame library in Droit de la famille.
export const ACTE_TYPE_OPTIONS: { value: string; label: string; branche: BrancheDroit }[] = [
  { value: 'succession', label: 'Succession', branche: 'famille' },
  { value: 'donation', label: 'Donation', branche: 'famille' },
]

export function acteTypeLabel(typeActe: string): string {
  return ACTE_TYPE_OPTIONS.find((o) => o.value === typeActe)?.label ?? typeActe
}
