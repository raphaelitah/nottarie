import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import type { MailboxProvider } from './mailboxProvider.ts'
import type { MailboxConnectionSummary, SendMailInput, SendMailResult } from './types.ts'

const AUTHORITY = Deno.env.get('MAILBOX_OUTLOOK_AUTHORITY') ?? 'https://login.microsoftonline.com/common'
const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

// Not Calendars.ReadWrite yet: kept to the minimum needed for sending mail so
// the initial consent screen is as small as possible. Calendar sync (a later,
// separate phase) adds it via incremental consent — existing connections
// don't need to be redone.
const SCOPES = ['openid', 'profile', 'offline_access', 'https://graph.microsoft.com/Mail.Send', 'https://graph.microsoft.com/User.Read']

interface ConnectionRow {
  id: string
  access_token_secret_id: string | null
  refresh_token_secret_id: string | null
  token_expires_at: string | null
  status: string
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
}

function clientId(): string {
  return Deno.env.get('MAILBOX_OUTLOOK_CLIENT_ID')!
}

function clientSecret(): string {
  return Deno.env.get('MAILBOX_OUTLOOK_CLIENT_SECRET')!
}

export class OutlookMailboxProvider implements MailboxProvider {
  constructor(private readonly admin: SupabaseClient) {}

  getAuthorizeUrl(params: { state: string; codeChallenge: string; redirectUri: string }): string {
    const url = new URL(`${AUTHORITY}/oauth2/v2.0/authorize`)
    url.searchParams.set('client_id', clientId())
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

    const accessTokenSecretId = await this.storeSecret(tokens.access_token)
    const refreshTokenSecretId = await this.storeSecret(tokens.refresh_token)
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const { error } = await this.admin
      .from('mailbox_connections')
      .upsert({
        tenant_id: params.tenantId,
        utilisateur_id: params.utilisateurId,
        provider: 'outlook',
        email_address: emailAddress,
        access_token_secret_id: accessTokenSecretId,
        refresh_token_secret_id: refreshTokenSecretId,
        token_expires_at: tokenExpiresAt,
        scopes: tokens.scope.split(' '),
        status: 'active',
        last_error: null,
      }, { onConflict: 'utilisateur_id,provider' })
    if (error) throw new Error('Erreur lors de l\'enregistrement de la connexion : ' + error.message)

    return { emailAddress, status: 'active' }
  }

  async sendMail(input: SendMailInput): Promise<SendMailResult> {
    const connection = await this.loadConnection(input.tenantId, input.utilisateurId)
    const accessToken = await this.ensureFreshAccessToken(connection)

    try {
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
          },
          saveToSentItems: true,
        },
      })
      return { providerMessageId: null }
    } catch (err) {
      if (err instanceof GraphAuthError) {
        await this.admin
          .from('mailbox_connections')
          .update({ status: 'error', last_error: err.message })
          .eq('id', connection.id)
      }
      throw err
    }
  }

  async disconnect(params: { tenantId: string; utilisateurId: string }): Promise<void> {
    const { data: connection } = await this.admin
      .from('mailbox_connections')
      .select('id, access_token_secret_id, refresh_token_secret_id')
      .eq('tenant_id', params.tenantId)
      .eq('utilisateur_id', params.utilisateurId)
      .eq('provider', 'outlook')
      .maybeSingle()
    if (!connection) return

    if (connection.access_token_secret_id) await this.deleteSecret(connection.access_token_secret_id)
    if (connection.refresh_token_secret_id) await this.deleteSecret(connection.refresh_token_secret_id)

    const { error } = await this.admin
      .from('mailbox_connections')
      .update({
        status: 'revoked',
        access_token_secret_id: null,
        refresh_token_secret_id: null,
        token_expires_at: null,
        last_error: null,
      })
      .eq('id', connection.id)
    if (error) throw new Error('Erreur lors de la déconnexion : ' + error.message)
  }

  private async loadConnection(tenantId: string, utilisateurId: string): Promise<ConnectionRow> {
    const { data, error } = await this.admin
      .from('mailbox_connections')
      .select('id, access_token_secret_id, refresh_token_secret_id, token_expires_at, status')
      .eq('tenant_id', tenantId)
      .eq('utilisateur_id', utilisateurId)
      .eq('provider', 'outlook')
      .maybeSingle()
    if (error || !data || data.status !== 'active') {
      throw new NoMailboxConnectedError()
    }
    return data
  }

  private async ensureFreshAccessToken(connection: ConnectionRow): Promise<string> {
    const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0
    const safetyMarginMs = 2 * 60 * 1000
    if (expiresAt - safetyMarginMs > Date.now()) {
      return await this.readSecret(connection.access_token_secret_id!)
    }

    const refreshToken = await this.readSecret(connection.refresh_token_secret_id!)
    const tokens = await this.refreshTokens(refreshToken)

    await this.updateSecret(connection.access_token_secret_id!, tokens.access_token)
    await this.updateSecret(connection.refresh_token_secret_id!, tokens.refresh_token)
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    await this.admin
      .from('mailbox_connections')
      .update({ token_expires_at: tokenExpiresAt })
      .eq('id', connection.id)

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
      client_id: clientId(),
      client_secret: clientSecret(),
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

  private async graphFetch(accessToken: string, path: string, init?: { method?: string; body?: unknown }): Promise<any> {
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
    if (!res.ok) {
      throw new Error(`Erreur Microsoft Graph (${res.status}) : ${await res.text()}`)
    }
    if (res.status === 202 || res.status === 204) return {}
    return await res.json()
  }

  private async storeSecret(value: string): Promise<string> {
    const { data, error } = await this.admin.rpc('vault_store_secret', { p_secret: value })
    if (error || !data) throw new Error('Erreur lors du chiffrement du jeton : ' + error?.message)
    return data as string
  }

  private async readSecret(secretId: string): Promise<string> {
    const { data, error } = await this.admin.rpc('vault_read_secret', { p_secret_id: secretId })
    if (error || !data) throw new Error('Erreur lors de la lecture du jeton : ' + error?.message)
    return data as string
  }

  private async updateSecret(secretId: string, value: string): Promise<void> {
    const { error } = await this.admin.rpc('vault_update_secret', { p_secret_id: secretId, p_secret: value })
    if (error) throw new Error('Erreur lors de la mise à jour du jeton : ' + error.message)
  }

  private async deleteSecret(secretId: string): Promise<void> {
    await this.admin.rpc('vault_delete_secret', { p_secret_id: secretId })
  }
}

export class NoMailboxConnectedError extends Error {
  constructor() {
    super('no_mailbox_connected')
  }
}

class GraphAuthError extends Error {}
