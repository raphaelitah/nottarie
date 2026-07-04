import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Drawer, Button, Input } from '../design-system'
import type { Utilisateur } from '../types/database'
import { utilisateurLabel } from '../utilisateurs/utilisateurLabel'

interface AccesGrantDrawerProps {
  open: boolean
  utilisateurs: Utilisateur[]
  grantedIds: string[]
  saving: boolean
  onSave: (utilisateurId: string) => void
  onClose: () => void
}

export function AccesGrantDrawer({ open, utilisateurs, grantedIds, saving, onSave, onClose }: AccesGrantDrawerProps) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSearch('')
      setSelectedId(null)
      setError(null)
    }
  }, [open])

  const available = utilisateurs.filter((u) => !grantedIds.includes(u.id))
  const query = search.trim().toLowerCase()
  const results = query
    ? available.filter((u) => utilisateurLabel(u).toLowerCase().includes(query)).slice(0, 8)
    : available.slice(0, 8)
  const selected = available.find((u) => u.id === selectedId) ?? null

  function handleSubmit() {
    if (!selectedId) { setError('Sélectionnez une personne.'); return }
    setError(null)
    onSave(selectedId)
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Donner accès au dossier"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Ajout…' : 'Donner accès'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
            padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#DC2626',
          }}>{error}</div>
        )}

        {selected ? (
          <div style={selectedCard}>
            <span>{utilisateurLabel(selected)}</span>
            <button style={linkBtn} onClick={() => setSelectedId(null)}>Changer</button>
          </div>
        ) : (
          <div>
            <Input
              label="Rechercher une personne de l'étude"
              placeholder="Nom, prénom…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {results.length > 0 && (
              <div style={resultsList}>
                {results.map((u) => (
                  <button key={u.id} style={resultRow} onClick={() => { setSelectedId(u.id); setSearch('') }}>
                    {utilisateurLabel(u)}
                  </button>
                ))}
              </div>
            )}
            {results.length === 0 && (
              <p style={emptyHint}>Personne à ajouter.</p>
            )}
          </div>
        )}
      </div>
    </Drawer>
  )
}

const selectedCard: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  background: 'var(--surface-muted)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
}

const linkBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  color: 'var(--color-accent)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}

const resultsList: CSSProperties = {
  marginTop: '8px',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
}

const resultRow: CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: '10px 14px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
  background: 'var(--surface-base)',
  border: 'none',
  borderBottom: '1px solid var(--border-default)',
  cursor: 'pointer',
}

const emptyHint: CSSProperties = {
  marginTop: '8px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
}
