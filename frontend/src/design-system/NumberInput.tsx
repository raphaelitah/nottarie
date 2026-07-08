import { useEffect, useRef, type ChangeEvent, type ReactNode } from 'react'
import { Input } from './Input'

interface NumberInputProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
  error?: string
  helper?: string
  disabled?: boolean
  required?: boolean
  suffix?: ReactNode
  prefix?: ReactNode
  id?: string
}

function sanitizeDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}

function formatGrouped(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function digitsBefore(text: string, index: number): number {
  return sanitizeDigits(text.slice(0, index)).length
}

function positionAfterDigitCount(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      seen++
      if (seen === digitCount) return i + 1
    }
  }
  return formatted.length
}

// Formats an integer input with spaces as thousand separators (French convention),
// while keeping the underlying value a plain digit string so callers' Number(value)
// conversions are unaffected. Restores cursor position across reformatting.
export function NumberInput({ value = '', onChange, ...rest }: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const pendingCursorDigits = useRef<number | null>(null)
  const displayValue = formatGrouped(sanitizeDigits(value))

  useEffect(() => {
    if (pendingCursorDigits.current === null || !inputRef.current) return
    const pos = positionAfterDigitCount(displayValue, pendingCursorDigits.current)
    inputRef.current.setSelectionRange(pos, pos)
    pendingCursorDigits.current = null
  }, [displayValue])

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const cursor = e.target.selectionStart ?? e.target.value.length
    pendingCursorDigits.current = digitsBefore(e.target.value, cursor)
    const newDigits = sanitizeDigits(e.target.value)
    onChange?.({ target: { value: newDigits } } as ChangeEvent<HTMLInputElement>)
  }

  return (
    <Input
      {...rest}
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
    />
  )
}
