import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { getMailboxProvider, GraphNotFoundError, type GraphRecurrence } from '../_shared/mailbox/index.ts'

// Invoked only by the evenements/evenement_participants DB triggers
// (notify_outlook_calendar_sync, see the evenement_outlook_syncs migration)
// — never by a browser client, hence verify_jwt=false and a shared-secret
// header instead of a user JWT.
const ETUDE_CATEGORY = 'Nottarie - Étude'

interface EvenementRow {
  id: string
  tenant_id: string
  titre: string
  lieu: string | null
  debut: string
  fin: string
  all_day: boolean
  organisateur_id: string | null
  est_prive: boolean
  rrule: string | null
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: 'evenements' | 'evenement_participants'
  record: Record<string, unknown> | null
  old_record: Record<string, unknown> | null
  /** Only present for evenements DELETE — a pre-cascade snapshot of the
   * sync rows, captured by a BEFORE DELETE trigger (see the migration)
   * since "on delete cascade" would otherwise wipe them out before the
   * async webhook call is even made. */
  syncs?: { utilisateur_id: string; outlook_event_id: string | null }[]
}

Deno.serve(async (req) => {
  try {
    const expectedSecret = await readWebhookSecret(adminClient())
    if (!expectedSecret || req.headers.get('x-webhook-secret') !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401 })
    }

    const payload = (await req.json()) as WebhookPayload
    const admin = adminClient()

    const evenementId = payload.table === 'evenements'
      ? (payload.record?.id ?? payload.old_record?.id) as string | undefined
      : (payload.record?.evenement_id ?? payload.old_record?.evenement_id) as string | undefined
    if (!evenementId) return new Response(JSON.stringify({ ok: true, skipped: 'no_evenement_id' }))

    if (payload.table === 'evenements' && payload.type === 'DELETE') {
      await deleteAllSyncsForEvenement(admin, payload.old_record!.tenant_id as string, payload.syncs ?? [])
      return new Response(JSON.stringify({ ok: true }))
    }

    const { data: evenement } = await admin
      .from('evenements')
      .select('id, tenant_id, titre, lieu, debut, fin, all_day, organisateur_id, est_prive, rrule')
      .eq('id', evenementId)
      .maybeSingle()
    if (!evenement) return new Response(JSON.stringify({ ok: true, skipped: 'evenement_gone' }))

    await reconcileEvenement(admin, evenement as EvenementRow)
    return new Response(JSON.stringify({ ok: true }))
  } catch (err) {
    // A sync bug must never surface as a failure to the caller (there is no
    // caller here but pg_net — but future direct invocations shouldn't
    // retry-storm either), just log and 200 so pg_net doesn't keep retrying
    // an unrecoverable payload forever.
    console.error('sync-outlook-calendar error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 200 })
  }
})

function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
}

async function readWebhookSecret(admin: SupabaseClient): Promise<string | null> {
  const { data, error } = await admin.rpc('vault_read_secret_by_name', { p_name: 'outlook_calendar_sync_webhook_secret' })
  if (error) return null
  return (data as string) ?? null
}

async function resolveTargetUserIds(admin: SupabaseClient, evenement: EvenementRow): Promise<string[]> {
  if (!evenement.est_prive) {
    const { data } = await admin.from('utilisateurs').select('id').eq('tenant_id', evenement.tenant_id)
    return (data ?? []).map((u) => u.id as string)
  }

  const ids = new Set<string>()
  if (evenement.organisateur_id) ids.add(evenement.organisateur_id)
  const { data: participants } = await admin
    .from('evenement_participants')
    .select('utilisateur_id')
    .eq('evenement_id', evenement.id)
  for (const p of participants ?? []) ids.add(p.utilisateur_id as string)
  return [...ids]
}

