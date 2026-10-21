import type { Pool } from '@neondatabase/serverless'
import type { MailboxProvider } from './mailboxProvider.ts'
import type {
  CreateCalendarEventInput,
  CreateCalendarEventResult,
  DeleteCalendarEventInput,
  MailboxConnectionSummary,
  SendMailInput,
  SendMailResult,
  UpdateCalendarEventInput,
} from './types.ts'

const AUTHORITY = 'https://login.microsoftonline.com/common'
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

// Calendars.ReadWrite lets us create calendar invites (POST /me/events with
// attendees) alongside plain mail sending. `prompt=consent` below forces a
// fresh consent screen so existing connections pick this up via reconnect
// rather than needing a separate incremental-consent flow.
const SCOPES = ['openid', 'profile', 'offline_access', 'https://graph.microsoft.com/Mail.Send', 'https://graph.microsoft.com/Calendars.ReadWrite', 'https://graph.microsoft.com/User.Read']

interface ConnectionRow {
  id: string
  accessToken: string | null
  refreshToken: string | null
  token_expires_at: string | null
  status: string
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
}

/**
 * Graph's `dateTime` field is a *local wall-clock* string interpreted using
 * the paired `timeZone` label — it does NOT parse a "Z"/offset suffix and
 * convert from UTC. Passing Nottarie's UTC ISO timestamps straight through
 * with timeZone: 'Europe/Paris' silently double-applies the offset (this
 * shipped bug caused a 17/07 all-day event to show as a timed event at
 * 22:00 on 16/07 in Outlook). Fixed by always pairing literal UTC digits
 * with timeZone: 'UTC' for timed events, and by computing actual Paris
 * calendar dates (via Intl, not string slicing) for all-day events, which
 * Graph requires as isAllDay + midnight-to-midnight dates rather than a
 * timed range.
 */
function graphDateFields(debutIso: string, finIso: string, allDay?: boolean): Record<string, unknown> {
  if (allDay) {
    const startDate = parisDateOnly(debutIso)
    let endDate = parisDateOnly(finIso)
    // A single-day all-day event stores debut === fin (see "Vacances",
    // "Test Disney" etc.) — but Graph's all-day `end` is exclusive and
    // rejects a zero-length range ("must be at least 24 hours"), so a
    // same-day end needs bumping to the next calendar day.
    if (endDate === startDate) {
      const d = new Date(`${startDate}T00:00:00Z`)
      d.setUTCDate(d.getUTCDate() + 1)
      endDate = d.toISOString().slice(0, 10)
    }
    return {
      isAllDay: true,
      start: { dateTime: `${startDate}T00:00:00`, timeZone: 'Europe/Paris' },
      end: { dateTime: `${endDate}T00:00:00`, timeZone: 'Europe/Paris' },
    }
  }
  return {
    start: { dateTime: utcWallClock(debutIso), timeZone: 'UTC' },
    end: { dateTime: utcWallClock(finIso), timeZone: 'UTC' },
  }
}

