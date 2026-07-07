import { useState, type ChangeEvent } from 'react'

interface TextareaProps {
  label?: string
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void
  error?: string
  helper?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  maxLength?: number
  id?: string
}

export function Textarea({
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  error,
  helper,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  id,
}: TextareaProps) {
  const [focused, setFocused] = useState(false)
  const [charCount, setCharCount] = useState((value || defaultValue || '').length)
  const areaId = id ?? (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined)

  const borderColor = error ? '#7F1D1D' : focused ? '#1E2D45' : '#E0DFE8'
  const boxShadow = focused
    ? error
      ? '0 0 0 3px rgba(127,29,29,.12)'
      : '0 0 0 3px rgba(30,45,69,.14)'
    : 'none'

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length)
    onChange?.(e)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label htmlFor={areaId} style={{
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: '13px', fontWeight: 500,
          color: disabled ? '#C5C3CF' : '#2D2C3C',
          letterSpacing: '-0.01em',
        }}>
          {label}
          {required && <span style={{ color: '#A07600', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontFamily: "'Sora', system-ui, sans-serif",
          fontSize: '14px',
          color: disabled ? '#C5C3CF' : '#1A1924',
          background: disabled ? '#F5F5F8' : '#FFFFFF',
          border: `1px solid ${borderColor}`,
          borderRadius: '6px',
          outline: 'none',
          resize: 'vertical',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
          letterSpacing: '-0.01em',
          lineHeight: 1.6,
          cursor: disabled ? 'not-allowed' : 'text',
          boxShadow,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {(error || helper) && (
          <span style={{
            fontFamily: "'Sora', system-ui, sans-serif",
            fontSize: '12px',
            color: error ? '#7F1D1D' : '#716E84',
          }}>{error || helper}</span>
        )}
        {maxLength && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: charCount > maxLength * 0.9 ? '#713F12' : '#9B98AC',
            marginLeft: 'auto',
          }}>{charCount}/{maxLength}</span>
        )}
      </div>
    </div>
  )
}
