import React, { useState, type ReactNode, type CSSProperties } from 'react'

export interface TableColumn<T = Record<string, unknown>> {
  key: string
  label: string
  width?: string
  align?: CSSProperties['textAlign']
  sortable?: boolean
  mono?: boolean
  render?: (value: unknown, row: T) => ReactNode
}

interface TableProps<T extends { id: string | number }> {
  columns?: TableColumn<T>[]
  rows?: T[]
  onRowClick?: (row: T) => void
  selectable?: boolean
  selectedIds?: (string | number)[]
  onSelectionChange?: (ids: (string | number)[]) => void
  loading?: boolean
  emptyLabel?: string
  defaultSort?: { key: string; dir: 'asc' | 'desc' }
}

export function Table<T extends { id: string | number }>({
  columns = [],
  rows = [],
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  loading = false,
  emptyLabel = 'Aucun résultat',
  defaultSort,
}: TableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(defaultSort ?? null)

  const handleSort = (col: TableColumn<T>) => {
    if (!col.sortable) return
    setSort((prev) =>
      prev?.key === col.key
        ? { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key: col.key, dir: 'asc' }
    )
  }

  const sorted = sort
    ? [...rows].sort((a, b) => {
        const va = (a as Record<string, unknown>)[sort.key] ?? ''
        const vb = (b as Record<string, unknown>)[sort.key] ?? ''
        const cmp = String(va).localeCompare(String(vb), 'fr', { sensitivity: 'base' })
        return sort.dir === 'asc' ? cmp : -cmp
      })
    : rows

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id))

  const toggleAll = () => {
    if (!onSelectionChange) return
    onSelectionChange(allSelected ? [] : rows.map((r) => r.id))
  }

  const toggleRow = (id: string | number) => {
    if (!onSelectionChange) return
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    )
  }

  const thStyle = (col: Partial<TableColumn<T>>): CSSProperties => ({
    padding: '10px 14px',
    textAlign: col.align ?? 'left',
    fontFamily: "'Sora', system-ui, sans-serif",
    fontSize: '11px',
    fontWeight: 600,
    color: '#716E84',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    borderBottom: '1px solid #E0DFE8',
    background: '#F5F5F8',
    userSelect: 'none',
    cursor: col.sortable ? 'pointer' : 'default',
    whiteSpace: 'nowrap',
    width: col.width,
  })

  const tdStyle = (col: Partial<TableColumn<T>>): CSSProperties => ({
    padding: '12px 14px',
    textAlign: col.align ?? 'left',
    fontFamily: col.mono ? "'JetBrains Mono', monospace" : "'Sora', system-ui, sans-serif",
    fontSize: '13px',
    color: '#1A1924',
    borderBottom: '1px solid #F0EFF4',
    verticalAlign: 'middle',
  })

  const sortIcon = (col: TableColumn<T>) => {
    if (!col.sortable) return null
    if (sort?.key !== col.key) return <span style={{ color: '#C5C3CF', marginLeft: '4px' }}>↕</span>
    return <span style={{ color: '#1E2D45', marginLeft: '4px' }}>{sort.dir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E0DFE8',
      borderRadius: '10px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(30,45,69,.06)',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              {selectable && (
                <th style={{ ...thStyle({}), width: '44px', paddingLeft: '16px' }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    style={{ cursor: 'pointer', accentColor: '#1E2D45' }}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} style={thStyle(col)} onClick={() => handleSort(col)}>
                  {col.label}{sortIcon(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {selectable && <td style={tdStyle({})} />}
                  {columns.map((col) => (
                    <td key={col.key} style={tdStyle(col)}>
                      <div style={{
                        height: '14px', borderRadius: '4px',
                        background: '#F0EFF4',
                        width: `${55 + (i * 13 + col.key.length * 7) % 35}%`,
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  style={{
                    padding: '40px 24px',
                    textAlign: 'center',
                    fontFamily: "'Sora', system-ui, sans-serif",
                    fontSize: '14px',
                    color: '#9B98AC',
                  }}
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              sorted.map((row) => {
                const isSelected = selectedIds.includes(row.id)
                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    style={{
                      background: isSelected ? '#F6F3EE' : '#FFFFFF',
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background 150ms ease',
                    }}
                  >
                    {selectable && (
                      <td
                        style={{ ...tdStyle({}), paddingLeft: '16px' }}
                        onClick={(e) => { e.stopPropagation(); toggleRow(row.id) }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(row.id)}
                          style={{ cursor: 'pointer', accentColor: '#1E2D45' }}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} style={tdStyle(col)}>
                        {col.render
                          ? col.render((row as Record<string, unknown>)[col.key], row)
                          : ((row as Record<string, unknown>)[col.key] as ReactNode) ?? '—'}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
