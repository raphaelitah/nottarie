import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isTenantMember } from '../_shared/authorize.ts'
import { getMailboxProvider } from '../_shared/mailbox/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: corsHeaders })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Session invalide' }), { status: 401, headers: corsHeaders })
    }

    const { tenant_id } = await req.json()
    if (!tenant_id) {
      return new Response(JSON.stringify({ error: 'tenant_id est requis' }), { status: 400, headers: corsHeaders })
    }
    if (!(await isTenantMember(supabaseAdmin, caller.id, tenant_id))) {
      return new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403, headers: corsHeaders })
    }

    const { data: membre, error: membreError } = await supabaseAdmin
      .from('utilisateurs')
      .select('id')
      .eq('auth_user_id', caller.id)
      .eq('tenant_id', tenant_id)
      .maybeSingle()
    if (membreError || !membre) {
      return new Response(JSON.stringify({ error: 'Utilisateur introuvable.' }), { status: 404, headers: corsHeaders })
    }

    // Self-disconnect only: a user can disconnect their own mailbox, not
    // someone else's. Revoking another person's OAuth grant without their
    // knowledge is a deliberate feature to design later, not a side effect.
    const provider = getMailboxProvider(supabaseAdmin, 'outlook')
    await provider.disconnect({ tenantId: tenant_id, utilisateurId: membre.id })

    return new Response(JSON.stringify({ status: 'revoked' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
