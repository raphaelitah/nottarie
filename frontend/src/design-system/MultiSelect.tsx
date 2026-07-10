import { useRef, useState } from 'react'

export interface MultiSelectOption {
  value: string
  label: string
  sublabel?: string
  badges?: string[]
  group?: string
  disabled?: boolean
}

interface MultiSelectProps {
  label?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  helper?: string
  disabled?: boolean
  onOpenChange?: (open: boolean) => void
}

export function MultiSelect({ label, options, value, onChange, placeholder = 'Sélectionner…', helper, disabled = false, onOpenChange }: MultiSelectProps) {
  const [open, setOpenState] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  function setOpen(next: boolean | ((o: boolean) => boolean)) {
    setOpenState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next
      onOpenChange?.(value)
      return value
    })
  }

  function toggle(optionValue: string) {
    onChange(value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue])
  }

  function remove(optionValue: string) {
    onChange(value.filter((v) => v !== optionValue))
  }

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) setOpen(false)
  }

  const selectedOptions = value.map((v) => options.find((o) => o.value === v)).filter((o): o is MultiSelectOption => !!o)

  const groups = new Map<string | undefined, MultiSelectOption[]>()
  for (const opt of options) {
    const list = groups.get(opt.group) ?? []
    list.push(opt)
    groups.set(opt.group, list)
  }

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }} onBlur={handleBlur}>
      {label && (
        <label style={{
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: '13px', fontWeight: 500,
          color: disabled ? '#C5C3CF' : '#2D2C3C',
          letterSpacing: '-0.01em',
        }}>{label}</label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          minHeight: '36px',
          padding: '6px 32px 6px 12px',
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: '14px',
          color: disabled ? '#C5C3CF' : selectedOptions.length ? '#1A1924' : '#8A8798',
          background: disabled ? '#F5F5F8' : '#FFFFFF',
          border: `1px solid ${open ? '#1E2D45' : '#E0DFE8'}`,
          borderRadius: '6px',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          position: 'relative',
          boxShadow: open ? '0 0 0 3px rgba(30,45,69,.14)' : 'none',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}
      >
        {selectedOptions.length === 0 ? (
          placeholder
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {selectedOptions.map((opt) => (
              <span
                key={opt.value}
                onClick={(e) => { e.stopPropagation(); remove(opt.value) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  background: '#EFEEF6', borderRadius: '4px', padding: '2px 6px',
                  fontSize: '13px', color: '#1A1924',
                }}
              >
                {opt.label}
                <span style={{ color: '#716E84' }}>×</span>
              </span>
            ))}
          </div>
        )}
        <span style={{
          position: 'absolute', right: '10px', top: '10px',
          pointerEvents: 'none', color: disabled ? '#C5C3CF' : '#716E84',
          fontSize: '12px', lineHeight: 1,
        }}>▾</span>
      </button>

      {open && !disabled && (
        <div
          tabIndex={-1}
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', zIndex: 20,
            background: '#FFFFFF', border: '1px solid #E0DFE8', borderRadius: '6px',
            boxShadow: '0 4px 16px rgba(0,0,0,.08)', maxHeight: '260px', overflowY: 'auto', padding: '6px',
          }}
        >
          {options.length === 0 && (
            <div style={{ padding: '8px', fontSize: '13px', color: '#716E84', fontFamily: "'Sora', system-ui, sans-serif" }}>
              Aucune option disponible.
            </div>
          )}
          {[...groups.entries()].map(([group, opts]) => (
            <div key={group ?? '__default'}>
              {group && (
                <div style={{
                  padding: '6px 8px 2px', fontSize: '11px', fontWeight: 700, color: '#716E84',
                  textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'Sora', system-ui, sans-serif",
                }}>{group}</div>
              )}
              {opts.map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '4px',
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    opacity: opt.disabled ? 0.5 : 1,
                    fontFamily: "'Sora', system-ui, sans-serif", fontSize: '13px', color: '#1A1924',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(opt.value)}
                    disabled={opt.disabled}
                    onChange={() => toggle(opt.value)}
                  />
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>
                      {opt.label}
                      {opt.sublabel && <span style={{ color: '#716E84' }}> — {opt.sublabel}</span>}
                    </span>
                    {opt.badges?.map((b) => (
                      <span key={b} style={{
                        fontSize: '11px', fontWeight: 600, color: '#3B4B66', background: '#E6ECF5',
                        borderRadius: '4px', padding: '1px 6px', letterSpacing: '0.01em',
                      }}>{b}</span>
                    ))}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}

      {helper && (
        <span style={{ fontFamily: "'Sora', system-ui, sans-serif", fontSize: '12px', color: '#716E84' }}>{helper}</span>
      )}
    </div>
  )
}
