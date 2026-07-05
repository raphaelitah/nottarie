import type { BaremeContent } from '../../types/database'

export interface CoutAssiette {
  immeubles: number
  autresActifs: number
  passif: number
}

export interface CoutBreakdown {
  assietteNette: number
  emolumentsHt: number
  tva: number
  csi: number
  debours: number
  total: number
}

// Applies the degressive tranche table from a bareme (Code de commerce, tarif
// réglementé des notaires): each bracket's rate applies only to the slice of
// the assiette that falls within it, not to the whole amount.
function applyTranches(assiette: number, tranches: BaremeContent['tranches']): number {
  let remaining = assiette
  let floor = 0
  let total = 0
  for (const { jusqu_a, taux } of tranches) {
    const ceiling = jusqu_a ?? Infinity
    const trancheWidth = Math.max(0, Math.min(remaining, ceiling - floor))
    total += trancheWidth * taux
    floor = ceiling
    remaining -= trancheWidth
    if (remaining <= 0) break
  }
  return total
}

export function computeCout(bareme: BaremeContent, assiette: CoutAssiette): CoutBreakdown {
  const assietteNette = Math.max(0, assiette.immeubles + assiette.autresActifs - assiette.passif)
  const emolumentsHt = applyTranches(assietteNette, bareme.tranches)
  const tva = emolumentsHt * bareme.tva_taux
  const csi = Math.max(0, assiette.immeubles) * bareme.csi_taux
  const debours = bareme.debours_estimation_defaut
  const total = emolumentsHt + tva + csi + debours
  return { assietteNette, emolumentsHt, tva, csi, debours, total }
}
