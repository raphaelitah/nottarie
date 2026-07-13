import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { DateTime } from 'luxon'
import { Drawer, Button, Input, Select, Textarea } from '../design-system'
import type { Dossier, Evenement, EvenementCategorie, EvenementDisponibilite, Utilisateur } from '../types/database'
import { CATEGORY_COLOR_PRESETS } from './agendaColors'
import { DossierLinkPicker } from './DossierLinkPicker'
import { MultiUserPicker } from './MultiUserPicker'
import { RecurrenceBuilder } from './RecurrenceBuilder'
import { RecurrenceScopeModal, type RecurrenceScope } from './RecurrenceScopeModal'
import { DEFAULT_RECURRENCE, parseRRuleString, type RecurrenceOptions } from './eventRecurrence'

const DISPONIBILITE_OPTIONS: { value: EvenementDisponibilite; label: string }[] = [
  { value: 'occupe', label: 'Occupé' },
  { value: 'disponible', label: 'Disponible' },
  { value: 'indisponible', label: 'Indisponible' },
]

// A curated list is far more usable than IANA's full ~400-zone catalogue in
// a plain <select>; the browser's own detected zone is always added if it
// isn't already one of these, so no one is stuck picking an approximation.
const TIMEZONE_OPTIONS = [
  'Europe/Paris', 'Europe/London', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Africa/Abidjan', 'Asia/Dubai', 'Asia/Tokyo', 'Australia/Sydney', 'UTC',
]

function detectBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'
}

/** Absolute UTC instant (ISO) -> the wall-clock datetime-local string as seen in `zone`. */
function toZonedDatetimeLocal(iso: string, zone: string): string {
  return DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone).toFormat("yyyy-MM-dd'T'HH:mm")
}

/** A datetime-local string, interpreted as wall-clock time in `zone` -> absolute UTC instant (ISO). */
function fromZonedDatetimeLocal(local: string, zone: string): string {
  return DateTime.fromISO(local, { zone }).toUTC().toISO()!
}

export interface EventFormResult {
  titre: string
  description: string
  lieu: string
  allDay: boolean
  timezone: string
  debut: string // ISO
  fin: string | null // ISO
  categorieId: string | null
  couleur: string | null
  disponibilite: EvenementDisponibilite
  estPrive: boolean
  recurrence: RecurrenceOptions
  dossierIds: string[]
  participantIds: string[]
}

interface EventFormDrawerProps {
  open: boolean
  saving: boolean
  categories: EvenementCategorie[]
  utilisateurs: Utilisateur[]
  dossiers: Dossier[]
  initialEvent?: Evenement | null
  initialRange?: { start: string; end: string | null; allDay: boolean } | null
  occurrenceStart?: string | null
  onSave: (result: EventFormResult, scope: RecurrenceScope | null) => void
  onClose: () => void
}

