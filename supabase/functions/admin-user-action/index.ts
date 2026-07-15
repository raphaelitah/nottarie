import { createClient } from 'jsr:@supabase/supabase-js@2'
import { canManageEtude, isPlatformAdmin } from '../_shared/authorize.ts'

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

    if (action === 'update_roles' || action === 'set_actif') {
      if (!utilisateur_id) {
        return new Response(JSON.stringify({ error: 'utilisateur_id requis' }), { status: 400, headers: corsHeaders })
      }
      if (action === 'update_roles' && !roles) {
        return new Response(JSON.stringify({ error: 'roles requis' }), { status: 400, headers: corsHeaders })
      }
      if (action === 'set_actif' && actif === undefined) {
        return new Response(JSON.stringify({ error: 'actif requis' }), { status: 400, headers: corsHeaders })
      }

      const { data: target, error: targetError } = await supabaseAdmin
        .from('utilisateurs')
        .select('tenant_id')
        .eq('id', utilisateur_id)
        .maybeSingle()
      if (targetError) return new Response(JSON.stringify({ error: targetError.message }), { status: 500, headers: corsHeaders })
      if (!target) return new Response(JSON.stringify({ error: 'Utilisateur introuvable' }), { status: 404, headers: corsHeaders })

      if (!(await canManageEtude(supabaseAdmin, caller.id, target.tenant_id))) {
        return new Response(JSON.stringify({ error: 'Accès refusé à cette étude.' }), { status: 403, headers: corsHeaders })
      }

      const { error } = await supabaseAdmin
        .from('utilisateurs')
        .update(action === 'update_roles' ? { roles } : { actif })
        .eq('id', utilisateur_id)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'resend_invite') {
      if (!email) {
        return new Response(JSON.stringify({ error: 'email requis' }), { status: 400, headers: corsHeaders })
      }

      const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
      const target = listData?.users?.find(u => u.email === email)
      if (!target) {
        return new Response(JSON.stringify({ error: 'Utilisateur introuvable' }), { status: 404, headers: corsHeaders })
      }
      if (target.last_sign_in_at) {
        return new Response(JSON.stringify({ error: 'Cet utilisateur a déjà défini son mot de passe.' }), { status: 409, headers: corsHeaders })
      }

      const { data: memberships } = await supabaseAdmin
        .from('utilisateurs')
        .select('tenant_id')
        .eq('auth_user_id', target.id)

      const callerIsPlatformAdmin = await isPlatformAdmin(supabaseAdmin, caller.id)
      const callerManagesAMembership = (
        await Promise.all((memberships ?? []).map(m => canManageEtude(supabaseAdmin, caller.id, m.tenant_id)))
      ).some(Boolean)
      if (!callerIsPlatformAdmin && !callerManagesAMembership) {
        return new Response(JSON.stringify({ error: 'Accès refusé à cet utilisateur.' }), { status: 403, headers: corsHeaders })
      }

      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: 'https://nottarie.pages.dev/',
      })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'reset_password') {
      if (!email) {
        return new Response(JSON.stringify({ error: 'email requis' }), { status: 400, headers: corsHeaders })
      }

      const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
      const target = listData?.users?.find(u => u.email === email)
      if (!target) {
        return new Response(JSON.stringify({ error: 'Utilisateur introuvable' }), { status: 404, headers: corsHeaders })
      }

      const { data: memberships } = await supabaseAdmin
        .from('utilisateurs')
        .select('tenant_id')
        .eq('auth_user_id', target.id)

      const callerIsPlatformAdmin = await isPlatformAdmin(supabaseAdmin, caller.id)
      const callerManagesAMembership = (
        await Promise.all((memberships ?? []).map(m => canManageEtude(supabaseAdmin, caller.id, m.tenant_id)))
      ).some(Boolean)
      if (!callerIsPlatformAdmin && !callerManagesAMembership) {
        return new Response(JSON.stringify({ error: 'Accès refusé à cet utilisateur.' }), { status: 403, headers: corsHeaders })
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
