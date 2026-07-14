import { createClient } from 'jsr:@supabase/supabase-js@2'
import { encodeBase64 } from 'jsr:@std/encoding@1/base64'
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

    const { dossier_id, to, cc, subject, body_html, courrier_id, document_ids } = await req.json()
    if (!dossier_id || !Array.isArray(to) || to.length === 0 || !subject) {
      return new Response(JSON.stringify({ error: 'dossier_id, to et subject sont requis' }), { status: 400, headers: corsHeaders })
    }

    const { data: dossier } = await supabaseAdmin.from('dossiers').select('tenant_id').eq('id', dossier_id).maybeSingle()
    if (!dossier) return new Response(JSON.stringify({ error: 'Dossier introuvable.' }), { status: 404, headers: corsHeaders })
    if (!(await isTenantMember(supabaseAdmin, caller.id, dossier.tenant_id))) {
      return new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403, headers: corsHeaders })
    }

    let attachments: { filename: string; contentType: string; contentBase64: string }[] = []
    if (Array.isArray(document_ids) && document_ids.length > 0) {
      const { data: docs, error: docsError } = await supabaseAdmin
        .from('documents')
        .select('id, nom, storage_path, tenant_id, dossier_id')
        .in('id', document_ids)
      if (docsError) return new Response(JSON.stringify({ error: docsError.message }), { status: 500, headers: corsHeaders })
      const invalid = (docs ?? []).find((d) => d.tenant_id !== dossier.tenant_id || d.dossier_id !== dossier_id)
      if (invalid || (docs ?? []).length !== document_ids.length) {
        return new Response(JSON.stringify({ error: 'Un ou plusieurs documents sont introuvables pour ce dossier.' }), { status: 400, headers: corsHeaders })
      }
      attachments = await Promise.all((docs ?? []).map(async (d) => {
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage.from('documents').download(d.storage_path)
        if (downloadError || !fileData) throw new Error(`Impossible de récupérer le document "${d.nom}" : ${downloadError?.message}`)
        const buffer = await fileData.arrayBuffer()
        return {
          filename: d.nom,
          contentType: fileData.type || 'application/octet-stream',
          contentBase64: encodeBase64(buffer),
        }
      }))
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
        attachments,
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
        utilisateur_id: membre.id,
        destinataires: to,
        cc: cc ?? [],
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
