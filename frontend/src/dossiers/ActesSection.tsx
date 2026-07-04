import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Button } from '../design-system'
import type { Acte, DocumentRow, Dossier } from '../types/database'
import { ActeGenerationDrawer } from './ActeGenerationDrawer'

function acteStatutBadge(statut: string): 'draft' | 'signed' | 'ongoing' {
  if (statut === 'signe') return 'signed'
  if (statut === 'brouillon') return 'draft'
  return 'ongoing'
}

interface ActesSectionProps {
  dossier: Dossier
}

export function ActesSection({ dossier }: ActesSectionProps) {
  const [actes, setActes] = useState<Acte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function loadActes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('actes')
      .select('*, documents(*)')
      .eq('dossier_id', dossier.id)
      .order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les actes : ' + error.message)
    else setError(null)
    setActes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadActes() }, [dossier.id])

  function handleGenerated() {
    setDrawerOpen(false)
    loadActes()
  }

  async function handleDownload(document: DocumentRow) {
    setDownloadingId(document.id)
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(document.storage_path, 60)
    setDownloadingId(null)
    if (error || !data) { setError('Impossible de générer le lien de téléchargement : ' + error?.message); return }
    window.open(data.signedUrl, '_blank')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
        <h3 style={h3}>Actes</h3>
        <Button variant="primary" size="sm" onClick={() => setDrawerOpen(true)}>+ Générer un acte</Button>
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
      ) : actes.length === 0 ? (
        <div style={emptyCard}>Aucun acte généré pour ce dossier.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {actes.map((acte) => {
            const document = acte.documents?.[0]
            return (
              <div key={acte.id} style={row}>
                <div style={{ minWidth: 0 }}>
                  <span style={name}>{document?.nom ?? 'Acte'}</span>
                  <span style={meta}>{new Date(acte.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                  <Badge status={acteStatutBadge(acte.statut)} />
                  {document && (
                    <Button variant="ghost" size="sm" disabled={downloadingId === document.id} onClick={() => handleDownload(document)}>
                      {downloadingId === document.id ? '…' : 'Télécharger'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ActeGenerationDrawer
        open={drawerOpen}
        dossier={dossier}
        onClose={() => setDrawerOpen(false)}
        onGenerated={handleGenerated}
      />
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
