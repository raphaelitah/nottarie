import type { SectionVariable } from '../../../types/database'

interface JSONNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: JSONNode[]
}

// The `variables` column is derived from the "champ" nodes in the document,
// which are the single source of truth — this keeps them from drifting apart.
export function extractVariablesFromDoc(doc: JSONNode | Record<string, unknown>): SectionVariable[] {
  const found = new Map<string, SectionVariable>()

  function walk(node: JSONNode | undefined) {
    if (!node) return
    if (node.type === 'champ' && node.attrs) {
      const key = String(node.attrs.key ?? '')
      if (key) {
        found.set(key, {
          key,
          label: String(node.attrs.label ?? ''),
          field_type: node.attrs.fieldType === 'manuel' ? 'manuel' : 'auto',
          source: typeof node.attrs.source === 'string' ? node.attrs.source : null,
        })
      }
    }
    node.content?.forEach(walk)
  }

  walk(doc as JSONNode)
  return Array.from(found.values())
}
