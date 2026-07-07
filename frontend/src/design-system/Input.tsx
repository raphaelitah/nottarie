import { useState, type ReactNode, type ChangeEvent } from 'react'

interface InputProps {
  label?: string
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  error?: string
  helper?: string
  disabled?: boolean
  required?: boolean
  type?: string
  prefix?: ReactNode
  suffix?: ReactNode
  id?: string
  list?: string
}

export function Input({
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  error,
  helper,
  disabled = false,
  required = false,
  type = 'text',
  prefix,
  suffix,
  id,
  list,
}: InputProps) {
  const [focused, setFocused] = useState(false)
  const inputId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined)

  const borderColor = error ? '#7F1D1D' : focused ? '#1E2D45' : '#E0DFE8'
  const boxShadow =
    error && focused
      ? '0 0 0 3px rgba(127, 29, 29, 0.14)'
      : focused
      ? '0 0 0 3px rgba(30, 45, 69, 0.14)'
      : 'none'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily: "'Sora', system-ui, sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            color: disabled ? '#C5C3CF' : '#2D2C3C',
            letterSpacing: '-0.01em',
          }}
        >
          {label}
          {required && <span style={{ color: '#A07600', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: '10px',
            color: '#716E84', display: 'flex', alignItems: 'center',
            pointerEvents: 'none',
          }}>{prefix}</span>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          list={list}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            height: '36px',
            padding: `0 ${suffix ? '32px' : '12px'} 0 ${prefix ? '32px' : '12px'}`,
            fontFamily: "'Sora', system-ui, sans-serif",
            fontSize: '14px',
            color: disabled ? '#C5C3CF' : '#1A1924',
            background: disabled ? '#F5F5F8' : '#FFFFFF',
            border: `1px solid ${borderColor}`,
            borderRadius: '6px',
            outline: 'none',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
            letterSpacing: '-0.01em',
            cursor: disabled ? 'not-allowed' : 'text',
            boxShadow,
            boxSizing: 'border-box',
          }}
        />
        {suffix && (
          <span style={{
            position: 'absolute', right: '10px',
            color: '#716E84', display: 'flex', alignItems: 'center',
          }}>{suffix}</span>
        )}
      </div>
      {(error || helper) && (
        <span style={{
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: '12px',
          color: error ? '#7F1D1D' : '#716E84',
        }}>
          {error || helper}
        </span>
      )}
    </div>
  )
}
