import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import rrulePlugin from '@fullcalendar/rrule'
import frLocale from '@fullcalendar/core/locales/fr'
import type { EventClickArg, EventInput, DateSelectArg } from '@fullcalendar/core'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../design-system'
import type { Dossier, Evenement, EvenementCategorie, EvenementParticipantStatut, Utilisateur } from '../types/database'
import { useAgendaEvents } from './useAgendaEvents'
import { EventFormDrawer, type EventFormResult } from './EventFormDrawer'
import { EventDetailModal } from './EventDetailModal'
import { CategoryManager } from './CategoryManager'
import type { RecurrenceScope } from './RecurrenceScopeModal'
import { buildRRuleString } from './eventRecurrence'
import { resolveEventColor } from './agendaColors'
import { frenchHolidays } from './frenchHolidays'

interface AgendaPageProps {
  tenantId: string
  onSelectDossier?: (dossierId: string) => void
}

type RRuleEventInput = EventInput & { rrule?: string; exdate?: string[]; duration?: { days?: number; milliseconds?: number } }

function toIcsUtc(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

function computeDuration(debutIso: string, finIso: string | null, allDay: boolean) {
  if (allDay) return { days: 1 }
  if (!finIso) return undefined
  const ms = new Date(finIso).getTime() - new Date(debutIso).getTime()
  return ms > 0 ? { milliseconds: ms } : undefined
}

function toEventInput(e: Evenement): RRuleEventInput {
  const color = resolveEventColor(e)
  const base: RRuleEventInput = {
    id: e.id,
    title: e.titre,
    backgroundColor: color,
    borderColor: color,
    allDay: e.all_day,
  }
  if (e.rrule) {
    return {
      ...base,
      rrule: `DTSTART:${toIcsUtc(e.debut)}\nRRULE:${e.rrule}`,
      duration: computeDuration(e.debut, e.fin, e.all_day),
      exdate: e.rrule_exdates,
    }
  }
  return { ...base, start: e.debut, end: e.fin ?? undefined }
}

function holidayEventInputs(): EventInput[] {
  const year = new Date().getFullYear()
  const years = [year - 1, year, year + 1, year + 2]
  return years.flatMap((y) => frenchHolidays(y)).map((h) => ({
    id: `holiday-${h.date}`,
    start: h.date,
    allDay: true,
    display: 'background',
    backgroundColor: '#FEE2E2',
    title: h.label,
  }))
}

export function AgendaPage({ tenantId, onSelectDossier }: AgendaPageProps) {
  const { memberships } = useAuth()
  const membership = memberships.find((m) => m.tenant_id === tenantId) ?? null
  const isAdminOrNotaire = !!membership && (membership.roles.includes('administrateur') || membership.roles.includes('notaire'))

  const { events, loading, error, reload } = useAgendaEvents(tenantId)
  const [categories, setCategories] = useState<EvenementCategorie[]>([])
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [hiddenCategoryIds, setHiddenCategoryIds] = useState<Set<string>>(new Set())
  const [showMyEventsOnly, setShowMyEventsOnly] = useState(false)
  const [showHolidays, setShowHolidays] = useState(true)

  // @fullcalendar/react's dynamic stylesheet injection can end up empty after
  // React StrictMode's double-invoked mount/unmount cycle in dev, leaving the
  // grid unstyled. A real remount after the initial commit reliably fixes it.
  const [calendarKey, setCalendarKey] = useState(0)
  useEffect(() => { setCalendarKey(1) }, [])

  const [formOpen, setFormOpen] = useState(false)
  const [formInitialEvent, setFormInitialEvent] = useState<Evenement | null>(null)
  const [formInitialRange, setFormInitialRange] = useState<{ start: string; end: string | null; allDay: boolean } | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Evenement | null>(null)
  const [selectedOccurrenceStart, setSelectedOccurrenceStart] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)

  function reloadCategories() {
    supabase.from('evenement_categories').select('*').eq('tenant_id', tenantId).order('nom')
      .then(({ data }) => setCategories(data ?? []))
  }

  useEffect(() => {
    reloadCategories()
    supabase.from('utilisateurs').select('*').eq('tenant_id', tenantId).eq('actif', true)
      .then(({ data }) => setUtilisateurs(data ?? []))
    supabase.from('dossiers').select('*').eq('tenant_id', tenantId)
      .then(({ data }) => setDossiers(data ?? []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  useEffect(() => {
    if (!selectedEvent) return
    const updated = events.find((e) => e.id === selectedEvent.id)
    if (updated) setSelectedEvent(updated)
  }, [events, selectedEvent])

  function canManageEvent(e: Evenement): boolean {
    return isAdminOrNotaire || (!!membership && e.organisateur_id === membership.id)
  }

  const filteredEvents = useMemo(() => events.filter((e) => {
    if (e.categorie_id && hiddenCategoryIds.has(e.categorie_id)) return false
    if (showMyEventsOnly && membership) {
      const mine = e.organisateur_id === membership.id || (e.participants ?? []).some((p) => p.utilisateur_id === membership.id)
      if (!mine) return false
    }
    return true
  }), [events, hiddenCategoryIds, showMyEventsOnly, membership])

  const calendarEvents = useMemo(() => {
    const base = filteredEvents.map(toEventInput)
    return showHolidays ? [...base, ...holidayEventInputs()] : base
  }, [filteredEvents, showHolidays])

  function toggleCategory(id: string) {
    setHiddenCategoryIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function openCreateDrawer(range?: { start: string; end: string | null; allDay: boolean }) {
    setFormInitialEvent(null)
    setFormInitialRange(range ?? null)
    setFormError(null)
    setFormOpen(true)
  }

  function openEditDrawer() {
    if (!selectedEvent) return
    setFormInitialEvent(selectedEvent)
    setFormInitialRange(null)
    setFormError(null)
    setDetailOpen(false)
    setFormOpen(true)
  }

  function handleEventClick(clickInfo: EventClickArg) {
    const found = events.find((e) => e.id === clickInfo.event.id)
    if (!found) return
    setSelectedEvent(found)
    setSelectedOccurrenceStart(clickInfo.event.start ? clickInfo.event.start.toISOString() : null)
    setDetailError(null)
    setDetailOpen(true)
  }

  function handleSelectRange(selectInfo: DateSelectArg) {
    openCreateDrawer({ start: selectInfo.startStr, end: selectInfo.allDay ? null : selectInfo.endStr, allDay: selectInfo.allDay })
  }

  async function syncDossierLinks(eventId: string, previousIds: string[], nextIds: string[]) {
    const toAdd = nextIds.filter((id) => !previousIds.includes(id))
    const toRemove = previousIds.filter((id) => !nextIds.includes(id))
    if (toAdd.length > 0) {
      await supabase.from('evenement_dossiers').insert(toAdd.map((dossier_id) => ({ tenant_id: tenantId, evenement_id: eventId, dossier_id })))
    }
    if (toRemove.length > 0) {
      await supabase.from('evenement_dossiers').delete().eq('evenement_id', eventId).in('dossier_id', toRemove)
    }
  }

  async function syncParticipants(eventId: string, previousIds: string[], nextIds: string[]) {
    const toAdd = nextIds.filter((id) => !previousIds.includes(id))
    const toRemove = previousIds.filter((id) => !nextIds.includes(id))
    if (toAdd.length > 0) {
      await supabase.from('evenement_participants').insert(toAdd.map((utilisateur_id) => ({ tenant_id: tenantId, evenement_id: eventId, utilisateur_id })))
    }
    if (toRemove.length > 0) {
      await supabase.from('evenement_participants').delete().eq('evenement_id', eventId).in('utilisateur_id', toRemove)
    }
  }

  async function handleCreateEvent(result: EventFormResult) {
    if (!membership) return
    setSaving(true)
    setFormError(null)
    const { data: inserted, error } = await supabase
      .from('evenements')
      .insert({
        tenant_id: tenantId,
        titre: result.titre,
        description: result.description || null,
        lieu: result.lieu || null,
        debut: result.debut,
        fin: result.fin,
        all_day: result.allDay,
        categorie_id: result.categorieId,
        couleur: result.couleur,
        disponibilite: result.disponibilite,
        organisateur_id: membership.id,
        rrule: buildRRuleString(result.recurrence),
      })
      .select('id')
      .single()

    if (error || !inserted) { setSaving(false); setFormError('Erreur lors de la création : ' + (error?.message ?? '')); return }

    await syncDossierLinks(inserted.id, [], result.dossierIds)
    await syncParticipants(inserted.id, [], result.participantIds)

    setSaving(false)
    setFormOpen(false)
    reload()
  }

  async function handleUpdateEvent(result: EventFormResult, scope: RecurrenceScope | null) {
    if (!formInitialEvent) return
    setSaving(true)
    setFormError(null)

    const previousDossierIds = (formInitialEvent.dossiers ?? []).map((d) => d.dossier_id)
    const previousParticipantIds = (formInitialEvent.participants ?? []).filter((p) => !p.is_organisateur).map((p) => p.utilisateur_id)

    if (scope === 'occurrence' && selectedOccurrenceStart) {
      const { data: inserted, error } = await supabase
        .from('evenements')
        .insert({
          tenant_id: tenantId,
          titre: result.titre,
          description: result.description || null,
          lieu: result.lieu || null,
          debut: result.debut,
          fin: result.fin,
          all_day: result.allDay,
          categorie_id: result.categorieId,
          couleur: result.couleur,
          disponibilite: result.disponibilite,
          organisateur_id: formInitialEvent.organisateur_id,
          recurrence_id: formInitialEvent.id,
          recurrence_original_start: selectedOccurrenceStart,
        })
        .select('id')
        .single()

      if (error || !inserted) { setSaving(false); setFormError('Erreur : ' + (error?.message ?? '')); return }

      await syncDossierLinks(inserted.id, [], result.dossierIds)
      await syncParticipants(inserted.id, [], result.participantIds)

      const nextExdates = Array.from(new Set([...(formInitialEvent.rrule_exdates ?? []), selectedOccurrenceStart]))
      await supabase.from('evenements').update({ rrule_exdates: nextExdates }).eq('id', formInitialEvent.id)
    } else {
      // The form is prefilled from the clicked occurrence's own date (see
      // EventFormDrawer), not the master's original dtstart. When applying to
      // "toute la série", overwriting the master's debut with that occurrence's
      // absolute date would shift the whole series. Instead, carry over only the
      // time-of-day/duration delta the user actually edited, anchored back onto
      // the master's original start date.
      const occurrenceStart = selectedOccurrenceStart ? new Date(selectedOccurrenceStart) : null
      const resultDebut = new Date(result.debut)
      const newDebutDate = occurrenceStart
        ? new Date(new Date(formInitialEvent.debut).getTime() + (resultDebut.getTime() - occurrenceStart.getTime()))
        : resultDebut
      const newFin = result.fin
        ? new Date(newDebutDate.getTime() + (new Date(result.fin).getTime() - resultDebut.getTime())).toISOString()
        : null

      // Existing per-occurrence exceptions exclude the master via exact-timestamp
      // entries in rrule_exdates. If the series time-of-day shifts, those stored
      // timestamps no longer match the newly-computed occurrence times and the
      // excluded occurrence would silently reappear — shift them by the same delta.
      const timeDeltaMs = newDebutDate.getTime() - new Date(formInitialEvent.debut).getTime()
      const shiftedExdates = (formInitialEvent.rrule_exdates ?? []).map(
        (d) => new Date(new Date(d).getTime() + timeDeltaMs).toISOString()
      )

      const { error } = await supabase
        .from('evenements')
        .update({
          titre: result.titre,
          description: result.description || null,
          lieu: result.lieu || null,
          debut: newDebutDate.toISOString(),
          fin: newFin,
          all_day: result.allDay,
          categorie_id: result.categorieId,
          couleur: result.couleur,
          disponibilite: result.disponibilite,
          rrule: buildRRuleString(result.recurrence),
          rrule_exdates: shiftedExdates,
        })
        .eq('id', formInitialEvent.id)

      if (error) { setSaving(false); setFormError('Erreur : ' + error.message); return }

      await syncDossierLinks(formInitialEvent.id, previousDossierIds, result.dossierIds)
      await syncParticipants(formInitialEvent.id, previousParticipantIds, result.participantIds)
    }

    setSaving(false)
    setFormOpen(false)
    reload()
  }

  function handleFormSave(result: EventFormResult, scope: RecurrenceScope | null) {
    if (formInitialEvent) handleUpdateEvent(result, scope)
    else handleCreateEvent(result)
  }

  async function handleDeleteEvent(scope: RecurrenceScope | null) {
    if (!selectedEvent) return
    setSaving(true)
    setDetailError(null)

    if (scope === 'occurrence' && selectedOccurrenceStart) {
      const nextExdates = Array.from(new Set([...(selectedEvent.rrule_exdates ?? []), selectedOccurrenceStart]))
      const { error } = await supabase.from('evenements').update({ rrule_exdates: nextExdates }).eq('id', selectedEvent.id)
      if (error) { setSaving(false); setDetailError('Erreur : ' + error.message); return }
    } else {
      const { error } = await supabase.from('evenements').delete().eq('id', selectedEvent.id)
      if (error) { setSaving(false); setDetailError('Erreur : ' + error.message); return }
    }

    setSaving(false)
    setDetailOpen(false)
    reload()
  }

  async function handleRsvp(statut: EvenementParticipantStatut) {
    if (!selectedEvent || !membership) return
    const myParticipant = (selectedEvent.participants ?? []).find((p) => p.utilisateur_id === membership.id)
    if (!myParticipant) return
    setSaving(true)
    setDetailError(null)
    const { error } = await supabase.from('evenement_participants').update({ statut }).eq('id', myParticipant.id)
    setSaving(false)
    if (error) { setDetailError('Erreur : ' + error.message); return }
    reload()
  }

  if (!membership) return null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <h1 style={h1}>Agenda</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <label style={toggleLabel}>
            <input type="checkbox" checked={showMyEventsOnly} onChange={(e) => setShowMyEventsOnly(e.target.checked)} />
            Mes événements
          </label>
          <label style={toggleLabel}>
            <input type="checkbox" checked={showHolidays} onChange={(e) => setShowHolidays(e.target.checked)} />
            Jours fériés
          </label>
          <Button variant="secondary" size="sm" onClick={() => setCategoryManagerOpen(true)}>Catégories</Button>
          <Button variant="primary" size="sm" onClick={() => openCreateDrawer()}>+ Nouvel événement</Button>
        </div>
      </div>

      {categories.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          {categories.map((cat) => {
            const active = !hiddenCategoryIds.has(cat.id)
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '4px 10px', borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-default)',
                  background: active ? 'var(--surface-base)' : 'var(--surface-muted)',
                  opacity: active ? 1 : 0.5,
                  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--n-800)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.couleur }} />
                {cat.nom}
              </button>
            )
          })}
        </div>
      )}

      {(error || formError) && <div style={errorBanner}>{error || formError}</div>}

      <div style={{ background: 'var(--surface-base)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>Chargement…</div>
        ) : (
          <FullCalendar
            key={calendarKey}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, rrulePlugin]}
            initialView="dayGridMonth"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }}
            locale={frLocale}
            firstDay={1}
            height="auto"
            selectable
            select={handleSelectRange}
            eventClick={handleEventClick}
            events={calendarEvents}
          />
        )}
      </div>

      <EventFormDrawer
        open={formOpen}
        saving={saving}
        categories={categories}
        utilisateurs={utilisateurs}
        dossiers={dossiers}
        initialEvent={formInitialEvent}
        initialRange={formInitialRange}
        occurrenceStart={selectedOccurrenceStart}
        onSave={handleFormSave}
        onClose={() => setFormOpen(false)}
      />

      <EventDetailModal
        open={detailOpen}
        event={selectedEvent}
        occurrenceStart={selectedOccurrenceStart}
        currentUtilisateur={membership}
        canManage={selectedEvent ? canManageEvent(selectedEvent) : false}
        saving={saving}
        error={detailError}
        onEdit={openEditDrawer}
        onDelete={handleDeleteEvent}
        onRsvp={handleRsvp}
        onSelectDossier={onSelectDossier}
        onClose={() => setDetailOpen(false)}
      />

      <CategoryManager
        open={categoryManagerOpen}
        tenantId={tenantId}
        categories={categories}
        canManage={isAdminOrNotaire}
        onClose={() => setCategoryManagerOpen(false)}
        onChanged={reloadCategories}
      />
    </div>
  )
}

const h1: CSSProperties = {
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xl)', fontWeight: 700,
  color: 'var(--n-900)', letterSpacing: 'var(--tracking-tight)', margin: 0,
}

const toggleLabel: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--n-800)', cursor: 'pointer',
}

const errorBanner: CSSProperties = {
  background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
  padding: '10px 14px', marginBottom: 'var(--space-4)',
  fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#DC2626',
}
