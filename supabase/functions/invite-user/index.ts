import { createClient } from 'jsr:@supabase/supabase-js@2'
import { canManageEtude } from '../_shared/authorize.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401, headers: corsHeaders })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify the caller's session
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Session invalide' }), { status: 401, headers: corsHeaders })
    }

    const { email, prenom, nom, role, tenant_id } = await req.json()
    if (!email || !role || !tenant_id) {
      return new Response(JSON.stringify({ error: 'email, role et tenant_id sont requis' }), { status: 400, headers: corsHeaders })
    }

    if (!(await canManageEtude(supabaseAdmin, caller.id, tenant_id))) {
      return new Response(JSON.stringify({ error: 'Accès refusé à cette étude.' }), { status: 403, headers: corsHeaders })
    }

    // Invite the user — if already registered, look them up instead
    let authUserId: string
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { prenom, nom },
    })

    if (inviteError) {
      if (inviteError.message?.toLowerCase().includes('already been registered') || inviteError.status === 422) {
        // User exists — find their ID via the admin API
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        const existing = listData?.users?.find(u => u.email === email)
        if (listError || !existing) {
          return new Response(JSON.stringify({ error: 'Utilisateur déjà inscrit mais introuvable.' }), { status: 400, headers: corsHeaders })
        }
        authUserId = existing.id
      } else {
        return new Response(JSON.stringify({ error: inviteError.message }), { status: 400, headers: corsHeaders })
      }
    } else {
      authUserId = inviteData.user.id
    }

    // Create utilisateur record (skip if already in this étude)
    const { error: uError } = await supabaseAdmin.from('utilisateurs').insert({
      auth_user_id: authUserId,
      tenant_id,
      prenom: prenom?.trim() || null,
      nom: nom?.trim() || null,
      roles: [role],
    })
    if (uError) {
      if (uError.code === '23505') {
        return new Response(JSON.stringify({ error: 'Cet utilisateur est déjà membre de cette étude.' }), { status: 409, headers: corsHeaders })
      }
      return new Response(JSON.stringify({ error: uError.message }), { status: 400, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true, user_id: authUserId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
