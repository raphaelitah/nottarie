import type { CSSProperties } from 'react'
import { Badge, Button } from '../../design-system'
import type { TrameSection } from '../../types/database'

interface SectionRowProps {
  section: TrameSection
  onEdit: () => void
  onDuplicate: () => void
  onArchive: () => void
}

export function SectionRow({ section, onEdit, onDuplicate, onArchive }: SectionRowProps) {
  return (
    <div style={row}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
        <span style={title}>{section.title}</span>
        <Badge status={section.is_published ? 'published' : 'draft'} size="sm" />
        {section.variables.length > 0 && (
          <span style={variableCount}>{section.variables.length} champ{section.variables.length > 1 ? 's' : ''}</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
        <Button variant="ghost" size="sm" onClick={onEdit}>Modifier</Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate}>Dupliquer</Button>
        {section.is_published && (
          <Button variant="ghost" size="sm" onClick={onArchive}>Archiver</Button>
        )}
      </div>
    </div>
  )
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
}

const title: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const variableCount: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-2xs)',
  color: 'var(--text-muted)',
  flexShrink: 0,
}
