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