async function reconcileEvenement(admin: SupabaseClient, evenement: EvenementRow): Promise<void> {
  const targetUserIds = await resolveTargetUserIds(admin, evenement)

  const { data: connections } = await admin
    .from('mailbox_connections')
    .select('utilisateur_id')
    .eq('tenant_id', evenement.tenant_id)
    .eq('provider', 'outlook')
    .eq('status', 'active')
    .in('utilisateur_id', targetUserIds.length > 0 ? targetUserIds : ['00000000-0000-0000-0000-000000000000'])
  const connectedTargetIds = new Set((connections ?? []).map((c) => c.utilisateur_id as string))

  const { data: existingSyncs } = await admin
    .from('evenement_outlook_syncs')
    .select('id, utilisateur_id, outlook_event_id')
    .eq('evenement_id', evenement.id)
  const existingByUser = new Map((existingSyncs ?? []).map((s) => [s.utilisateur_id as string, s]))

  const provider = getMailboxProvider(admin, 'outlook')
  const category = evenement.est_prive ? undefined : ETUDE_CATEGORY
  const recurrence = toGraphRecurrence(evenement.rrule, evenement.debut)

  // Push/update for every connected target.
  for (const utilisateurId of connectedTargetIds) {
    const existing = existingByUser.get(utilisateurId)
    try {
      if (existing?.outlook_event_id) {
        try {
          await provider.updateCalendarEvent({
            tenantId: evenement.tenant_id,
            utilisateurId,
            eventId: existing.outlook_event_id,
            titre: evenement.titre,
            lieu: evenement.lieu,
            debut: evenement.debut,
            fin: evenement.fin,
            allDay: evenement.all_day,
            category,
            recurrence,
          })
          await admin.from('evenement_outlook_syncs').update({ last_synced_at: new Date().toISOString(), last_error: null }).eq('id', existing.id)
        } catch (err) {
          if (!(err instanceof GraphNotFoundError)) throw err
          const created = await provider.createCalendarEvent({
            tenantId: evenement.tenant_id, utilisateurId, titre: evenement.titre, lieu: evenement.lieu,
            debut: evenement.debut, fin: evenement.fin, allDay: evenement.all_day, attendees: [], category, recurrence,
          })
          await admin.from('evenement_outlook_syncs').update({
            outlook_event_id: created.eventId, last_synced_at: new Date().toISOString(), last_error: null,
          }).eq('id', existing.id)
        }
      } else {
        const created = await provider.createCalendarEvent({
          tenantId: evenement.tenant_id, utilisateurId, titre: evenement.titre, lieu: evenement.lieu,
          debut: evenement.debut, fin: evenement.fin, allDay: evenement.all_day, attendees: [], category, recurrence,
        })
        await admin.from('evenement_outlook_syncs').upsert({
          tenant_id: evenement.tenant_id, evenement_id: evenement.id, utilisateur_id: utilisateurId,
          outlook_event_id: created.eventId, last_synced_at: new Date().toISOString(), last_error: null,
        }, { onConflict: 'evenement_id,utilisateur_id' })
      }
    } catch (err) {
      // One broken connection must not block sync for the rest of the targets.
      if (existing) {
        await admin.from('evenement_outlook_syncs').update({ last_error: String(err) }).eq('id', existing.id)
      } else {
        await admin.from('evenement_outlook_syncs').upsert({
          tenant_id: evenement.tenant_id, evenement_id: evenement.id, utilisateur_id: utilisateurId, last_error: String(err),
        }, { onConflict: 'evenement_id,utilisateur_id' })
      }
    }
  }

  // Remove syncs for anyone no longer a target (removed participant, event
  // went private, or their Outlook connection was disconnected).
  for (const [utilisateurId, sync] of existingByUser) {
    if (connectedTargetIds.has(utilisateurId)) continue
    try {
      if (sync.outlook_event_id) {
        await provider.deleteCalendarEvent({ tenantId: evenement.tenant_id, utilisateurId, eventId: sync.outlook_event_id })
      }
    } catch (err) {
      console.error('sync-outlook-calendar: failed to delete stale event', err)
    }
    await admin.from('evenement_outlook_syncs').delete().eq('id', sync.id)
  }
}

