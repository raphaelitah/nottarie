export const FORMALITE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'casier_judiciaire', label: 'Casier judiciaire' },
  { value: 'etat_hypothecaire', label: 'État hypothécaire' },
  { value: 'dia', label: 'DIA (déclaration d’intention d’aliéner)' },
  { value: 'publicite_fonciere', label: 'Publicité foncière' },
  { value: 'copie_document', label: 'Copie de document' },
]

export function formaliteTypeLabel(type: string): string {
  return FORMALITE_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}
