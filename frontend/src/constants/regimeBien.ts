export const REGIME_BIEN_OPTIONS: { value: string; label: string }[] = [
  { value: 'propre', label: 'Propre' },
  { value: 'communaute', label: 'Communauté' },
]

export function regimeBienLabel(regime: string | null): string {
  if (!regime) return '—'
  return REGIME_BIEN_OPTIONS.find((o) => o.value === regime)?.label ?? regime
}
