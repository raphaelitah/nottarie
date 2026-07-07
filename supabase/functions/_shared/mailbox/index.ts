import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import { OutlookMailboxProvider } from './outlookMailboxProvider.ts'
import type { MailboxProvider } from './mailboxProvider.ts'
import type { MailboxProviderName } from './types.ts'

export type { MailboxProvider } from './mailboxProvider.ts'
export type { MailboxConnectionSummary, MailboxProviderName, SendMailInput, SendMailResult } from './types.ts'
export { NoMailboxConnectedError } from './outlookMailboxProvider.ts'

/**
 * Single swap point: Outlook (Microsoft Graph) is the only implementation
 * today. Gmail plugs in here later behind the same MailboxProvider
 * interface — callers never depend on provider-specific code.
 */
export function getMailboxProvider(admin: SupabaseClient, provider: MailboxProviderName): MailboxProvider {
  if (provider === 'outlook') return new OutlookMailboxProvider(admin)
  throw new Error(`Fournisseur de messagerie non pris en charge : ${provider}`)
}

/**
 * The OAuth redirect_uri must be byte-identical between the authorize
 * request (mailbox-oauth-start) and the token exchange (mailbox-oauth-
 * exchange) — computed once here so both functions agree.
 */
export function mailboxCallbackRedirectUri(): string {
  return `${Deno.env.get('SUPABASE_URL')}/functions/v1/mailbox-oauth-callback`
}
