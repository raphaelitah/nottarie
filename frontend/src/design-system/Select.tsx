import { useState, type ChangeEvent } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  options?: (string | SelectOption)[]
  value?: string
  defaultValue?: string
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void
  placeholder?: string
  error?: string
  helper?: string
  disabled?: boolean
  required?: boolean
  id?: string
  height?: string
}

export function Select({
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder = 'Sélectionner…',
  error,
  helper,
  disabled = false,
  required = false,
  id,
  height = '36px',
}: SelectProps) {
  const [focused, setFocused] = useState(false)
  const selectId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined)

  const borderColor = error ? '#7F1D1D' : focused ? '#1E2D45' : '#E0DFE8'
  const boxShadow = focused
    ? error
      ? '0 0 0 3px rgba(127,29,29,.12)'
      : '0 0 0 3px rgba(30,45,69,.14)'
    : 'none'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label htmlFor={selectId} style={{
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: '13px', fontWeight: 500,
          color: disabled ? '#C5C3CF' : '#2D2C3C',
          letterSpacing: '-0.01em',
        }}>
          {label}
          {required && <span style={{ color: '#A07600', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          id={selectId}
          {...(value !== undefined ? { value } : { defaultValue: defaultValue ?? '' })}
          onChange={onChange}
          disabled={disabled}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            height,
            padding: '0 32px 0 12px',
            fontFamily: "'Sora', system-ui, sans-serif",
            fontSize: '14px',
            color: disabled ? '#C5C3CF' : '#1A1924',
            background: disabled ? '#F5F5F8' : '#FFFFFF',
            border: `1px solid ${borderColor}`,
            borderRadius: '6px',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
            letterSpacing: '-0.01em',
            boxShadow,
          }}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => {
            const v = typeof opt === 'string' ? opt : opt.value
            const l = typeof opt === 'string' ? opt : opt.label
            return <option key={v} value={v}>{l}</option>
          })}
        </select>
        <span style={{
          position: 'absolute', right: '10px', top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none', color: disabled ? '#C5C3CF' : '#716E84',
          fontSize: '12px', lineHeight: 1,
        }}>▾</span>
      </div>
      {(error || helper) && (
        <span style={{
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: '12px',
          color: error ? '#7F1D1D' : '#716E84',
        }}>{error || helper}</span>
      )}
    </div>
  )
}
