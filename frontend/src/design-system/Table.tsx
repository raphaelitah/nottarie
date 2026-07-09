import { useState, type ReactNode, type CSSProperties } from 'react'
import { MOBILE_QUERY, useMediaQuery } from './useMediaQuery'

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
  const cardView = useMediaQuery(MOBILE_QUERY)
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

  const cellValue = (col: TableColumn<T>, row: T): ReactNode =>
    col.render
      ? col.render((row as Record<string, unknown>)[col.key], row)
      : ((row as Record<string, unknown>)[col.key] as ReactNode) ?? '—'

  if (cardView) {
    const [titleCol, ...restCols] = columns
    const actionCols = restCols.filter((col) => !col.label)
    const fieldCols = restCols.filter((col) => col.label)

    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={cardStyle(false)}>
              <div style={{ height: '14px', borderRadius: '4px', background: '#F0EFF4', width: `${55 + (i * 17) % 35}%` }} />
              <div style={{ height: '11px', borderRadius: '4px', background: '#F0EFF4', width: `${35 + (i * 11) % 30}%`, marginTop: '10px' }} />
            </div>
          ))}
        </div>
      )
    }

    if (sorted.length === 0) {
      return (
        <div style={{
          background: '#FFFFFF', border: '1px solid #E0DFE8', borderRadius: '10px',
          padding: '40px 24px', textAlign: 'center',
          fontFamily: "'Sora', system-ui, sans-serif", fontSize: '14px', color: '#9B98AC',
        }}>
          {emptyLabel}
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sorted.map((row) => {
          const isSelected = selectedIds.includes(row.id)
          return (
            <div
              key={row.id}
              onClick={() => onRowClick?.(row)}
              style={cardStyle(isSelected, !!onRowClick)}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  {selectable && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleRow(row.id)}
                      style={{ cursor: 'pointer', accentColor: '#1E2D45', flexShrink: 0 }}
                    />
                  )}
                  {titleCol && (
                    <div style={{
                      fontFamily: titleCol.mono ? "'JetBrains Mono', monospace" : "'Sora', system-ui, sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      color: '#1A1924',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {cellValue(titleCol, row)}
                    </div>
                  )}
                </div>
                {actionCols.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {actionCols.map((col) => <span key={col.key}>{cellValue(col, row)}</span>)}
                  </div>
                )}
              </div>

              {fieldCols.length > 0 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '6px',
                  marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #F0EFF4',
                }}>
                  {fieldCols.map((col) => (
                    <div key={col.key} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <span style={{
                        fontFamily: "'Sora', system-ui, sans-serif",
                        fontSize: '11px', fontWeight: 600, color: '#9B98AC',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        flexShrink: 0,
                      }}>{col.label}</span>
                      <span style={{
                        fontFamily: col.mono ? "'JetBrains Mono', monospace" : "'Sora', system-ui, sans-serif",
                        fontSize: '13px', color: '#1A1924', textAlign: 'right',
                        minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{cellValue(col, row)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
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
    whiteSpace: 'nowrap',
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
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
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
                        {cellValue(col, row)}
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

function cardStyle(selected: boolean, clickable = false): CSSProperties {
  return {
    background: selected ? '#F6F3EE' : '#FFFFFF',
    border: '1px solid #E0DFE8',
    borderRadius: '10px',
    padding: '14px 16px',
    boxShadow: '0 1px 3px rgba(30,45,69,.06)',
    cursor: clickable ? 'pointer' : 'default',
    transition: 'background 150ms ease',
  }
}
