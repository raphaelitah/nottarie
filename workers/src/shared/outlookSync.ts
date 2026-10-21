import type { Pool } from '@neondatabase/serverless'
import { getMailboxProvider, GraphNotFoundError, type GraphRecurrence } from './mailbox/index'

/**
 * Replaces the old pg_net/Vault DB-trigger webhook (sync-outlook-calendar
 * Edge Function): Neon can't do outbound HTTP from a trigger, so triggers
 * now just INSERT into `outlook_sync_outbox`, and this is polled by a Cron
 * Trigger (see index.ts `scheduled`) instead of being invoked synchronously.
 * Fire-and-forget semantics are preserved: each row is attempted once, any
 * error is recorded on the per-user sync row (or outbox row) for visibility,
 * and the outbox row is marked processed regardless of outcome — no retries,
 * same as the original webhook's behavior.
 */
const ETUDE_CATEGORY = 'Nottarie - Étude'

interface OutboxRow {
  id: string
  tenant_id: string
  evenement_id: string
  tg_op: 'INSERT' | 'UPDATE' | 'DELETE'
  tg_table: 'evenements' | 'evenement_participants'
  record: Record<string, unknown> | null
  old_record: Record<string, unknown> | null
  syncs: { utilisateur_id: string; outlook_event_id: string | null }[] | null
}

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

interface MailboxConfig {
  encryptionKey: string
  outlookClientId: string
  outlookClientSecret: string
}

export async function processOutlookSyncOutbox(pool: Pool, config: MailboxConfig, batchSize = 20): Promise<{ processed: number }> {
  const { rows } = await pool.query<OutboxRow>(
    'select * from outlook_sync_outbox where processed_at is null order by created_at asc limit $1',
    [batchSize]
  )

  for (const row of rows) {
    try {
      if (row.tg_table === 'evenements' && row.tg_op === 'DELETE') {
        await deleteAllSyncsForEvenement(pool, config, row.tenant_id, row.syncs ?? [])
      } else {
        const { rows: evenementRows } = await pool.query<EvenementRow>(
          'select id, tenant_id, titre, lieu, debut, fin, all_day, organisateur_id, est_prive, rrule from evenements where id = $1',
          [row.evenement_id]
        )
        if (evenementRows[0]) {
          await reconcileEvenement(pool, config, evenementRows[0])
        }
      }
      await pool.query('update outlook_sync_outbox set processed_at = now() where id = $1', [row.id])
    } catch (err) {
      await pool.query(
        'update outlook_sync_outbox set processed_at = now(), attempts = attempts + 1, last_error = $2 where id = $1',
        [row.id, String(err)]
      )
    }
  }

  return { processed: rows.length }
}

async function resolveTargetUserIds(pool: Pool, evenement: EvenementRow): Promise<string[]> {
  if (!evenement.est_prive) {
    const { rows } = await pool.query<{ id: string }>('select id from utilisateurs where tenant_id = $1', [evenement.tenant_id])
    return rows.map((u) => u.id)
  }

  const ids = new Set<string>()
  if (evenement.organisateur_id) ids.add(evenement.organisateur_id)
  const { rows: participants } = await pool.query<{ utilisateur_id: string }>(
    'select utilisateur_id from evenement_participants where evenement_id = $1',
    [evenement.id]
  )
  for (const p of participants) ids.add(p.utilisateur_id)
  return [...ids]
}

