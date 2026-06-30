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

    const url = new URL(req.url)
    const tenant_id = url.searchParams.get('tenant_id')
    if (!tenant_id) {
      return new Response(JSON.stringify({ error: 'tenant_id requis' }), { status: 400, headers: corsHeaders })
    }

    const { data, error } = await supabaseAdmin
      .from('utilisateurs')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: true })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }

    // Enrich with email from auth.users
    const authUserIds = (data ?? []).map((u: { auth_user_id: string }) => u.auth_user_id)
    const emailMap: Record<string, string> = {}
    if (authUserIds.length > 0) {
      const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      for (const au of authUsers ?? []) {
        if (authUserIds.includes(au.id)) emailMap[au.id] = au.email ?? ''
      }
    }

    const enriched = (data ?? []).map((u: { auth_user_id: string }) => ({
      ...u,
      email: emailMap[u.auth_user_id] ?? null,
    }))

    return new Response(JSON.stringify({ users: enriched }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
