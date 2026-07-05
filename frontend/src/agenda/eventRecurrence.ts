import { RRule, type Frequency, type Options } from 'rrule'

export type RecurrenceFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export type RecurrenceEnd =
  | { type: 'never' }
  | { type: 'on_date'; date: string }
  | { type: 'after_count'; count: number }

export interface RecurrenceOptions {
  frequency: RecurrenceFrequency
  interval: number
  byWeekday: number[] // 0 = Lundi … 6 = Dimanche, only used when frequency === 'weekly'
  end: RecurrenceEnd
}

export const DEFAULT_RECURRENCE: RecurrenceOptions = {
  frequency: 'none',
  interval: 1,
  byWeekday: [],
  end: { type: 'never' },
}

export const WEEKDAY_LABELS: { value: number; label: string }[] = [
  { value: 0, label: 'L' },
  { value: 1, label: 'Ma' },
  { value: 2, label: 'Me' },
  { value: 3, label: 'J' },
  { value: 4, label: 'V' },
  { value: 5, label: 'S' },
  { value: 6, label: 'D' },
]

const FREQ_MAP: Record<Exclude<RecurrenceFrequency, 'none'>, Frequency> = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
}

const WEEKDAY_STR_TO_NUM: Record<string, number> = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 }

const FREQ_REVERSE = new Map<Frequency, RecurrenceFrequency>([
  [RRule.DAILY, 'daily'],
  [RRule.WEEKLY, 'weekly'],
  [RRule.MONTHLY, 'monthly'],
  [RRule.YEARLY, 'yearly'],
])

/** Builds a bare RFC5545 RRULE string (no "RRULE:" prefix, no DTSTART — dtstart lives on the event's own `debut` column). */
export function buildRRuleString(options: RecurrenceOptions): string | null {
  if (options.frequency === 'none') return null

  const rruleOptions: Partial<Options> = {
    freq: FREQ_MAP[options.frequency],
    interval: Math.max(1, options.interval || 1),
  }

  if (options.frequency === 'weekly' && options.byWeekday.length > 0) {
    rruleOptions.byweekday = options.byWeekday
  }

  if (options.end.type === 'on_date') {
    rruleOptions.until = new Date(`${options.end.date}T23:59:59Z`)
  } else if (options.end.type === 'after_count') {
    rruleOptions.count = Math.max(1, options.end.count || 1)
  }

  return RRule.optionsToString(rruleOptions).replace(/^RRULE:/, '')
}

/** Parses a bare RRULE string back into the simplified UI recurrence model. */
export function parseRRuleString(rrule: string | null): RecurrenceOptions {
  if (!rrule) return DEFAULT_RECURRENCE

  const parsed = RRule.parseString(rrule)
  const frequency = (parsed.freq !== undefined && FREQ_REVERSE.get(parsed.freq)) || 'none'

  const byWeekday = Array.isArray(parsed.byweekday)
    ? parsed.byweekday.map((w) => {
        if (typeof w === 'number') return w
        if (typeof w === 'string') return WEEKDAY_STR_TO_NUM[w] ?? 0
        return w.weekday
      })
    : []

  let end: RecurrenceEnd = { type: 'never' }
  if (parsed.until) {
    end = { type: 'on_date', date: new Date(parsed.until).toISOString().slice(0, 10) }
  } else if (parsed.count) {
    end = { type: 'after_count', count: parsed.count }
  }

  return { frequency, interval: parsed.interval ?? 1, byWeekday, end }
}

export function recurrenceSummary(options: RecurrenceOptions): string {
  if (options.frequency === 'none') return 'Ne se répète pas'
  const unit = { daily: 'jour', weekly: 'semaine', monthly: 'mois', yearly: 'an' }[options.frequency]
  const base = options.interval > 1 ? `Tous les ${options.interval} ${unit}s` : `Tous les ${unit}s`
  const days = options.frequency === 'weekly' && options.byWeekday.length > 0
    ? ' (' + options.byWeekday
        .map((v) => WEEKDAY_LABELS.find((w) => w.value === v)?.label)
        .filter(Boolean)
        .join(', ') + ')'
    : ''
  const end = options.end.type === 'on_date'
    ? `, jusqu'au ${new Date(options.end.date).toLocaleDateString('fr-FR')}`
    : options.end.type === 'after_count'
    ? `, ${options.end.count} occurrences`
    : ''
  return base + days + end
}
