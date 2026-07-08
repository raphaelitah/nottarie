import { createClient } from 'jsr:@supabase/supabase-js@2'
import { isTenantMember, isNotaireOrAdmin } from '../_shared/authorize.ts'
import { getSignatureProvider, MockSignatureProvider } from '../_shared/signature/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Action = 'designate' | 'request' | 'status' | 'retrieve' | 'simulate'

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

    const body = await req.json()
    const action = body.action as Action
    const provider = getSignatureProvider(supabaseAdmin)

    if (action === 'designate') {
      const { acte_id } = body
      if (!acte_id) {
        return new Response(JSON.stringify({ error: 'acte_id est requis' }), { status: 400, headers: corsHeaders })
      }
      const { data: acte } = await supabaseAdmin.from('actes').select('tenant_id').eq('id', acte_id).maybeSingle()
      if (!acte) return new Response(JSON.stringify({ error: 'Acte introuvable.' }), { status: 404, headers: corsHeaders })
      if (!(await isNotaireOrAdmin(supabaseAdmin, caller.id, acte.tenant_id))) {
        return new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403, headers: corsHeaders })
      }
      const result = await provider.designateSigners(acte.tenant_id, acte_id)
      return new Response(JSON.stringify({ signatureRequest: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { signature_request_id } = body
    if (!signature_request_id) {
      return new Response(JSON.stringify({ error: 'signature_request_id est requis' }), { status: 400, headers: corsHeaders })
    }

    const { data: existing } = await supabaseAdmin
      .from('signature_requests')
      .select('tenant_id')
      .eq('id', signature_request_id)
      .maybeSingle()
    if (!existing) return new Response(JSON.stringify({ error: 'Demande de signature introuvable.' }), { status: 404, headers: corsHeaders })
    if (!(await isTenantMember(supabaseAdmin, caller.id, existing.tenant_id))) {
      return new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403, headers: corsHeaders })
    }

    if (action === 'request') {
      if (!(await isNotaireOrAdmin(supabaseAdmin, caller.id, existing.tenant_id))) {
        return new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403, headers: corsHeaders })
      }
      const result = await provider.requestSignature(existing.tenant_id, signature_request_id)
      return new Response(JSON.stringify({ signatureRequest: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'status') {
      const result = await provider.getStatus(existing.tenant_id, signature_request_id)
      return new Response(JSON.stringify({ signatureRequest: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'retrieve') {
      const result = await provider.retrieveSignedDocument(existing.tenant_id, signature_request_id)
      return new Response(JSON.stringify({ signedDocument: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'simulate') {
      // Mock-only escape hatch (see MockSignatureProvider.simulateCompletion):
      // stands in for the callback a real provider would deliver. A real
      // provider wouldn't expose this action at all.
      if (!(provider instanceof MockSignatureProvider)) {
        return new Response(JSON.stringify({ error: "L'action 'simulate' n'existe que pour le fournisseur mock." }), { status: 400, headers: corsHeaders })
      }
      if (!(await isNotaireOrAdmin(supabaseAdmin, caller.id, existing.tenant_id))) {
        return new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403, headers: corsHeaders })
      }
      const result = await provider.simulateCompletion(existing.tenant_id, signature_request_id)
      return new Response(JSON.stringify({ signatureRequest: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Action inconnue.' }), { status: 400, headers: corsHeaders })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
