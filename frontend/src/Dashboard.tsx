import { useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { Button } from './design-system/Button'
import { IconButton } from './design-system/IconButton'
import { AppFooter } from './design-system/AppFooter'
import { Badge } from './design-system/Badge'
import { Select } from './design-system/Select'
import { ROLE_OPTIONS } from './constants/roles'
import type { RoleNotarial } from './types/database'
import { DossiersPage } from './dossiers/DossiersPage'
import { PersonnesPage } from './personnes/PersonnesPage'
import { ImmeublesPage } from './immeubles/ImmeublesPage'
import { GlobalSearch } from './recherche/GlobalSearch'

type Section = 'accueil' | 'dossiers' | 'personnes' | 'immeubles'

export function Dashboard({ onSwitchToAdmin }: { onSwitchToAdmin?: () => void }) {
  const { user, memberships, signOut, activeRoles, setActiveRole } = useAuth()
  const [section, setSection] = useState<Section>('accueil')
  const [focusDossierId, setFocusDossierId] = useState<string | null>(null)
  const [focusPersonneId, setFocusPersonneId] = useState<string | null>(null)
  const [focusImmeubleId, setFocusImmeubleId] = useState<string | null>(null)

  function goToDossier(id: string) { setFocusDossierId(id); setSection('dossiers') }
  function goToPersonne(id: string) { setFocusPersonneId(id); setSection('personnes') }
  function goToImmeuble(id: string) { setFocusImmeubleId(id); setSection('immeubles') }

  // A user belongs to a single étude in practice — the membership query is
  // scoped to auth_user_id, so this is just "my" row (if any).
  const membership = memberships[0] ?? null
  const isAdmin = membership?.roles.includes('administrateur') ?? false
  const activeRole = membership
    ? activeRoles[membership.tenant_id] ?? (isAdmin ? 'administrateur' : membership.roles[0])
    : null

  return (
    <div style={{ minHeight: '100svh', background: 'var(--surface-subtle)', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <header style={{
        background: 'var(--color-ink)',
        padding: '0 var(--space-8)',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0, flexShrink: 1 }}>
          <img src="/favicon.png" alt="" style={{ width: '28px', height: '28px', flexShrink: 0 }} />
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-md)',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: 'var(--tracking-tight)',
            flexShrink: 0,
          }}>Nottarie</span>
          {membership?.etude && (
            <>
              <span style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
              <span
                title={membership.etude.raison_sociale}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: 'var(--n-400)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  minWidth: 0,
                }}>{membership.etude.raison_sociale}</span>
              <div style={{ flexShrink: 0 }}>
                {activeRole
                  ? <Badge status="ongoing" label={ROLE_OPTIONS.find(o => o.value === activeRole)?.label ?? activeRole} />
                  : <Badge status="archived" label="Aucun rôle" />}
              </div>
            </>
          )}
        </div>

        {membership && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0, padding: '0 var(--space-6)' }}>
            <div style={{ width: '100%', maxWidth: '640px' }}>
              <GlobalSearch
                tenantId={membership.tenant_id}
                onSelectDossier={goToDossier}
                onSelectPersonne={goToPersonne}
                onSelectImmeuble={goToImmeuble}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-xs)',
            color: 'var(--n-400)',
          }}>{user?.email}</span>
          <IconButton
            title="Se déconnecter"
            onClick={signOut}
            icon={(
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            )}
          />
        </div>
      </header>

      {/* Content */}
      {!membership ? (
        <main style={{
          flex: 1,
          padding: 'var(--space-8)',
          maxWidth: 'var(--content-width)',
          width: '100%',
          margin: '0 auto',
        }}>
          <div style={{
            background: 'var(--surface-base)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-10)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              width: '48px', height: '48px',
              background: 'var(--n-100)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              fontSize: '22px',
            }}>🏛️</div>
            <div style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              color: 'var(--n-900)',
              marginBottom: 'var(--space-2)',
            }}>Aucune étude associée</div>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              maxWidth: '320px',
              margin: '0 auto',
              lineHeight: 'var(--leading-normal)',
            }}>
              Votre compte n'est rattaché à aucune étude. Demandez à l'administrateur de vous ajouter.
            </p>
          </div>
        </main>
      ) : (
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Left nav */}
          <nav style={{
            width: '220px',
            flexShrink: 0,
            background: 'var(--surface-subtle)',
            padding: 'var(--space-5) var(--space-3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1)',
          }}>
            <SidebarLink active={section === 'accueil'} onClick={() => setSection('accueil')}>Accueil</SidebarLink>
            <SidebarLink active={section === 'dossiers'} onClick={() => setSection('dossiers')}>Dossiers</SidebarLink>
            <SidebarLink active={section === 'personnes'} onClick={() => setSection('personnes')}>Personnes</SidebarLink>
            <SidebarLink active={section === 'immeubles'} onClick={() => setSection('immeubles')}>Immeubles</SidebarLink>
          </nav>

          <main style={{ flex: 1, padding: 'var(--space-8)', minWidth: 0, overflowY: 'auto' }}>
            {section === 'dossiers' ? (
              <DossiersPage tenantId={membership.tenant_id} focusId={focusDossierId} onFocusHandled={() => setFocusDossierId(null)} />
            ) : section === 'personnes' ? (
              <PersonnesPage tenantId={membership.tenant_id} focusId={focusPersonneId} onFocusHandled={() => setFocusPersonneId(null)} />
            ) : section === 'immeubles' ? (
              <ImmeublesPage tenantId={membership.tenant_id} focusId={focusImmeubleId} onFocusHandled={() => setFocusImmeubleId(null)} />
            ) : (
              <div>
                <h1 style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 700,
                  color: 'var(--n-900)',
                  letterSpacing: 'var(--tracking-tight)',
                  margin: '0 0 var(--space-1)',
                }}>Tableau de bord</h1>
                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-muted)',
                  margin: 0,
                }}>Bienvenue dans votre espace Nottarie.</p>
              </div>
            )}
          </main>
        </div>
      )}

      {((isAdmin && membership) || onSwitchToAdmin) && (
        <AppFooter>
          {isAdmin && membership && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--n-400)', whiteSpace: 'nowrap' }}>
                Voir en tant que
              </span>
              <div style={{ width: '160px' }}>
                <Select
                  value={activeRole ?? undefined}
                  options={ROLE_OPTIONS}
                  onChange={e => setActiveRole(membership.tenant_id, e.target.value as RoleNotarial)}
                />
              </div>
            </div>
          )}
          {onSwitchToAdmin && (
            <Button variant="secondary" size="sm" onClick={onSwitchToAdmin}>
              Administration
            </Button>
          )}
        </AppFooter>
      )}
    </div>
  )
}

function SidebarLink({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: 'left',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        color: 'var(--color-ink)',
        textDecoration: active ? 'underline' : 'none',
        textUnderlineOffset: '3px',
        background: 'transparent',
        border: 'none',
        padding: '6px 8px',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
