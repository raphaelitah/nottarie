import { createClient } from 'jsr:@supabase/supabase-js@2'

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

    const { action, utilisateur_id, roles, email, actif } = await req.json()

    if (action === 'update_roles') {
      if (!utilisateur_id || !roles) {
        return new Response(JSON.stringify({ error: 'utilisateur_id et roles requis' }), { status: 400, headers: corsHeaders })
      }
      const { error } = await supabaseAdmin
        .from('utilisateurs')
        .update({ roles })
        .eq('id', utilisateur_id)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'set_actif') {
      if (!utilisateur_id || actif === undefined) {
        return new Response(JSON.stringify({ error: 'utilisateur_id et actif requis' }), { status: 400, headers: corsHeaders })
      }
      const { error } = await supabaseAdmin
        .from('utilisateurs')
        .update({ actif })
        .eq('id', utilisateur_id)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'reset_password') {
      if (!email) {
        return new Response(JSON.stringify({ error: 'email requis' }), { status: 400, headers: corsHeaders })
      }
      const supabaseAnon = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
      )
      const { error } = await supabaseAnon.auth.resetPasswordForEmail(email)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Action inconnue' }), { status: 400, headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
