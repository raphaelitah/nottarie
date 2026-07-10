import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Input } from '../design-system'

interface MultiSelectPickerProps<T> {
  label?: string
  placeholder?: string
  options: T[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  getId: (item: T) => string
  getLabel: (item: T) => string
  getBadges?: (item: T) => string[]
  emptyHint?: string
}

export function MultiSelectPicker<T>({
  label,
  placeholder = 'Rechercher…',
  options,
  selectedIds,
  onChange,
  getId,
  getLabel,
  getBadges,
  emptyHint = 'Aucun résultat.',
}: MultiSelectPickerProps<T>) {
  const [search, setSearch] = useState('')

  const selectedItems = selectedIds
    .map((id) => options.find((o) => getId(o) === id))
    .filter((o): o is T => !!o)

  const available = options.filter((o) => !selectedIds.includes(getId(o)))
  const query = search.trim().toLowerCase()
  const results = (query ? available.filter((o) => getLabel(o).toLowerCase().includes(query)) : available).slice(0, 8)

  function addItem(id: string) {
    onChange([...selectedIds, id])
    setSearch('')
  }
  function removeItem(id: string) {
    onChange(selectedIds.filter((s) => s !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && <label style={labelStyle}>{label}</label>}

      {selectedItems.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {selectedItems.map((item) => (
            <span key={getId(item)} style={chip}>
              {getLabel(item)}
              {getBadges?.(item).map((b) => (
                <span key={b} style={badge}>{b}</span>
              ))}
              <button type="button" onClick={() => removeItem(getId(item))} style={chipRemove} aria-label="Retirer">×</button>
            </span>
          ))}
        </div>
      )}

      <Input placeholder={placeholder} value={search} onChange={(e) => setSearch(e.target.value)} />

      {results.length > 0 && (
        <div style={resultsList}>
          {results.map((item) => (
            <button key={getId(item)} type="button" style={resultRow} onClick={() => addItem(getId(item))}>
              <span style={resultRowContent}>
                {getLabel(item)}
                {getBadges?.(item).map((b) => (
                  <span key={b} style={badge}>{b}</span>
                ))}
              </span>
            </button>
          ))}
        </div>
      )}

      {results.length === 0 && available.length === 0 && (
        <p style={emptyHintStyle}>{emptyHint}</p>
      )}
    </div>
  )
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--n-800)',
  letterSpacing: '-0.01em',
}

const chip: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 6px 4px 10px',
  background: 'var(--surface-muted)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-full)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--n-900)',
}

const chipRemove: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  border: 'none',
  background: 'transparent',
  color: 'var(--n-500)',
  cursor: 'pointer',
  fontSize: '13px',
  lineHeight: 1,
  padding: 0,
}

const resultsList: CSSProperties = {
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
}

const resultRow: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '10px 14px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
  background: 'var(--surface-base)',
  border: 'none',
  borderBottom: '1px solid var(--border-default)',
  cursor: 'pointer',
}

const resultRowContent: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '6px',
}

const badge: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--n-700)',
  background: 'var(--surface-muted)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-sm, 4px)',
  padding: '1px 6px',
  letterSpacing: '0.01em',
}

const emptyHintStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  margin: 0,
}
