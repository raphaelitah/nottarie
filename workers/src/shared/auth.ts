import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { Pool } from '@neondatabase/serverless'

/**
 * Verifies the caller's JWT against Neon Auth's JWKS and returns their
 * auth user id (the JWT `sub` claim — same shape Supabase Auth used).
 * Replaces supabase-js's `auth.getUser(token)` server-side verification.
 */
export async function verifyAuthHeader(authHeader: string | null, jwksUrl: string): Promise<string> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AuthError('Missing bearer token')
  }
  const token = authHeader.slice('Bearer '.length)
  const jwks = createRemoteJWKSet(new URL(jwksUrl))
  try {
    const { payload } = await jwtVerify(token, jwks)
    if (!payload.sub) throw new AuthError('Token missing sub claim')
    return payload.sub
  } catch {
    throw new AuthError('Invalid or expired token')
  }
}

export class AuthError extends Error {}

export async function isPlatformAdmin(db: Pool, authUserId: string): Promise<boolean> {
  const { rows } = await db.query('select 1 from platform_admins where auth_user_id = $1', [authUserId])
  return rows.length > 0
}

async function userRoles(db: Pool, authUserId: string, tenantId: string): Promise<string[]> {
  const { rows } = await db.query(
    'select roles from utilisateurs where auth_user_id = $1 and tenant_id = $2',
    [authUserId, tenantId]
  )
  return rows[0]?.roles ?? []
}

export async function isEtudeAdmin(db: Pool, authUserId: string, tenantId: string): Promise<boolean> {
  return (await userRoles(db, authUserId, tenantId)).includes('administrateur')
}

/** Platform admin, or administrateur of the given étude. */
export async function canManageEtude(db: Pool, authUserId: string, tenantId: string): Promise<boolean> {
  return (await isPlatformAdmin(db, authUserId)) || (await isEtudeAdmin(db, authUserId, tenantId))
}

/** Any role, as long as they belong to the étude — used for tenant-scoped actions
 * that any notarial staff member may perform (e.g. generating an acte). */
export async function isTenantMember(db: Pool, authUserId: string, tenantId: string): Promise<boolean> {
  const { rows } = await db.query(
    'select 1 from utilisateurs where auth_user_id = $1 and tenant_id = $2',
    [authUserId, tenantId]
  )
  return rows.length > 0
}

/** Notaire or administrateur of the given étude — used for actions with legal
 * significance (e.g. designating/requesting/completing a signature). */
export async function isNotaireOrAdmin(db: Pool, authUserId: string, tenantId: string): Promise<boolean> {
  const roles = await userRoles(db, authUserId, tenantId)
  return roles.includes('administrateur') || roles.includes('notaire')
}

/** Notaire, clerc rédacteur (role_notarial 'redacteur'), or administrateur —
 * used for preparatory signature actions (adjusting/ordering signataires)
 * that staff other than the notaire may also perform. */
export async function isNotaireClercOrAdmin(db: Pool, authUserId: string, tenantId: string): Promise<boolean> {
  const roles = await userRoles(db, authUserId, tenantId)
  return roles.includes('administrateur') || roles.includes('notaire') || roles.includes('redacteur')
}
