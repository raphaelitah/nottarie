import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export async function isPlatformAdmin(admin: SupabaseClient, authUserId: string): Promise<boolean> {
  const { data } = await admin
    .from('platform_admins')
    .select('auth_user_id')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  return !!data
}

export async function isEtudeAdmin(admin: SupabaseClient, authUserId: string, tenantId: string): Promise<boolean> {
  const { data } = await admin
    .from('utilisateurs')
    .select('roles')
    .eq('auth_user_id', authUserId)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  return !!data?.roles?.includes('administrateur')
}

/** Platform admin, or administrateur of the given étude. */
export async function canManageEtude(admin: SupabaseClient, authUserId: string, tenantId: string): Promise<boolean> {
  return (await isPlatformAdmin(admin, authUserId)) || (await isEtudeAdmin(admin, authUserId, tenantId))
}

/** Any role, as long as they belong to the étude — used for tenant-scoped actions
 * that any notarial staff member may perform (e.g. generating an acte). */
export async function isTenantMember(admin: SupabaseClient, authUserId: string, tenantId: string): Promise<boolean> {
  const { data } = await admin
    .from('utilisateurs')
    .select('auth_user_id')
    .eq('auth_user_id', authUserId)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  return !!data
}

/** Notaire or administrateur of the given étude — used for actions with legal
 * significance (e.g. designating/requesting/completing a signature). */
export async function isNotaireOrAdmin(admin: SupabaseClient, authUserId: string, tenantId: string): Promise<boolean> {
  const { data } = await admin
    .from('utilisateurs')
    .select('roles')
    .eq('auth_user_id', authUserId)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  const roles: string[] = data?.roles ?? []
  return roles.includes('administrateur') || roles.includes('notaire')
}

/** Notaire, clerc rédacteur (role_notarial 'redacteur'), or administrateur —
 * used for preparatory signature actions (adjusting/ordering signataires)
 * that staff other than the notaire may also perform. */
export async function isNotaireClercOrAdmin(admin: SupabaseClient, authUserId: string, tenantId: string): Promise<boolean> {
  const { data } = await admin
    .from('utilisateurs')
    .select('roles')
    .eq('auth_user_id', authUserId)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  const roles: string[] = data?.roles ?? []
  return roles.includes('administrateur') || roles.includes('notaire') || roles.includes('redacteur')
}
