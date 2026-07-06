import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { useAgendaEvents } from './useAgendaEvents'
import { expandOccurrences } from './eventRecurrence'
import { resolveEventColor } from './agendaColors'
import type { Evenement } from '../types/database'

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']

interface WeekStripProps {
  tenantId: string
  onOpenAgenda: () => void
}

/** Mon–Fri of the current week, or of next week if today falls on a weekend. */
function getWorkWeekDates(reference: Date): Date[] {
  const day = reference.getDay() // 0 = Sunday … 6 = Saturday
  const isWeekend = day === 0 || day === 6
  const daysSinceMonday = (day + 6) % 7
  const monday = new Date(reference)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(reference.getDate() - daysSinceMonday + (isWeekend ? 7 : 0))
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function eventsOnDay(events: Evenement[], day: Date): Evenement[] {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(day)
  dayEnd.setHours(23, 59, 59, 999)
  return events.filter((e) => {
    if (e.rrule) return expandOccurrences(e.rrule, e.debut, e.rrule_exdates, dayStart, dayEnd).length > 0
    const d = new Date(e.debut)
    return d >= dayStart && d <= dayEnd
  })
}

export function WeekStrip({ tenantId, onOpenAgenda }: WeekStripProps) {
  const { events, loading } = useAgendaEvents(tenantId)
  const days = useMemo(() => getWorkWeekDates(new Date()), [])
  const today = new Date()

  return (
    <div style={{ marginTop: 'var(--space-8)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
        <h2 style={h2}>Cette semaine</h2>
        <button onClick={onOpenAgenda} style={linkBtn}>Voir l'agenda →</button>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        {days.map((day, i) => {
          const isToday = isSameDay(day, today)
          const dayEvents = eventsOnDay(events, day)
          return (
            <button
              key={day.toISOString()}
              onClick={onOpenAgenda}
              style={{
                ...dayCard,
                background: isToday ? 'var(--color-ink)' : 'var(--surface-base)',
                borderColor: isToday ? 'var(--color-ink)' : 'var(--border-default)',
              }}
            >
              <span style={{ ...dayLabel, color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                {DAY_LABELS[i]}
              </span>
              <span style={{ ...dayNumber, color: isToday ? '#fff' : 'var(--n-900)' }}>{day.getDate()}</span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: 'var(--space-2)', width: '100%' }}>
                {loading ? (
                  <span style={{ fontSize: '11px', color: isToday ? 'rgba(255,255,255,0.6)' : 'var(--text-disabled)' }}>…</span>
                ) : dayEvents.length === 0 ? (
                  <span style={{ fontSize: '11px', color: isToday ? 'rgba(255,255,255,0.5)' : 'var(--text-disabled)' }}>
                    Aucun événement
                  </span>
                ) : (
                  <>
                    {dayEvents.slice(0, 3).map((e) => (
                      <div key={e.id} style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        fontSize: '11px', color: isToday ? 'rgba(255,255,255,0.9)' : 'var(--n-700)',
                        overflow: 'hidden',
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: resolveEventColor(e), flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {e.est_prive ? `🔒 ${e.titre}` : e.titre}
                        </span>
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span style={{ fontSize: '11px', color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
                        +{dayEvents.length - 3} autres
                      </span>
                    )}
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const h2: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', fontWeight: 600,
  color: 'var(--n-900)', margin: 0,
}

const linkBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 500,
  color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
}

const dayCard: CSSProperties = {
  flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
  padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)',
  cursor: 'pointer', textAlign: 'left', transition: 'background 150ms ease',
}

const dayLabel: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

const dayNumber: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-lg)', fontWeight: 700, marginTop: '2px',
}
