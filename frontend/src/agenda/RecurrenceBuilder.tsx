import type { CSSProperties } from 'react'
import { Select, Input } from '../design-system'
import { WEEKDAY_LABELS, type RecurrenceOptions, type RecurrenceFrequency } from './eventRecurrence'

const FREQUENCY_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: 'none', label: 'Ne se répète pas' },
  { value: 'daily', label: 'Quotidienne' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuelle' },
  { value: 'yearly', label: 'Annuelle' },
]

const UNIT_LABELS: Record<Exclude<RecurrenceFrequency, 'none'>, string> = {
  daily: 'jour(s)',
  weekly: 'semaine(s)',
  monthly: 'mois',
  yearly: 'an(s)',
}

interface RecurrenceBuilderProps {
  value: RecurrenceOptions
  onChange: (value: RecurrenceOptions) => void
}

export function RecurrenceBuilder({ value, onChange }: RecurrenceBuilderProps) {
  function toggleWeekday(day: number) {
    const next = value.byWeekday.includes(day)
      ? value.byWeekday.filter((d) => d !== day)
      : [...value.byWeekday, day].sort()
    onChange({ ...value, byWeekday: next })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <Select
        label="Répétition"
        options={FREQUENCY_OPTIONS}
        value={value.frequency}
        onChange={(e) => onChange({ ...value, frequency: e.target.value as RecurrenceFrequency })}
      />

      {value.frequency !== 'none' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={labelStyle}>Tous les</span>
            <div style={{ width: '70px' }}>
              <Input
                type="number"
                value={String(value.interval)}
                onChange={(e) => onChange({ ...value, interval: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
            <span style={labelStyle}>{UNIT_LABELS[value.frequency]}</span>
          </div>

          {value.frequency === 'weekly' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={labelStyle}>Jours</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {WEEKDAY_LABELS.map((day) => {
                  const active = value.byWeekday.includes(day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekday(day.value)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        border: active ? '1px solid var(--color-ink)' : '1px solid var(--border-default)',
                        background: active ? 'var(--color-ink)' : 'var(--surface-base)',
                        color: active ? '#fff' : 'var(--n-900)',
                        fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >{day.label}</button>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={labelStyle}>Fin</label>

            <label style={radioRow}>
              <input
                type="radio"
                checked={value.end.type === 'never'}
                onChange={() => onChange({ ...value, end: { type: 'never' } })}
              />
              Jamais
            </label>

            <label style={radioRow}>
              <input
                type="radio"
                checked={value.end.type === 'on_date'}
                onChange={() => onChange({
                  ...value,
                  end: { type: 'on_date', date: value.end.type === 'on_date' ? value.end.date : new Date().toISOString().slice(0, 10) },
                })}
              />
              Le
              <div style={{ width: '160px' }}>
                <Input
                  type="date"
                  disabled={value.end.type !== 'on_date'}
                  value={value.end.type === 'on_date' ? value.end.date : ''}
                  onChange={(e) => onChange({ ...value, end: { type: 'on_date', date: e.target.value } })}
                />
              </div>
            </label>

            <label style={radioRow}>
              <input
                type="radio"
                checked={value.end.type === 'after_count'}
                onChange={() => onChange({
                  ...value,
                  end: { type: 'after_count', count: value.end.type === 'after_count' ? value.end.count : 5 },
                })}
              />
              Après
              <div style={{ width: '70px' }}>
                <Input
                  type="number"
                  disabled={value.end.type !== 'after_count'}
                  value={value.end.type === 'after_count' ? String(value.end.count) : ''}
                  onChange={(e) => onChange({ ...value, end: { type: 'after_count', count: Math.max(1, Number(e.target.value) || 1) } })}
                />
              </div>
              occurrences
            </label>
          </div>
        </>
      )}
    </div>
  )
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--n-800)',
}

const radioRow: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--n-800)', cursor: 'pointer',
}
