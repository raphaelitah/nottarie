import type { Pool } from '@neondatabase/serverless'
import { OutlookMailboxProvider } from './outlookMailboxProvider'
import type { MailboxProvider } from './mailboxProvider'
import type { MailboxProviderName } from './types'

export type { MailboxProvider } from './mailboxProvider'
export type {
  CreateCalendarEventInput,
  CreateCalendarEventResult,
  DeleteCalendarEventInput,
  GraphRecurrence,
  MailboxConnectionSummary,
  MailboxProviderName,
  SendMailInput,
  SendMailResult,
  UpdateCalendarEventInput,
} from './types'
export { GraphNotFoundError, NoMailboxConnectedError } from './outlookMailboxProvider'

/**
 * Single swap point: Outlook (Microsoft Graph) is the only implementation
 * today. Gmail plugs in here later behind the same MailboxProvider
 * interface — callers never depend on provider-specific code.
 */
export function getMailboxProvider(
  pool: Pool,
  provider: MailboxProviderName,
  config: { encryptionKey: string; outlookClientId: string; outlookClientSecret: string },
): MailboxProvider {
  if (provider === 'outlook') return new OutlookMailboxProvider(pool, config.encryptionKey, config.outlookClientId, config.outlookClientSecret)
  throw new Error(`Fournisseur de messagerie non pris en charge : ${provider}`)
}

/**
 * The OAuth redirect_uri must be byte-identical between the authorize
 * request (mailbox-oauth-start) and the token exchange (mailbox-oauth-
 * exchange) — computed once here so both functions agree. This is the
 * Worker's own `/mailbox-oauth-callback` route (Azure redirects here
 * directly), not a frontend route — pass the Worker's origin, not
 * FRONTEND_URL.
 */
export function mailboxCallbackRedirectUri(workerOrigin: string): string {
  return `${workerOrigin}/mailbox-oauth-callback`
}
