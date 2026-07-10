import type {
  CreateCalendarEventInput,
  CreateCalendarEventResult,
  MailboxConnectionSummary,
  SendMailInput,
  SendMailResult,
} from './types.ts'

/**
 * All external-mailbox flows (connect, send, disconnect) go through this
 * interface — never through provider-specific code called directly from
 * route handlers. Mirrors the SignatureProvider pattern (ADR-02): Outlook
 * (Microsoft Graph) is the only implementation today, Gmail plugs in here
 * later without callers changing.
 */
export interface MailboxProvider {
  /** Build the provider's OAuth2 authorize URL for a PKCE authorization-code flow. */
  getAuthorizeUrl(params: { state: string; codeChallenge: string; redirectUri: string }): string

  /**
   * Exchange an authorization code for tokens, resolve the connected
   * mailbox's real address, persist the tokens (via Vault), and upsert
   * mailbox_connections. Returns a client-safe summary (never the tokens).
   */
  handleCallback(params: {
    tenantId: string
    utilisateurId: string
    code: string
    codeVerifier: string
    redirectUri: string
  }): Promise<MailboxConnectionSummary>

  /** Send an email as the connected user; refreshes the access token first if it's near expiry. */
  sendMail(input: SendMailInput): Promise<SendMailResult>

  /** Create a calendar event with attendees; the provider sends the invite email itself. */
  createCalendarEvent(input: CreateCalendarEventInput): Promise<CreateCalendarEventResult>

  /** Delete the stored tokens (Vault secrets) and soft-revoke the connection row. */
  disconnect(params: { tenantId: string; utilisateurId: string }): Promise<void>
}