export function EventFormDrawer({
  open,
  saving,
  categories,
  utilisateurs,
  dossiers,
  initialEvent,
  initialRange,
  occurrenceStart,
  onSave,
  onClose,
}: EventFormDrawerProps) {
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [lieu, setLieu] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [timezone, setTimezone] = useState(detectBrowserTimezone())
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')
  const [categorieId, setCategorieId] = useState('')
  const [couleur, setCouleur] = useState('')
  const [disponibilite, setDisponibilite] = useState<EvenementDisponibilite>('occupe')
  const [estPrive, setEstPrive] = useState(false)
  const [recurrence, setRecurrence] = useState<RecurrenceOptions>(DEFAULT_RECURRENCE)
  const [dossierIds, setDossierIds] = useState<string[]>([])
  const [participantIds, setParticipantIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [scopeModalOpen, setScopeModalOpen] = useState(false)
  const [pendingResult, setPendingResult] = useState<EventFormResult | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setScopeModalOpen(false)
    setPendingResult(null)

    if (initialEvent) {
      // When editing one occurrence of a recurring master, the clicked instance's
      // actual date (occurrenceStart) is what the user expects to see/edit — the
      // master row's own `debut` is just its first-ever occurrence, not this one.
      const isRecurringOccurrence = !!initialEvent.rrule && !!occurrenceStart
      const effectiveDebut = isRecurringOccurrence ? occurrenceStart! : initialEvent.debut
      const effectiveFin = isRecurringOccurrence && initialEvent.fin
        ? new Date(new Date(occurrenceStart!).getTime() + (new Date(initialEvent.fin).getTime() - new Date(initialEvent.debut).getTime())).toISOString()
        : initialEvent.fin

      const zone = initialEvent.timezone || detectBrowserTimezone()
      setTitre(initialEvent.titre)
      setDescription(initialEvent.description ?? '')
      setLieu(initialEvent.lieu ?? '')
      setAllDay(initialEvent.all_day)
      setTimezone(zone)
      setDebut(toZonedDatetimeLocal(effectiveDebut, zone))
      setFin(effectiveFin ? toZonedDatetimeLocal(effectiveFin, zone) : '')
      setCategorieId(initialEvent.categorie_id ?? '')
      setCouleur(initialEvent.couleur ?? '')
      setDisponibilite(initialEvent.disponibilite)
      setEstPrive(initialEvent.est_prive)
      setRecurrence(parseRRuleString(initialEvent.rrule))
      setDossierIds((initialEvent.dossiers ?? []).map((d) => d.dossier_id))
      setParticipantIds((initialEvent.participants ?? []).filter((p) => !p.is_organisateur).map((p) => p.utilisateur_id))
    } else {
      const zone = detectBrowserTimezone()
      setTitre('')
      setDescription('')
      setLieu('')
      setAllDay(initialRange?.allDay ?? false)
      setTimezone(zone)
      setDebut(initialRange ? toZonedDatetimeLocal(initialRange.start, zone) : '')
      setFin(initialRange?.end ? toZonedDatetimeLocal(initialRange.end, zone) : '')
      setCategorieId('')
      setCouleur('')
      setDisponibilite('occupe')
      setEstPrive(false)
      setRecurrence(DEFAULT_RECURRENCE)
      setDossierIds([])
      setParticipantIds([])
    }
  }, [open, initialEvent, initialRange, occurrenceStart])

  function buildResult(): EventFormResult | null {
    if (!titre.trim()) { setError('Le titre est obligatoire.'); return null }
    if (!debut) { setError('La date de début est obligatoire.'); return null }
    setError(null)
    // All-day events are date-only concepts (a calendar day, not a moment in
    // time) — the chosen fuseau horaire only matters for timed events.
    return {
      titre: titre.trim(),
      description: description.trim(),
      lieu: lieu.trim(),
      allDay,
      timezone,
      debut: allDay ? new Date(debut).toISOString() : fromZonedDatetimeLocal(debut, timezone),
      fin: fin ? (allDay ? new Date(fin).toISOString() : fromZonedDatetimeLocal(fin, timezone)) : null,
      categorieId: categorieId || null,
      couleur: couleur || null,
      disponibilite,
      estPrive,
      recurrence,
      dossierIds,
      participantIds,
    }
  }

  function handleSubmit() {
    const result = buildResult()
    if (!result) return

    if (initialEvent?.rrule) {
      setPendingResult(result)
      setScopeModalOpen(true)
      return
    }

    onSave(result, null)
  }

  function handleScopeChoice(scope: RecurrenceScope) {
    setScopeModalOpen(false)
    if (pendingResult) onSave(pendingResult, scope)
    setPendingResult(null)
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        title={initialEvent ? "Modifier l'événement" : 'Nouvel événement'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
              padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#DC2626',
            }}>{error}</div>
          )}

          <Input label="Titre" required placeholder="ex. RDV signature acte" value={titre} onChange={(e) => setTitre(e.target.value)} />

          <Textarea label="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />

          <Input label="Lieu" placeholder="ex. Étude, Visioconférence…" value={lieu} onChange={(e) => setLieu(e.target.value)} />

          <label style={checkboxRow}>
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
            Journée entière
          </label>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Début"
                required
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? debut.slice(0, 10) : debut}
                onChange={(e) => {
                  const nextDebut = allDay ? `${e.target.value}T00:00` : e.target.value
                  setDebut(nextDebut)
                  // Default a 30-min duration whenever there's no end yet, or
                  // the existing end no longer makes sense after this change
                  // (before/equal to the new start) — never overwrites an end
                  // the user deliberately set further out.
                  if (!allDay && (!fin || new Date(fin) <= new Date(nextDebut))) {
                    const defaultFin = new Date(new Date(nextDebut).getTime() + 30 * 60 * 1000)
                    setFin(defaultFin.toISOString().slice(0, 16))
                  }
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                label="Fin"
                type={allDay ? 'date' : 'datetime-local'}
                value={allDay ? fin.slice(0, 10) : fin}
                onChange={(e) => setFin(allDay ? `${e.target.value}T00:00` : e.target.value)}
              />
            </div>
          </div>

          {!allDay && (
            <Select
              label="Fuseau horaire"
              options={(TIMEZONE_OPTIONS.includes(timezone) ? TIMEZONE_OPTIONS : [timezone, ...TIMEZONE_OPTIONS]).map((tz) => ({ value: tz, label: tz.replace('_', ' ') }))}
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            />
          )}

          <Select
            label="Catégorie"
            placeholder="Aucune"
            options={categories.map((c) => ({ value: c.id, label: c.nom }))}
            value={categorieId}
            onChange={(e) => setCategorieId(e.target.value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Couleur (facultatif, remplace celle de la catégorie)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setCouleur('')}
                style={{
                  height: '24px', padding: '0 10px', borderRadius: 'var(--radius-full)',
                  border: couleur === '' ? '1px solid var(--color-ink)' : '1px solid var(--border-default)',
                  background: 'var(--surface-base)', fontFamily: 'var(--font-sans)', fontSize: '11px',
                  color: 'var(--n-700)', cursor: 'pointer',
                }}
              >Aucune</button>
              {CATEGORY_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCouleur(preset)}
                  aria-label={preset}
                  style={{
                    width: '24px', height: '24px', borderRadius: '50%', background: preset,
                    border: couleur.toLowerCase() === preset.toLowerCase() ? '2px solid var(--n-900)' : '2px solid transparent',
                    boxShadow: '0 0 0 1px var(--border-default)', cursor: 'pointer', padding: 0,
                  }}
                />
              ))}
              <input
                type="color"
                value={couleur || '#1E2D45'}
                onChange={(e) => setCouleur(e.target.value)}
                style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                aria-label="Couleur personnalisée"
              />
            </div>
          </div>

          <Select
            label="Disponibilité"
            options={DISPONIBILITE_OPTIONS}
            value={disponibilite}
            onChange={(e) => setDisponibilite(e.target.value as EvenementDisponibilite)}
          />

          <label style={checkboxRow}>
            <input type="checkbox" checked={estPrive} onChange={(e) => setEstPrive(e.target.checked)} />
            Événement privé (les autres membres le verront comme occupé, sans le détail)
          </label>

          <RecurrenceBuilder value={recurrence} onChange={setRecurrence} />

          <DossierLinkPicker dossiers={dossiers} selectedIds={dossierIds} onChange={setDossierIds} />

          <MultiUserPicker utilisateurs={utilisateurs} selectedIds={participantIds} onChange={setParticipantIds} />
        </div>
      </Drawer>

      <RecurrenceScopeModal
        open={scopeModalOpen}
        action="edit"
        onChoose={handleScopeChoice}
        onClose={() => { setScopeModalOpen(false); setPendingResult(null) }}
      />
    </>
  )
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 500, color: 'var(--n-800)', letterSpacing: '-0.01em',
}

const checkboxRow: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#2D2C3C', cursor: 'pointer',
}
