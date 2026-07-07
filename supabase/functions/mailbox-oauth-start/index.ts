import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isTenantMember } from '../_shared/authorize.ts'
import { getMailboxProvider, mailboxCallbackRedirectUri } from '../_shared/mailbox/index.ts'

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

    const { tenant_id, code_challenge } = await req.json()
    if (!tenant_id || !code_challenge) {
      return new Response(JSON.stringify({ error: 'tenant_id et code_challenge sont requis' }), { status: 400, headers: corsHeaders })
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

    const state = crypto.randomUUID()
    const { error: stateError } = await supabaseAdmin.from('mailbox_oauth_states').insert({
      state,
      tenant_id,
      utilisateur_id: membre.id,
      code_challenge,
    })
    if (stateError) {
      return new Response(JSON.stringify({ error: stateError.message }), { status: 500, headers: corsHeaders })
    }

    const provider = getMailboxProvider(supabaseAdmin, 'outlook')
    const authorizeUrl = provider.getAuthorizeUrl({ state, codeChallenge: code_challenge, redirectUri: mailboxCallbackRedirectUri() })

    return new Response(JSON.stringify({ authorizeUrl, state }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
