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

interface TrameSectionRow {
  id: string
  title: string
  content: TiptapNode
  is_standard: boolean
}

function inlineRuns(nodes: TiptapNode[] | undefined, values: Record<string, string>): TextRun[] {
  const runs: TextRun[] = []
  for (const node of nodes ?? []) {
    if (node.type === 'text') {
      const bold = node.marks?.some((m) => m.type === 'bold') ?? false
      const italics = node.marks?.some((m) => m.type === 'italic') ?? false
      runs.push(new TextRun({ text: node.text ?? '', bold, italics }))
    } else if (node.type === 'champ') {
      const key = String(node.attrs?.key ?? '')
      const label = String(node.attrs?.label ?? key)
      const value = values[key]
      runs.push(new TextRun({ text: value && value.trim() ? value : `[${label}]`, bold: !(value && value.trim()) }))
    }
  }
  return runs
}

function paragraphsFromSection(doc: TiptapNode, values: Record<string, string>): Paragraph[] {
  const paragraphs: Paragraph[] = []
  for (const node of doc.content ?? []) {
    if (node.type === 'heading') {
      const level = Number(node.attrs?.level ?? 1)
      paragraphs.push(new Paragraph({
        heading: level <= 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: inlineRuns(node.content, values),
      }))
    } else if (node.type === 'paragraph') {
      paragraphs.push(new Paragraph({ spacing: { after: 120 }, children: inlineRuns(node.content, values) }))
    } else if (node.type === 'bulletList') {
      for (const item of node.content ?? []) {
        for (const p of item.content ?? []) {
          paragraphs.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 80 }, children: inlineRuns(p.content, values) }))
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

    const { dossier_id, section_ids, values } = await req.json()
    if (!dossier_id || typeof values !== 'object' || values === null) {
      return new Response(JSON.stringify({ error: 'dossier_id et values sont requis' }), { status: 400, headers: corsHeaders })
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

    const { data: standard, error: standardError } = await supabaseAdmin
      .from('trame_sections')
      .select('id, title, content, is_standard')
      .eq('type_acte', dossier.type_acte)
      .eq('is_standard', true)
      .eq('is_published', true)
      .maybeSingle()
    if (standardError || !standard) {
      return new Response(JSON.stringify({ error: "Aucun modèle standard publié pour ce type d'acte." }), { status: 404, headers: corsHeaders })
    }

    const { data: trame } = await supabaseAdmin
      .from('trames')
      .select('id')
      .eq('type_acte', dossier.type_acte)
      .maybeSingle()
    if (!trame) {
      return new Response(JSON.stringify({ error: "Aucune trame nationale enregistrée pour ce type d'acte." }), { status: 404, headers: corsHeaders })
    }

    let optionalSections: TrameSectionRow[] = []
    const requestedIds = Array.isArray(section_ids) ? section_ids.filter((id) => typeof id === 'string') : []
    if (requestedIds.length > 0) {
      const { data: sections, error: sectionsError } = await supabaseAdmin
        .from('trame_sections')
        .select('id, title, content, is_standard')
        .eq('type_acte', dossier.type_acte)
        .eq('is_published', true)
        .eq('is_standard', false)
        .in('id', requestedIds)
        .order('category')
        .order('title')
      if (sectionsError) {
        return new Response(JSON.stringify({ error: sectionsError.message }), { status: 500, headers: corsHeaders })
      }
      optionalSections = sections ?? []
    }

    const orderedSections: TrameSectionRow[] = [standard, ...optionalSections]
    const stringValues: Record<string, string> = {}
    for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
      stringValues[key] = value == null ? '' : String(value)
    }

    const paragraphs: Paragraph[] = []
    for (const section of orderedSections) {
      paragraphs.push(...paragraphsFromSection(section.content, stringValues))
      paragraphs.push(new Paragraph({ text: '' }))
    }

    const doc = new Document({ sections: [{ children: paragraphs }] })
    const buffer = await Packer.toBuffer(doc)

    const fileName = `${dossier.numero || dossier.id} - ${standard.title}.docx`
    const storagePath = `${dossier.tenant_id}/${dossier.id}/${crypto.randomUUID()}.docx`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
    if (uploadError) {
      return new Response(JSON.stringify({ error: 'Erreur de stockage : ' + uploadError.message }), { status: 500, headers: corsHeaders })
    }

    const { data: acte, error: acteError } = await supabaseAdmin
      .from('actes')
      .insert({
        tenant_id: dossier.tenant_id,
        dossier_id: dossier.id,
        trame_id: trame.id,
        statut: 'brouillon',
        donnees: stringValues,
      })
      .select()
      .single()
    if (acteError || !acte) {
      return new Response(JSON.stringify({ error: "Erreur lors de l'enregistrement de l'acte : " + acteError?.message }), { status: 500, headers: corsHeaders })
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
