import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { acteTypeLabel } from '../constants/acteTypes'
import { personneDisplayName } from '../personnes/personneForm'
import { immeubleDisplayName } from '../immeubles/immeubleForm'
import { useCrossEntitySearch } from './useCrossEntitySearch'

interface GlobalSearchProps {
  tenantId: string
  onSelectDossier: (id: string) => void
  onSelectPersonne: (id: string) => void
  onSelectImmeuble: (id: string) => void
}

export function GlobalSearch({ tenantId, onSelectDossier, onSelectPersonne, onSelectImmeuble }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { loading, error, results } = useCrossEntitySearch(tenantId, query)

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handleSelect(action: () => void) {
    action()
    setOpen(false)
    setQuery('')
  }

  const showPanel = open && query.trim().length >= 2
  const totalCount = results ? results.dossiers.length + results.personnes.length + results.immeubles.length : null

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Rechercher un dossier, une personne, un immeuble…"
        style={inputStyle}
      />

      {showPanel && (
        <div style={panelStyle}>
          {error ? (
            <div style={hintStyle}>{error}</div>
          ) : loading ? (
            <div style={hintStyle}>Recherche…</div>
          ) : totalCount === 0 ? (
            <div style={hintStyle}>Aucun résultat.</div>
          ) : results ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {results.dossiers.length > 0 && (
                <ResultGroup title="Dossiers">
                  {results.dossiers.map((d) => (
                    <ResultRow
                      key={d.id}
                      title={d.numero || 'Dossier sans numéro'}
                      subtitle={acteTypeLabel(d.type_acte)}
                      onClick={() => handleSelect(() => onSelectDossier(d.id))}
                    />
                  ))}
                </ResultGroup>
              )}
              {results.personnes.length > 0 && (
                <ResultGroup title="Personnes">
                  {results.personnes.map((p) => (
                    <ResultRow
                      key={p.id}
                      title={personneDisplayName(p)}
                      subtitle={p.email ?? undefined}
                      onClick={() => handleSelect(() => onSelectPersonne(p.id))}
                    />
                  ))}
                </ResultGroup>
              )}
              {results.immeubles.length > 0 && (
                <ResultGroup title="Immeubles">
                  {results.immeubles.map((i) => (
                    <ResultRow
                      key={i.id}
                      title={immeubleDisplayName(i)}
                      subtitle={i.references_cadastrales ?? undefined}
                      onClick={() => handleSelect(() => onSelectImmeuble(i.id))}
                    />
                  ))}
                </ResultGroup>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function ResultGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={groupTitle}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>{children}</div>
    </div>
  )
}

function ResultRow({ title, subtitle, onClick }: { title: string; subtitle?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={row}>
      <span style={rowTitle}>{title}</span>
      {subtitle && <span style={rowSubtitle}>{subtitle}</span>}
    </button>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  height: '34px',
  padding: '0 14px',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: '#fff',
  background: 'rgba(255,255,255,0.10)',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: 'var(--radius-full)',
  outline: 'none',
  boxSizing: 'border-box',
}

const panelStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  right: 0,
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-lg)',
  padding: 'var(--space-4)',
  maxHeight: '420px',
  overflowY: 'auto',
  zIndex: 1000,
}

const hintStyle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
}

const groupTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-2xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-1)',
}

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  width: '100%',
  padding: 'var(--space-2) var(--space-2)',
  background: 'transparent',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  textAlign: 'left',
}

const rowTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const rowSubtitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
}
