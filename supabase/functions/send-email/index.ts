import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isTenantMember } from '../_shared/authorize.ts'
import { getMailboxProvider, NoMailboxConnectedError } from '../_shared/mailbox/index.ts'

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

    const { dossier_id, to, cc, subject, body_html, courrier_id } = await req.json()
    if (!dossier_id || !Array.isArray(to) || to.length === 0 || !subject) {
      return new Response(JSON.stringify({ error: 'dossier_id, to et subject sont requis' }), { status: 400, headers: corsHeaders })
    }

    const { data: dossier } = await supabaseAdmin.from('dossiers').select('tenant_id').eq('id', dossier_id).maybeSingle()
    if (!dossier) return new Response(JSON.stringify({ error: 'Dossier introuvable.' }), { status: 404, headers: corsHeaders })
    if (!(await isTenantMember(supabaseAdmin, caller.id, dossier.tenant_id))) {
      return new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403, headers: corsHeaders })
    }

    const { data: membre, error: membreError } = await supabaseAdmin
      .from('utilisateurs')
      .select('id')
      .eq('auth_user_id', caller.id)
      .eq('tenant_id', dossier.tenant_id)
      .maybeSingle()
    if (membreError || !membre) {
      return new Response(JSON.stringify({ error: 'Utilisateur introuvable.' }), { status: 404, headers: corsHeaders })
    }

    const provider = getMailboxProvider(supabaseAdmin, 'outlook')

    let result
    try {
      result = await provider.sendMail({
        tenantId: dossier.tenant_id,
        utilisateurId: membre.id,
        to,
        cc,
        subject,
        bodyHtml: body_html ?? '',
      })
    } catch (err) {
      if (err instanceof NoMailboxConnectedError) {
        return new Response(JSON.stringify({ error: 'no_mailbox_connected' }), { status: 409, headers: corsHeaders })
      }
      throw err
    }

    const { data: email, error: emailError } = await supabaseAdmin
      .from('emails')
      .insert({
        tenant_id: dossier.tenant_id,
        dossier_id,
        courrier_id: courrier_id ?? null,
        sens: 'sortant',
        objet: subject,
        corps: body_html ?? null,
        provider: 'outlook',
        provider_message_id: result.providerMessageId,
      })
      .select()
      .single()
    if (emailError) {
      return new Response(JSON.stringify({ error: emailError.message }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ email }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
