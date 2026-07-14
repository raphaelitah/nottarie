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

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user: caller }, error: authError } = await authClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Session invalide' }), { status: 401, headers: corsHeaders })
    }

    // Service-role writes bypass RLS, so auth.uid() is null inside the
    // log_historique trigger and audit entries lose attribution. This
    // header lets the trigger resolve the acting user the same way it
    // would for a direct client-side write.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { 'x-acting-user-id': caller.id } } },
    )

    const { dossier_id, titre, lieu, debut, fin, attendees } = await req.json()
    if (!dossier_id || !titre || !debut || !fin || !Array.isArray(attendees) || attendees.length === 0) {
      return new Response(JSON.stringify({ error: 'dossier_id, titre, debut, fin et attendees sont requis' }), { status: 400, headers: corsHeaders })
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
      result = await provider.createCalendarEvent({
        tenantId: dossier.tenant_id,
        utilisateurId: membre.id,
        titre,
        lieu: lieu ?? null,
        debut,
        fin,
        attendees,
      })
    } catch (err) {
      if (err instanceof NoMailboxConnectedError) {
        return new Response(JSON.stringify({ error: 'no_mailbox_connected' }), { status: 409, headers: corsHeaders })
      }
      throw err
    }

    const { data: evenement, error: evenementError } = await supabaseAdmin
      .from('evenements')
      .insert({
        tenant_id: dossier.tenant_id,
        titre,
        lieu: lieu ?? null,
        debut,
        fin,
        organisateur_id: membre.id,
        outlook_event_id: result.eventId,
      })
      .select()
      .single()
    if (evenementError) {
      return new Response(JSON.stringify({ error: evenementError.message }), { status: 500, headers: corsHeaders })
    }

    const { error: linkError } = await supabaseAdmin
      .from('evenement_dossiers')
      .insert({ tenant_id: dossier.tenant_id, evenement_id: evenement.id, dossier_id })
    if (linkError) {
      return new Response(JSON.stringify({ error: linkError.message }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ evenement }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