async function deleteAllSyncsForEvenement(
  admin: SupabaseClient,
  tenantId: string,
  syncs: { utilisateur_id: string; outlook_event_id: string | null }[],
): Promise<void> {
  // The rows themselves are already gone (cascade-deleted alongside the
  // evenement within the same transaction, before this async webhook ever
  // ran) — `syncs` is the pre-cascade snapshot the BEFORE DELETE trigger
  // captured, so this only needs to clean up the Outlook side.
  if (syncs.length === 0) return

  const provider = getMailboxProvider(admin, 'outlook')
  for (const sync of syncs) {
    try {
      if (sync.outlook_event_id) {
        await provider.deleteCalendarEvent({ tenantId, utilisateurId: sync.utilisateur_id, eventId: sync.outlook_event_id })
      }
    } catch (err) {
      console.error('sync-outlook-calendar: failed to delete event for removed evenement', err)
    }
  }
}

const WEEKDAY_STR_TO_GRAPH: Record<string, string> = {
  MO: 'monday', TU: 'tuesday', WE: 'wednesday', TH: 'thursday', FR: 'friday', SA: 'saturday', SU: 'sunday',
}

/** Bare-bones RFC5545 RRULE key=value parser (no external deps — importing
 * npm:rrule here caused the Edge Function to fail to boot) — only the keys
 * this app's RecurrenceBuilder ever produces (FREQ, INTERVAL, COUNT, UNTIL,
 * BYDAY) are read; anything else is ignored. */
function parseRRuleParts(rrule: string): Record<string, string> {
  const parts: Record<string, string> = {}
  for (const pair of rrule.replace(/^RRULE:/, '').split(';')) {
    const [key, value] = pair.split('=')
    if (key && value) parts[key.toUpperCase()] = value
  }
  return parts
}

/**
 * Best-effort rrule -> Graph recurrence translation for the simple patterns
 * this app's RecurrenceBuilder produces (daily/weekly/monthly, interval,
 * count or until, byweekday). Anything else (yearly, complex bysetpos,
 * recurrence exceptions) is deliberately not translated — the event syncs
 * as a plain non-recurring occurrence rather than blocking the whole sync;
 * full recurrence-exception support is an explicit follow-up, not this pass.
 */
function toGraphRecurrence(rrule: string | null, debut: string): GraphRecurrence | undefined {
  if (!rrule) return undefined
  const parts = parseRRuleParts(rrule)

  const freqMap: Record<string, GraphRecurrence['pattern']['type']> = {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'absoluteMonthly',
  }
  const type = parts.FREQ ? freqMap[parts.FREQ] : undefined
  if (!type) return undefined

  const startDate = debut.slice(0, 10)

  let daysOfWeek = parts.BYDAY
    ? parts.BYDAY.split(',').map((d) => WEEKDAY_STR_TO_GRAPH[d]).filter((d): d is string => !!d)
    : undefined
  // Graph requires weekly patterns to carry at least one day; fall back to
  // the start date's own weekday when the rrule didn't specify BYDAY.
  if (type === 'weekly' && (!daysOfWeek || daysOfWeek.length === 0)) {
    const graphDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    daysOfWeek = [graphDays[new Date(debut).getUTCDay()]]
  }

  const range: GraphRecurrence['range'] = parts.UNTIL
    ? { type: 'endDate', startDate, endDate: parseRRuleDate(parts.UNTIL) }
    : parts.COUNT
    ? { type: 'numbered', startDate, numberOfOccurrences: parseInt(parts.COUNT, 10) }
    : { type: 'noEnd', startDate }

  const pattern: GraphRecurrence['pattern'] = {
    type,
    interval: parts.INTERVAL ? parseInt(parts.INTERVAL, 10) : 1,
    daysOfWeek: daysOfWeek && daysOfWeek.length > 0 ? daysOfWeek : undefined,
  }
  if (type === 'absoluteMonthly') pattern.dayOfMonth = new Date(debut).getUTCDate()

  return { pattern, range }
}

/** RFC5545 UNTIL is either YYYYMMDD or YYYYMMDDTHHMMSSZ — both start with a bare date. */
function parseRRuleDate(value: string): string {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}
