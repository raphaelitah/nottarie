/**
 * Server-to-server calls against Managed Better Auth's PUBLIC rest endpoints
 * (no cookie session, no admin role needed) — replaces Supabase Auth's
 * service-role Admin API (inviteUserByEmail, resetPasswordForEmail) for the
 * one thing it's used for here: creating an account for an invited user and
 * sending them a password-reset link to set their own password.
 *
 * Known limitation vs. the old Supabase flow: Supabase's admin API could
 * look up an existing auth user by email and attach them to a second étude
 * without creating a duplicate account. There's no public-API equivalent
 * lookup here, so inviting an email that already has an account fails
 * instead of silently reusing it — one person can't yet belong to two
 * études under one login via this flow.
 */
function authBaseUrl(jwksUrl: string): string {
  return jwksUrl.replace(/\/\.well-known\/jwks\.json$/, '')
}

export type BetterAuthAdminErrorStatus = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502

export class BetterAuthAdminError extends Error {
  constructor(message: string, public status: BetterAuthAdminErrorStatus) {
    super(message)
  }
}

function normalizeStatus(status: number): BetterAuthAdminErrorStatus {
  const known: BetterAuthAdminErrorStatus[] = [400, 401, 403, 404, 409, 422, 429, 500, 502]
  return known.includes(status as BetterAuthAdminErrorStatus) ? (status as BetterAuthAdminErrorStatus) : 500
}

export async function createUserAccount(
  jwksUrl: string,
  params: { email: string; name: string }
): Promise<{ userId: string }> {
  const tempPassword = crypto.randomUUID() + crypto.randomUUID()
  const response = await fetch(`${authBaseUrl(jwksUrl)}/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: params.email, password: tempPassword, name: params.name }),
  })
  const body = (await response.json().catch(() => ({}))) as { user?: { id: string }; message?: string }
  if (!response.ok || !body.user?.id) {
    throw new BetterAuthAdminError(body.message ?? `Échec de la création du compte (${response.status})`, normalizeStatus(response.status))
  }
  return { userId: body.user.id }
}

export async function sendPasswordResetLink(
  jwksUrl: string,
  params: { email: string; redirectTo: string }
): Promise<void> {
  const response = await fetch(`${authBaseUrl(jwksUrl)}/request-password-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: params.email, redirectTo: params.redirectTo }),
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string }
    throw new BetterAuthAdminError(body.message ?? `Échec de l'envoi du lien (${response.status})`, normalizeStatus(response.status))
  }
}