async function reconcileEvenement(pool: Pool, config: MailboxConfig, evenement: EvenementRow): Promise<void> {
  const targetUserIds = await resolveTargetUserIds(pool, evenement)

  const { rows: connections } = await pool.query<{ utilisateur_id: string }>(
    `select utilisateur_id from mailbox_connections
     where tenant_id = $1 and provider = 'outlook' and status = 'active' and utilisateur_id = any($2::uuid[])`,
    [evenement.tenant_id, targetUserIds]
  )
  const connectedTargetIds = new Set(connections.map((c) => c.utilisateur_id))

  const { rows: existingSyncs } = await pool.query<{ id: string; utilisateur_id: string; outlook_event_id: string | null }>(
    'select id, utilisateur_id, outlook_event_id from evenement_outlook_syncs where evenement_id = $1',
    [evenement.id]
  )
  const existingByUser = new Map(existingSyncs.map((s) => [s.utilisateur_id, s]))

  const provider = getMailboxProvider(pool, 'outlook', config)
  const category = evenement.est_prive ? undefined : ETUDE_CATEGORY
  const recurrence = toGraphRecurrence(evenement.rrule, evenement.debut)

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
          await pool.query('update evenement_outlook_syncs set last_synced_at = now(), last_error = null where id = $1', [existing.id])
        } catch (err) {
          if (!(err instanceof GraphNotFoundError)) throw err
          const created = await provider.createCalendarEvent({
            tenantId: evenement.tenant_id, utilisateurId, titre: evenement.titre, lieu: evenement.lieu,
            debut: evenement.debut, fin: evenement.fin, allDay: evenement.all_day, attendees: [], category, recurrence,
          })
          await pool.query(
            'update evenement_outlook_syncs set outlook_event_id = $2, last_synced_at = now(), last_error = null where id = $1',
            [existing.id, created.eventId]
          )
        }
      } else {
        const created = await provider.createCalendarEvent({
          tenantId: evenement.tenant_id, utilisateurId, titre: evenement.titre, lieu: evenement.lieu,
          debut: evenement.debut, fin: evenement.fin, allDay: evenement.all_day, attendees: [], category, recurrence,
        })
        await pool.query(
          `insert into evenement_outlook_syncs (tenant_id, evenement_id, utilisateur_id, outlook_event_id, last_synced_at, last_error)
           values ($1, $2, $3, $4, now(), null)
           on conflict (evenement_id, utilisateur_id) do update set outlook_event_id = excluded.outlook_event_id, last_synced_at = now(), last_error = null`,
          [evenement.tenant_id, evenement.id, utilisateurId, created.eventId]
        )
      }
    } catch (err) {
      if (existing) {
        await pool.query('update evenement_outlook_syncs set last_error = $2 where id = $1', [existing.id, String(err)])
      } else {
        await pool.query(
          `insert into evenement_outlook_syncs (tenant_id, evenement_id, utilisateur_id, last_error)
           values ($1, $2, $3, $4)
           on conflict (evenement_id, utilisateur_id) do update set last_error = excluded.last_error`,
          [evenement.tenant_id, evenement.id, utilisateurId, String(err)]
        )
      }
    }
  }

  for (const [utilisateurId, sync] of existingByUser) {
    if (connectedTargetIds.has(utilisateurId)) continue
    try {
      if (sync.outlook_event_id) {
        await provider.deleteCalendarEvent({ tenantId: evenement.tenant_id, utilisateurId, eventId: sync.outlook_event_id })
      }
    } catch {
      // A broken delete must not block cleanup of the tracking row.
    }
    await pool.query('delete from evenement_outlook_syncs where id = $1', [sync.id])
  }
}

async function deleteAllSyncsForEvenement(
  pool: Pool,
  config: MailboxConfig,
  tenantId: string,
  syncs: { utilisateur_id: string; outlook_event_id: string | null }[],
): Promise<void> {
  if (syncs.length === 0) return
  const provider = getMailboxProvider(pool, 'outlook', config)
  for (const sync of syncs) {
    try {
      if (sync.outlook_event_id) {
        await provider.deleteCalendarEvent({ tenantId, utilisateurId: sync.utilisateur_id, eventId: sync.outlook_event_id })
      }
    } catch {
      // The evenement row is already gone; nothing left to record this against.
    }
  }
}

const WEEKDAY_STR_TO_GRAPH: Record<string, string> = {
  MO: 'monday', TU: 'tuesday', WE: 'wednesday', TH: 'thursday', FR: 'friday', SA: 'saturday', SU: 'sunday',
}

function parseRRuleParts(rrule: string): Record<string, string> {
  const parts: Record<string, string> = {}
  for (const pair of rrule.replace(/^RRULE:/, '').split(';')) {
    const [key, value] = pair.split('=')
    if (key && value) parts[key.toUpperCase()] = value
  }
  return parts
}

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

function parseRRuleDate(value: string): string {
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}
