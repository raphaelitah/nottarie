import { createClient } from 'jsr:@supabase/supabase-js@2'
import { getMailboxProvider, mailboxCallbackRedirectUri } from '../_shared/mailbox/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function base64url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function codeChallengeFromVerifier(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
  return base64url(digest)
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

    const { code, state, code_verifier } = await req.json()
    if (!code || !state || !code_verifier) {
      return new Response(JSON.stringify({ error: 'code, state et code_verifier sont requis' }), { status: 400, headers: corsHeaders })
    }

    const { data: oauthState, error: stateError } = await supabaseAdmin
      .from('mailbox_oauth_states')
      .select('tenant_id, utilisateur_id, code_challenge, expires_at')
      .eq('state', state)
      .maybeSingle()
    if (stateError || !oauthState) {
      return new Response(JSON.stringify({ error: 'Requête de connexion invalide ou expirée.' }), { status: 400, headers: corsHeaders })
    }
    if (new Date(oauthState.expires_at).getTime() < Date.now()) {
      await supabaseAdmin.from('mailbox_oauth_states').delete().eq('state', state)
      return new Response(JSON.stringify({ error: 'Requête de connexion expirée, veuillez réessayer.' }), { status: 400, headers: corsHeaders })
    }

    const { data: membre, error: membreError } = await supabaseAdmin
      .from('utilisateurs')
      .select('id, auth_user_id')
      .eq('id', oauthState.utilisateur_id)
      .maybeSingle()
    if (membreError || !membre || membre.auth_user_id !== caller.id) {
      return new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403, headers: corsHeaders })
    }

    const expectedChallenge = await codeChallengeFromVerifier(code_verifier)
    if (expectedChallenge !== oauthState.code_challenge) {
      return new Response(JSON.stringify({ error: 'Vérification PKCE invalide.' }), { status: 400, headers: corsHeaders })
    }

    const provider = getMailboxProvider(supabaseAdmin, 'outlook')
    const connection = await provider.handleCallback({
      tenantId: oauthState.tenant_id,
      utilisateurId: oauthState.utilisateur_id,
      code,
      codeVerifier: code_verifier,
      redirectUri: mailboxCallbackRedirectUri(),
    })

    await supabaseAdmin.from('mailbox_oauth_states').delete().eq('state', state)

    return new Response(JSON.stringify({ connection }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
