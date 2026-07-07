import type { BaremeTranche } from '../../types/database'
import type { BaremeFormValues } from './BaremeFormDrawer'

export function baremeFormToTranches(values: BaremeFormValues): BaremeTranche[] {
  return values.tranches.map((t, i) => ({
    jusqu_a: i === values.tranches.length - 1 ? null : Number(t.jusqu_a),
    taux: Number(t.taux_pct) / 100,
  }))
}
