import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../design-system'
import type { DocumentRow } from '../types/database'

interface DocumentsSectionProps {
  tenantId: string
  dossierId: string
}

export function DocumentsSection({ tenantId, dossierId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<DocumentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function loadDocuments() {
    setLoading(true)
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('dossier_id', dossierId)
      .is('acte_id', null)
      .order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les documents : ' + error.message)
    else setError(null)
    setDocuments(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadDocuments() }, [dossierId])

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setError(null)
    const storagePath = `${tenantId}/dossiers/${dossierId}/documents/${crypto.randomUUID()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file)
    if (uploadError) { setUploading(false); setError("Erreur lors de l'envoi du fichier : " + uploadError.message); return }

    const { error: insertError } = await supabase.from('documents').insert({
      tenant_id: tenantId,
      dossier_id: dossierId,
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Documents</h3>
        <Button variant="primary" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          {uploading ? 'Envoi…' : '+ Ajouter un document'}
        </Button>
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
        <div style={emptyCard}>Aucun document déposé pour ce dossier.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {documents.map((d) => (
            <div key={d.id} style={row}>
              <div style={{ minWidth: 0 }}>
                <span style={name}>{d.nom}</span>
                <span style={meta}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                <Button variant="ghost" size="sm" disabled={downloadingId === d.id} onClick={() => handleDownload(d)}>
                  {downloadingId === d.id ? '…' : 'Télécharger'}
                </Button>
                <Button variant="ghost" size="sm" disabled={removingId === d.id} onClick={() => handleRemove(d)}>
                  {removingId === d.id ? '…' : 'Supprimer'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
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
  padding: 'var(--space-6)',
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
