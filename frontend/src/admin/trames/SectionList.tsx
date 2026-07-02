import type { CSSProperties } from 'react'
import type { TrameSection } from '../../types/database'
import { SectionRow } from './SectionRow'

interface SectionListProps {
  sections: TrameSection[]
  search: string
  onEdit: (s: TrameSection) => void
  onDuplicate: (s: TrameSection) => void
  onArchive: (s: TrameSection) => void
}

export function SectionList({ sections, search, onEdit, onDuplicate, onArchive }: SectionListProps) {
  const query = search.trim().toLowerCase()
  const filtered = query
    ? sections.filter((s) =>
        s.title.toLowerCase().includes(query) ||
        (s.category ?? '').toLowerCase().includes(query)
      )
    : sections

  if (filtered.length === 0) {
    return <div style={emptyState}>Aucune section {query ? 'ne correspond à cette recherche' : "n'a encore été créée"}.</div>
  }

  const byCategory = new Map<string, TrameSection[]>()
  for (const s of filtered) {
    const key = s.category ?? ''
    const list = byCategory.get(key) ?? []
    list.push(s)
    byCategory.set(key, list)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {Array.from(byCategory.entries()).map(([category, rows]) => (
        <div key={category}>
          <div style={categoryHeading}>{category}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {rows.map((s) => (
              <SectionRow
                key={s.id}
                section={s}
                onEdit={() => onEdit(s)}
                onDuplicate={() => onDuplicate(s)}
                onArchive={() => onArchive(s)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
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
