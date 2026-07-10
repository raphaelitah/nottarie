import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { downloadIcon, eyeIcon, HoverIconButton, PdfViewerModal, SectionAddButton, trashIcon } from '../design-system'
import type { DocumentRow } from '../types/database'

function isPdf(name: string) {
  return name.toLowerCase().endsWith('.pdf')
}

interface PersonneDocumentsSectionProps {
  tenantId: string
  personneId: string
}

export function PersonneDocumentsSection({ tenantId, personneId }: PersonneDocumentsSectionProps) {
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [viewingDocument, setViewingDocument] = useState<DocumentRow | null>(null)
  const [viewingUrl, setViewingUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadDocuments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('personne_id', personneId)
      .order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les documents : ' + error.message)
    else setError(null)
    setDocuments(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personneId])

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)
    const storagePath = `${tenantId}/personnes/${personneId}/documents/${crypto.randomUUID()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file)
    if (uploadError) { setUploading(false); setError("Erreur lors de l'envoi du fichier : " + uploadError.message); return }

    const { error: insertError } = await supabase.from('documents').insert({
      tenant_id: tenantId,
      personne_id: personneId,
      nom: file.name,
      storage_path: storagePath,
    })
    setUploading(false)
    if (insertError) { setError("Erreur lors de l'enregistrement du document : " + insertError.message); return }
    loadDocuments()
  }

  async function handleDownload(document: DocumentRow) {
    setDownloadingId(document.id)
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(document.storage_path, 60)
    setDownloadingId(null)
    if (error || !data) { setError('Impossible de générer le lien de téléchargement : ' + error?.message); return }
    window.open(data.signedUrl, '_blank')
  }

  async function handleView(document: DocumentRow) {
    if (!isPdf(document.nom)) { handleDownload(document); return }
    setViewingDocument(document)
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(document.storage_path, 300)
    if (error || !data) { setError('Impossible de générer le lien de visualisation : ' + error?.message); setViewingDocument(null); return }
    setViewingUrl(data.signedUrl)
  }

  async function handleRemove(document: DocumentRow) {
    setRemovingId(document.id)
    const { error: storageError } = await supabase.storage.from('documents').remove([document.storage_path])
    if (storageError) { setRemovingId(null); setError('Erreur lors de la suppression du fichier : ' + storageError.message); return }
    const { error } = await supabase.from('documents').delete().eq('id', document.id)
    setRemovingId(null)
    if (error) { setError('Erreur lors de la suppression : ' + error.message); return }
    loadDocuments()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)', gap: 'var(--space-2)' }}>
        <h3 style={h3}>Documents</h3>
        <SectionAddButton
          label="Ajouter un document"
          busyLabel={uploading ? 'Envoi…' : undefined}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        />
        <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileSelected} />
      </div>

      {error && (
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: '#DC2626',
        }}>{error}</div>
      )}

      {loading ? (
        <div style={emptyCard}>Chargement…</div>
      ) : documents.length === 0 ? (
        <div style={emptyCard}>Aucun document déposé pour cette personne.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {documents.map((d) => (
            <div key={d.id} style={{ ...row, cursor: 'pointer' }} onClick={() => handleView(d)}>
              <div style={{ minWidth: 0 }}>
                <span style={name}>{d.nom}</span>
                <span style={meta}>{formatDateTime(d.created_at)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <HoverIconButton icon={eyeIcon} label="Voir" onClick={() => handleView(d)} />
                <HoverIconButton icon={downloadIcon} label="Télécharger" disabled={downloadingId === d.id} onClick={() => handleDownload(d)} />
                <HoverIconButton icon={trashIcon} label="Supprimer" danger disabled={removingId === d.id} onClick={() => handleRemove(d)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <PdfViewerModal
        open={!!viewingDocument}
        onClose={() => { setViewingDocument(null); setViewingUrl(null) }}
        title={viewingDocument?.nom ?? 'Document'}
        url={viewingUrl}
      />
    </div>
  )
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
}

const h3: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  fontWeight: 600,
  color: 'var(--n-900)',
  margin: 0,
}

const emptyCard: CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  minHeight: '60px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-3) var(--space-6)',
  textAlign: 'center',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  minHeight: '60px',
  padding: 'var(--space-3) var(--space-4)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
}

const name: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const meta: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginLeft: 'var(--space-3)',
}
