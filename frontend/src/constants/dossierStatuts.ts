export const DOSSIER_STATUT_OPTIONS: { value: string; label: string }[] = [
  { value: 'ouvert', label: 'Ouvert' },
  { value: 'cloture', label: 'Clôturé' },
]

export function dossierStatutLabel(statut: string): string {
  return DOSSIER_STATUT_OPTIONS.find((o) => o.value === statut)?.label ?? statut
}
