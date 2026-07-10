import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'npm:docx'
import { isTenantMember } from '../_shared/authorize.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TiptapNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  text?: string
  marks?: { type: string }[]
}

function inlineRuns(nodes: TiptapNode[] | undefined, donnees: Record<string, string>): TextRun[] {
  const runs: TextRun[] = []
  for (const node of nodes ?? []) {
    if (node.type === 'text') {
      const bold = node.marks?.some((m) => m.type === 'bold') ?? false
      const italics = node.marks?.some((m) => m.type === 'italic') ?? false
      runs.push(new TextRun({ text: node.text ?? '', bold, italics }))
    } else if (node.type === 'champ') {
      const key = String(node.attrs?.key ?? '')
      const label = String(node.attrs?.label ?? key)
      const value = String(node.attrs?.value ?? '')
      if (key && value.trim()) donnees[key] = value.trim()
      runs.push(new TextRun({ text: value.trim() ? value : `[${label}]`, bold: !value.trim() }))
    }
  }
  return runs
}

function paragraphsFromDoc(doc: TiptapNode, donnees: Record<string, string>): Paragraph[] {
  const paragraphs: Paragraph[] = []
  for (const node of doc.content ?? []) {
    if (node.type === 'heading') {
      const level = Number(node.attrs?.level ?? 1)
      paragraphs.push(new Paragraph({
        heading: level <= 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: inlineRuns(node.content, donnees),
      }))
    } else if (node.type === 'paragraph') {
      paragraphs.push(new Paragraph({ spacing: { after: 120 }, children: inlineRuns(node.content, donnees) }))
    } else if (node.type === 'bulletList') {
      for (const item of node.content ?? []) {
        for (const p of item.content ?? []) {
          paragraphs.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: inlineRuns(p.content, donnees) }))
        }
      }
    }
  }
  return paragraphs
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

    const { dossier_id, content, acte_id } = await req.json()
    if (!dossier_id || !content || typeof content !== 'object') {
      return new Response(JSON.stringify({ error: 'dossier_id et content sont requis' }), { status: 400, headers: corsHeaders })
    }

    const { data: dossier, error: dossierError } = await supabaseAdmin
      .from('dossiers')
      .select('id, tenant_id, type_acte, numero')
      .eq('id', dossier_id)
      .maybeSingle()
    if (dossierError || !dossier) {
      return new Response(JSON.stringify({ error: 'Dossier introuvable.' }), { status: 404, headers: corsHeaders })
    }

    if (!(await isTenantMember(supabaseAdmin, caller.id, dossier.tenant_id))) {
      return new Response(JSON.stringify({ error: 'Accès refusé à ce dossier.' }), { status: 403, headers: corsHeaders })
    }

    let existingActe: { id: string; statut: string; dossier_id: string; documents: { id: string; storage_path: string }[] } | null = null
    if (acte_id) {
      const { data: found, error: acteFetchError } = await supabaseAdmin
        .from('actes')
        .select('id, statut, dossier_id, documents(id, storage_path)')
        .eq('id', acte_id)
        .maybeSingle()
      if (acteFetchError || !found) {
        return new Response(JSON.stringify({ error: 'Acte introuvable.' }), { status: 404, headers: corsHeaders })
      }
      if (found.dossier_id !== dossier.id) {
        return new Response(JSON.stringify({ error: "Cet acte n'appartient pas à ce dossier." }), { status: 403, headers: corsHeaders })
      }
      if (found.statut !== 'brouillon') {
        return new Response(JSON.stringify({ error: "Seul un acte au statut brouillon peut être modifié." }), { status: 409, headers: corsHeaders })
      }
      existingActe = found
    }

    const { data: trame } = await supabaseAdmin
      .from('trames')
      .select('id')
      .eq('type_acte', dossier.type_acte)
      .maybeSingle()
    if (!trame) {
      return new Response(JSON.stringify({ error: "Aucune trame nationale enregistrée pour ce type d'acte." }), { status: 404, headers: corsHeaders })
    }

    const donnees: Record<string, string> = {}
    const paragraphs = paragraphsFromDoc(content as TiptapNode, donnees)

    const doc = new Document({ sections: [{ children: paragraphs }] })
    const buffer = await Packer.toBuffer(doc)

    const fileName = `${dossier.numero || dossier.id} - ${dossier.type_acte}.docx`
    const storagePath = `${dossier.tenant_id}/${dossier.id}/${crypto.randomUUID()}.docx`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
    if (uploadError) {
      return new Response(JSON.stringify({ error: 'Erreur de stockage : ' + uploadError.message }), { status: 500, headers: corsHeaders })
    }

    let acte: { id: string; [key: string]: unknown }
    if (existingActe) {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('actes')
        .update({ donnees, content })
        .eq('id', existingActe.id)
        .select()
        .single()
      if (updateError || !updated) {
        return new Response(JSON.stringify({ error: "Erreur lors de la mise à jour de l'acte : " + updateError?.message }), { status: 500, headers: corsHeaders })
      }
      acte = updated

      for (const oldDoc of existingActe.documents) {
        await supabaseAdmin.storage.from('documents').remove([oldDoc.storage_path])
        await supabaseAdmin.from('documents').delete().eq('id', oldDoc.id)
      }
    } else {
      const { data: inserted, error: acteError } = await supabaseAdmin
        .from('actes')
        .insert({
          tenant_id: dossier.tenant_id,
          dossier_id: dossier.id,
          trame_id: trame.id,
          statut: 'brouillon',
          donnees,
          content,
        })
        .select()
        .single()
      if (acteError || !inserted) {
        return new Response(JSON.stringify({ error: "Erreur lors de l'enregistrement de l'acte : " + acteError?.message }), { status: 500, headers: corsHeaders })
      }
      acte = inserted
    }

    const { data: document, error: documentError } = await supabaseAdmin
      .from('documents')
      .insert({
        tenant_id: dossier.tenant_id,
        dossier_id: dossier.id,
        acte_id: acte.id,
        nom: fileName,
        storage_path: storagePath,
      })
      .select()
      .single()
    if (documentError || !document) {
      return new Response(JSON.stringify({ error: "Erreur lors de l'enregistrement du document : " + documentError?.message }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ acte, document }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
