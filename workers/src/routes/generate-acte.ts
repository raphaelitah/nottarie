import { Hono } from 'hono'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import type { Env } from '../shared/env'
import { dbPool } from '../shared/db'
import { AuthError, verifyAuthHeader, isTenantMember } from '../shared/auth'
import { deleteDocument, putDocument } from '../shared/documents'

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

const app = new Hono<{ Bindings: Env }>()

app.post('/', async (c) => {
  try {
    const authHeader = c.req.header('Authorization') ?? null
    if (!authHeader) {
      return c.json({ error: 'Non authentifié' }, 401)
    }

    let callerId: string
    try {
      callerId = await verifyAuthHeader(authHeader, c.env.NEON_AUTH_JWKS_URL)
    } catch (err) {
      if (err instanceof AuthError) return c.json({ error: 'Session invalide' }, 401)
      throw err
    }

    const pool = dbPool(c.env.DATABASE_URL)
    const { dossier_id, content, acte_id, nom } = await c.req.json()
    if (!dossier_id || !content || typeof content !== 'object') {
      return c.json({ error: 'dossier_id et content sont requis' }, 400)
    }
    const trimmedNom = typeof nom === 'string' ? nom.trim() : ''
    if (!trimmedNom) {
      return c.json({ error: "Le titre de l'acte est requis" }, 400)
    }

    const { rows: dossierRows } = await pool.query(
      'select id, tenant_id, type_acte, numero from dossiers where id = $1',
      [dossier_id],
    )
    const dossier = dossierRows[0]
    if (!dossier) {
      return c.json({ error: 'Dossier introuvable.' }, 404)
    }

    if (!(await isTenantMember(pool, callerId, dossier.tenant_id))) {
      return c.json({ error: 'Accès refusé à ce dossier.' }, 403)
    }

    let existingActe: { id: string; statut: string; dossier_id: string; documents: { id: string; storage_path: string }[] } | null = null
    if (acte_id) {
      const { rows: acteRows } = await pool.query(
        'select id, statut, dossier_id from actes where id = $1',
        [acte_id],
      )
      const found = acteRows[0]
      if (!found) {
        return c.json({ error: 'Acte introuvable.' }, 404)
      }
      if (found.dossier_id !== dossier.id) {
        return c.json({ error: "Cet acte n'appartient pas à ce dossier." }, 403)
      }
      if (found.statut !== 'brouillon') {
        return c.json({ error: 'Seul un acte au statut brouillon peut être modifié.' }, 409)
      }
      const { rows: docRows } = await pool.query(
        'select id, storage_path from documents where acte_id = $1',
        [found.id],
      )
      existingActe = { ...found, documents: docRows }
    }

    const { rows: trameRows } = await pool.query(
      'select id from trames where type_acte = $1',
      [dossier.type_acte],
    )
    const trame = trameRows[0]
    if (!trame) {
      return c.json({ error: "Aucune trame nationale enregistrée pour ce type d'acte." }, 404)
    }

    const donnees: Record<string, string> = {}
    const paragraphs = paragraphsFromDoc(content as TiptapNode, donnees)

    const doc = new Document({ sections: [{ children: paragraphs }] })
    const buffer = await Packer.toBuffer(doc)

    const fileName = `${dossier.numero || dossier.id} - ${dossier.type_acte}.docx`
    const relativeStoragePath = `${dossier.id}/${crypto.randomUUID()}.docx`
    const storagePath = `${dossier.tenant_id}/${relativeStoragePath}`

    try {
      await putDocument(
        c.env.DOCUMENTS,
        dossier.tenant_id,
        relativeStoragePath,
        buffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      )
    } catch (err) {
      return c.json({ error: 'Erreur de stockage : ' + String(err) }, 500)
    }

    let acte: { id: string; [key: string]: unknown }
    if (existingActe) {
      const { rows: updatedRows } = await pool.query(
        `update actes set donnees = $1, content = $2, nom = $3 where id = $4 returning *`,
        [donnees, content, trimmedNom, existingActe.id],
      )
      const updated = updatedRows[0]
      if (!updated) {
        return c.json({ error: "Erreur lors de la mise à jour de l'acte : introuvable" }, 500)
      }
      acte = updated

      for (const oldDoc of existingActe.documents) {
        await deleteDocument(c.env.DOCUMENTS, dossier.tenant_id, oldDoc.storage_path.replace(`${dossier.tenant_id}/`, ''))
        await pool.query('delete from documents where id = $1', [oldDoc.id])
      }
    } else {
      const { rows: insertedRows } = await pool.query(
        `insert into actes (tenant_id, dossier_id, trame_id, statut, nom, donnees, content)
         values ($1, $2, $3, 'brouillon', $4, $5, $6)
         returning *`,
        [dossier.tenant_id, dossier.id, trame.id, trimmedNom, donnees, content],
      )
      const inserted = insertedRows[0]
      if (!inserted) {
        return c.json({ error: "Erreur lors de l'enregistrement de l'acte : introuvable" }, 500)
      }
      acte = inserted
    }

    const { rows: documentRows } = await pool.query(
      `insert into documents (tenant_id, dossier_id, acte_id, nom, storage_path)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [dossier.tenant_id, dossier.id, acte.id, fileName, storagePath],
    )
    const document = documentRows[0]
    if (!document) {
      return c.json({ error: "Erreur lors de l'enregistrement du document : introuvable" }, 500)
    }

    return c.json({ acte, document })
  } catch (err) {
    return c.json({ error: String(err) }, 500)
  }
})

export default app
