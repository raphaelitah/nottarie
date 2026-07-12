import type { CSSProperties } from 'react'

interface PaginationProps {
  page: number
  pageCount: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pageCount, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div style={container}>
      <span style={summary}>
        {from}–{to} sur {totalItems}
      </span>
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
        <button
          type="button"
          style={{ ...navBtn, ...(page <= 1 ? navBtnDisabled : {}) }}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Précédent
        </button>
        <span style={pageLabel}>Page {page} / {pageCount}</span>
        <button
          type="button"
          style={{ ...navBtn, ...(page >= pageCount ? navBtnDisabled : {}) }}
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
        </button>
      </div>
    </div>
  )
}

const container: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: 'var(--space-4)',
  fontFamily: 'var(--font-sans)',
}

const summary: CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

const pageLabel: CSSProperties = {
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
  minWidth: '90px',
  textAlign: 'center',
}

const navBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  padding: '6px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--n-300, #C5C3CF)',
  background: '#FFFFFF',
  color: 'var(--n-900)',
  cursor: 'pointer',
}

const navBtnDisabled: CSSProperties = {
  opacity: 0.4,
  cursor: 'not-allowed',
}
