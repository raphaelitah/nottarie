import type { CSSProperties } from 'react'
import type { TrameParagraph } from '../../types/database'
import { ACTE_TYPE_OPTIONS } from '../../constants/acteTypes'
import { ParagraphRow } from './ParagraphRow'

interface ParagraphGroupedListProps {
  paragraphs: TrameParagraph[]
  search: string
  onEdit: (p: TrameParagraph) => void
  onDuplicate: (p: TrameParagraph) => void
  onArchive: (p: TrameParagraph) => void
}

function acteTypeLabel(typeActe: string): string {
  return ACTE_TYPE_OPTIONS.find((o) => o.value === typeActe)?.label ?? typeActe
}

export function ParagraphGroupedList({ paragraphs, search, onEdit, onDuplicate, onArchive }: ParagraphGroupedListProps) {
  const query = search.trim().toLowerCase()
  const filtered = query
    ? paragraphs.filter((p) =>
        p.title.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        acteTypeLabel(p.type_acte).toLowerCase().includes(query)
      )
    : paragraphs

  if (filtered.length === 0) {
    return <div style={emptyState}>Aucun paragraphe {query ? 'ne correspond à cette recherche' : "n'a encore été créé"}.</div>
  }

  const byActeType = new Map<string, TrameParagraph[]>()
  for (const p of filtered) {
    const list = byActeType.get(p.type_acte) ?? []
    list.push(p)
    byActeType.set(p.type_acte, list)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-7)' }}>
      {Array.from(byActeType.entries()).map(([typeActe, items]) => {
        const byCategory = new Map<string, TrameParagraph[]>()
        for (const p of items) {
          const list = byCategory.get(p.category) ?? []
          list.push(p)
          byCategory.set(p.category, list)
        }
        return (
          <div key={typeActe}>
            <div style={acteTypeHeading}>{acteTypeLabel(typeActe)}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {Array.from(byCategory.entries()).map(([category, rows]) => (
                <div key={category}>
                  <div style={categoryHeading}>{category}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {rows.map((p) => (
                      <ParagraphRow
                        key={p.id}
                        paragraph={p}
                        onEdit={() => onEdit(p)}
                        onDuplicate={() => onDuplicate(p)}
                        onArchive={() => onArchive(p)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const acteTypeHeading: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  fontWeight: 700,
  color: 'var(--n-900)',
  marginBottom: 'var(--space-3)',
  paddingBottom: 'var(--space-2)',
  borderBottom: '1px solid var(--border-default)',
}

const categoryHeading: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-2)',
}

const emptyState: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  textAlign: 'center',
  padding: 'var(--space-10)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
}
