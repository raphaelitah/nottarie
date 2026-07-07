import { supabase } from '../lib/supabase'

const CODE_VERIFIER_STORAGE_KEY = 'nottarie:mailbox_oauth_code_verifier'

function base64url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function generateCodeVerifier(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(64)))
}

async function codeChallengeFromVerifier(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64url(new Uint8Array(digest))
}

/** Kicks off the "connect my Outlook mailbox" flow: redirects the browser to Microsoft's consent screen. */
export async function startOutlookConnect(tenantId: string): Promise<{ error: string | null }> {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await codeChallengeFromVerifier(codeVerifier)

  const { data, error } = await supabase.functions.invoke('mailbox-oauth-start', {
    body: { tenant_id: tenantId, code_challenge: codeChallenge },
  })
  if (error || !data?.authorizeUrl) {
    return { error: error?.message ?? "Impossible de démarrer la connexion à Outlook." }
  }

  sessionStorage.setItem(CODE_VERIFIER_STORAGE_KEY, codeVerifier)
  window.location.href = data.authorizeUrl
  return { error: null }
}

export interface MailboxOAuthCallbackResult {
  handled: boolean
  error: string | null
  emailAddress?: string
}

/**
 * Call once on app mount. If the browser just bounced back from
 * mailbox-oauth-callback (?mailbox_oauth=1&...), finishes the exchange and
 * strips the query string. No-op otherwise.
 */
export async function handleMailboxOAuthCallbackIfPresent(): Promise<MailboxOAuthCallbackResult> {
  const params = new URLSearchParams(window.location.search)
  if (params.get('mailbox_oauth') !== '1') {
    return { handled: false, error: null }
  }

  const cleanUrl = window.location.pathname
  const errorParam = params.get('error')
  const errorDescription = params.get('error_description')
  const code = params.get('code')
  const state = params.get('state')
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_STORAGE_KEY)
  sessionStorage.removeItem(CODE_VERIFIER_STORAGE_KEY)
  window.history.replaceState(null, '', cleanUrl)

  if (errorParam) {
    return { handled: true, error: errorDescription ?? errorParam }
  }
  if (!code || !state || !codeVerifier) {
    return { handled: true, error: "La connexion à Outlook a échoué : requête incomplète." }
  }

  const { data, error } = await supabase.functions.invoke('mailbox-oauth-exchange', {
    body: { code, state, code_verifier: codeVerifier },
  })
  if (error || !data?.connection) {
    return { handled: true, error: error?.message ?? "La connexion à Outlook a échoué." }
  }

  return { handled: true, error: null, emailAddress: data.connection.emailAddress }
}

export async function disconnectOutlook(tenantId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.functions.invoke('mailbox-disconnect', { body: { tenant_id: tenantId } })
  return { error: error?.message ?? null }
}