/** en-CA locale formats as YYYY-MM-DD, which is exactly the date Graph expects for all-day events. */
function parisDateOnly(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

function utcWallClock(iso: string): string {
  return new Date(iso).toISOString().slice(0, 19)
}

export class OutlookMailboxProvider implements MailboxProvider {
  constructor(
    private readonly pool: Pool,
    private readonly encryptionKey: string,
    private readonly clientId: string,
    private readonly clientSecret: string,
  ) {}

  getAuthorizeUrl(params: { state: string; codeChallenge: string; redirectUri: string }): string {
    const url = new URL(`${AUTHORITY}/oauth2/v2.0/authorize`)
    url.searchParams.set('client_id', this.clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('redirect_uri', params.redirectUri)
    url.searchParams.set('response_mode', 'query')
    url.searchParams.set('scope', SCOPES.join(' '))
    // Forces a fresh consent screen every time. Without this, Microsoft can
    // silently reuse a prior partial consent grant on a returning session
    // instead of re-prompting for scopes added after the first connect —
    // which is exactly what caused offline_access to go missing here.
    url.searchParams.set('prompt', 'consent')
    url.searchParams.set('state', params.state)
    url.searchParams.set('code_challenge', params.codeChallenge)
    url.searchParams.set('code_challenge_method', 'S256')
    return url.toString()
  }

  async handleCallback(params: {
    tenantId: string
    utilisateurId: string
    code: string
    codeVerifier: string
    redirectUri: string
  }): Promise<MailboxConnectionSummary> {
    const tokens = await this.exchangeCode(params.code, params.codeVerifier, params.redirectUri)
    const profile = await this.graphFetch(tokens.access_token, '/me')
    const emailAddress: string | undefined = profile.mail ?? profile.userPrincipalName
    if (!emailAddress) throw new Error("Impossible de déterminer l'adresse de la messagerie connectée.")

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    try {
      await this.pool.query(
        `insert into mailbox_connections
           (tenant_id, utilisateur_id, provider, email_address, access_token_encrypted, refresh_token_encrypted, token_expires_at, scopes, status, last_error)
         values ($1, $2, 'outlook', $3, pgp_sym_encrypt($4, $7), pgp_sym_encrypt($5, $7), $6, $8, 'active', null)
         on conflict (utilisateur_id, provider) do update set
           email_address = excluded.email_address,
           access_token_encrypted = excluded.access_token_encrypted,
           refresh_token_encrypted = excluded.refresh_token_encrypted,
           token_expires_at = excluded.token_expires_at,
           scopes = excluded.scopes,
           status = excluded.status,
           last_error = excluded.last_error`,
        [params.tenantId, params.utilisateurId, emailAddress, tokens.access_token, tokens.refresh_token, tokenExpiresAt, this.encryptionKey, tokens.scope.split(' ')],
      )
    } catch (error) {
      throw new Error('Erreur lors de l\'enregistrement de la connexion : ' + (error as Error).message)
    }

    return { emailAddress, status: 'active' }
  }

  async sendMail(input: SendMailInput): Promise<SendMailResult> {
    const connection = await this.loadConnection(input.tenantId, input.utilisateurId)

    try {
      // ensureFreshAccessToken must be inside this try: a dead refresh
      // token throws GraphAuthError from here too, and that's exactly the
      // failure this catch block exists to flag — outside it, the
      // connection silently stays "active" in the DB forever even once
      // Microsoft has revoked it (found via a real expired-token case).
      const accessToken = await this.ensureFreshAccessToken(connection)

      // /me/sendMail only needs Mail.Send. The two-step create-then-send
      // alternative (POST /me/messages, then /send) looks appealing because
      // it returns a real message id, but POST /me/messages is a mailbox
      // *write* and actually requires Mail.ReadWrite — a broader permission
      // we deliberately didn't request. Using it caused every send to fail
      // with ErrorAccessDenied regardless of account or consent state.
      // provider_message_id stays null; that's an acceptable trade-off for
      // keeping the consent screen to Mail.Send only.
      await this.graphFetch(accessToken, '/me/sendMail', {
        method: 'POST',
        body: {
          message: {
            subject: input.subject,
            body: { contentType: 'HTML', content: input.bodyHtml },
            toRecipients: input.to.map((address) => ({ emailAddress: { address } })),
            ccRecipients: (input.cc ?? []).map((address) => ({ emailAddress: { address } })),
            attachments: (input.attachments ?? []).map((a) => ({
              '@odata.type': '#microsoft.graph.fileAttachment',
              name: a.filename,
              contentType: a.contentType,
              contentBytes: a.contentBase64,
            })),
          },
          saveToSentItems: true,
        },
      })
      return { providerMessageId: null }
    } catch (err) {
      if (err instanceof GraphAuthError) {
        await this.pool.query(`update mailbox_connections set status = 'error', last_error = $1 where id = $2`, [err.message, connection.id])
      }
      throw err
    }
  }

  async createCalendarEvent(input: CreateCalendarEventInput): Promise<CreateCalendarEventResult> {
    const connection = await this.loadConnection(input.tenantId, input.utilisateurId)

    try {
      const accessToken = await this.ensureFreshAccessToken(connection)

      // Creating an event with attendees makes Graph send the invite email
      // itself (no separate sendMail call needed for the invite).
      const event = await this.graphFetch(accessToken, '/me/events', {
        method: 'POST',
        body: {
          subject: input.titre,
          location: input.lieu ? { displayName: input.lieu } : undefined,
          ...graphDateFields(input.debut, input.fin, input.allDay),
          attendees: input.attendees.map((address) => ({ emailAddress: { address }, type: 'required' })),
          categories: input.category ? [input.category] : undefined,
          recurrence: input.recurrence,
        },
      })
      return { eventId: event.id as string }
    } catch (err) {
      if (err instanceof GraphAuthError) {
        await this.pool.query(`update mailbox_connections set status = 'error', last_error = $1 where id = $2`, [err.message, connection.id])
      }
      throw err
    }
  }

  async updateCalendarEvent(input: UpdateCalendarEventInput): Promise<void> {
    const connection = await this.loadConnection(input.tenantId, input.utilisateurId)

    try {
      const accessToken = await this.ensureFreshAccessToken(connection)
      await this.graphFetch(accessToken, `/me/events/${input.eventId}`, {
        method: 'PATCH',
        body: {
          subject: input.titre,
          location: input.lieu ? { displayName: input.lieu } : undefined,
          ...graphDateFields(input.debut, input.fin, input.allDay),
          categories: input.category ? [input.category] : undefined,
          recurrence: input.recurrence,
        },
      })
    } catch (err) {
      if (err instanceof GraphAuthError) {
        await this.pool.query(`update mailbox_connections set status = 'error', last_error = $1 where id = $2`, [err.message, connection.id])
      }
      throw err
    }
  }

  async deleteCalendarEvent(input: DeleteCalendarEventInput): Promise<void> {
    const connection = await this.loadConnection(input.tenantId, input.utilisateurId)

    try {
      const accessToken = await this.ensureFreshAccessToken(connection)
      await this.graphFetch(accessToken, `/me/events/${input.eventId}`, { method: 'DELETE', allow404: true })
    } catch (err) {
      if (err instanceof GraphAuthError) {
        await this.pool.query(`update mailbox_connections set status = 'error', last_error = $1 where id = $2`, [err.message, connection.id])
      }
      throw err
    }
  }

  async disconnect(params: { tenantId: string; utilisateurId: string }): Promise<void> {
    const { rows } = await this.pool.query(
      `select id from mailbox_connections where tenant_id = $1 and utilisateur_id = $2 and provider = 'outlook'`,
      [params.tenantId, params.utilisateurId],
    )
    const connection = rows[0]
    if (!connection) return

    try {
      await this.pool.query(
        `update mailbox_connections set
           status = 'revoked',
           access_token_encrypted = null,
           refresh_token_encrypted = null,
           token_expires_at = null,
           last_error = null
         where id = $1`,
        [connection.id],
      )
    } catch (error) {
      throw new Error('Erreur lors de la déconnexion : ' + (error as Error).message)
    }
  }

  private async loadConnection(tenantId: string, utilisateurId: string): Promise<ConnectionRow> {
    const { rows } = await this.pool.query(
      `select id, pgp_sym_decrypt(access_token_encrypted, $3) as access_token, pgp_sym_decrypt(refresh_token_encrypted, $3) as refresh_token, token_expires_at, status
       from mailbox_connections
       where tenant_id = $1 and utilisateur_id = $2 and provider = 'outlook'`,
      [tenantId, utilisateurId, this.encryptionKey],
    )
    const data = rows[0]
    if (!data || data.status !== 'active') {
      throw new NoMailboxConnectedError()
    }
    return {
      id: data.id,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      token_expires_at: data.token_expires_at,
      status: data.status,
    }
  }

  private async ensureFreshAccessToken(connection: ConnectionRow): Promise<string> {
    const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0
    const safetyMarginMs = 2 * 60 * 1000
    if (expiresAt - safetyMarginMs > Date.now()) {
      return connection.accessToken!
    }

    const tokens = await this.refreshTokens(connection.refreshToken!)

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    await this.pool.query(
      `update mailbox_connections set
         access_token_encrypted = pgp_sym_encrypt($1, $4),
         refresh_token_encrypted = pgp_sym_encrypt($2, $4),
         token_expires_at = $3
       where id = $5`,
      [tokens.access_token, tokens.refresh_token, tokenExpiresAt, this.encryptionKey, connection.id],
    )

    return tokens.access_token
  }

  private async exchangeCode(code: string, codeVerifier: string, redirectUri: string): Promise<TokenResponse> {
    return await this.requestToken({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    })
  }

  private async refreshTokens(refreshToken: string): Promise<TokenResponse> {
    return await this.requestToken({ grant_type: 'refresh_token', refresh_token: refreshToken })
  }

  private async requestToken(params: Record<string, string>): Promise<TokenResponse> {
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: SCOPES.join(' '),
      ...params,
    })
    const res = await fetch(`${AUTHORITY}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) {
      const detail = await res.text()
      throw new GraphAuthError(`Échec de l'authentification Microsoft : ${detail}`)
    }
    return await res.json()
  }

  private async graphFetch(
    accessToken: string,
    path: string,
    init?: { method?: string; body?: unknown; allow404?: boolean },
  ): Promise<any> {
    const res = await fetch(`${GRAPH_BASE}${path}`, {
      method: init?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    })
    if (res.status === 401 || res.status === 403) {
      throw new GraphAuthError(`Microsoft Graph a refusé la requête (${res.status}) : ${await res.text()}`)
    }
    // The event may already be gone on the Outlook side (user deleted it
    // there, or a prior sync attempt succeeded but the local row didn't get
    // updated). The delete flow treats that as success; update lets the
    // caller catch GraphNotFoundError and recreate instead.
    if (res.status === 404) {
      if (init?.allow404) return {}
      throw new GraphNotFoundError(`Événement introuvable sur Microsoft Graph (404) : ${await res.text()}`)
    }
    if (!res.ok) {
      throw new Error(`Erreur Microsoft Graph (${res.status}) : ${await res.text()}`)
    }
    if (res.status === 202 || res.status === 204) return {}
    return await res.json()
  }
}

export class NoMailboxConnectedError extends Error {
  constructor() {
    super('no_mailbox_connected')
  }
}

export class GraphNotFoundError extends Error {}

class GraphAuthError extends Error {}
