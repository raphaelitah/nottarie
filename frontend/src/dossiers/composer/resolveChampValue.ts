import { parseChampSource } from '../../trames/champSource'
import type { Comparant, Etude } from '../../types/database'

export type ChampResolver = (source: string) => string | null

export function createChampResolver(etude: Etude | null, notaireNom: string, comparants: Comparant[]): ChampResolver {
  return function resolve(source: string): string | null {
    const parsed = parseChampSource(source)
    if (!parsed) return null

    if (parsed.kind === 'session') {
      if (parsed.attribute === 'date_acte') return new Date().toLocaleDateString('fr-FR')
      if (parsed.attribute === 'notaire_nom') return notaireNom.trim() || null
      return null
    }

    if (parsed.kind === 'etude') {
      if (parsed.attribute === 'raison_sociale') return etude?.raison_sociale ?? null
      if (parsed.attribute === 'ville') return etude?.ville ?? null
      if (parsed.attribute === 'adresse') return etude?.adresse_ligne1 ?? null
      return null
    }

    // comparant:<qualite>:<attribute> — resolved from the matching comparant's personne.
    const comparant = comparants.find((c) => c.qualite === parsed.qualite)
    const personne = comparant?.personne
    if (!personne) return null
    const raw = (personne as unknown as Record<string, unknown>)[parsed.attribute]
    if (raw == null || raw === '') return null
    if (parsed.attribute === 'date_naissance' || parsed.attribute === 'date_deces') {
      return new Date(String(raw)).toLocaleDateString('fr-FR')
    }
    if (parsed.attribute === 'nom') return String(raw).toUpperCase()
    return String(raw)
  }
}

export interface TiptapNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  text?: string
  marks?: unknown[]
}

// Applied to a section's content before it's fed into the composer's editor
// (initial standard model, or a section inserted at the cursor) — champ nodes
// get their `value` pre-filled wherever the source resolves.
export function withResolvedValues<T extends TiptapNode>(node: T, resolve: ChampResolver): T {
  if (node.type === 'champ') {
    const source = typeof node.attrs?.source === 'string' ? node.attrs.source : null
    const resolved = source ? resolve(source) : null
    return { ...node, attrs: { ...node.attrs, value: resolved ?? '' } }
  }
  if (node.content) {
    return { ...node, content: node.content.map((c) => withResolvedValues(c, resolve)) }
  }
  return node
}
