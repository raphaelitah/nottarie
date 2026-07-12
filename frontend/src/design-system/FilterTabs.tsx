import type { CSSProperties } from 'react'

interface FilterTabOption<T extends string> {
  value: T
  label: string
}

interface FilterTabsProps<T extends string> {
  options: FilterTabOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function FilterTabs<T extends string>({ options, value, onChange }: FilterTabsProps<T>) {
  return (
    <div style={container}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{ ...tab, ...(active ? tabActive : {}) }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

const container: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-1)',
  padding: '3px',
  background: 'var(--n-100, #F1F0F4)',
  borderRadius: 'var(--radius-md)',
  width: 'fit-content',
}

const tab: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
  padding: '6px 12px',
  borderRadius: 'var(--radius-sm, 4px)',
  border: '1px solid transparent',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background 150ms ease, color 150ms ease',
}

const tabActive: CSSProperties = {
  background: '#FFFFFF',
  color: 'var(--n-900)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
}
