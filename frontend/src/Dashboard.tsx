import { lazy, Suspense, useState } from 'react'
import { useAuth } from './auth/useAuth'
import { Button } from './design-system/Button'
import { UserMenu } from './design-system/UserMenu'
import { AppFooter } from './design-system/AppFooter'
import { Badge } from './design-system/Badge'
import { Select } from './design-system/Select'
import { Drawer } from './design-system/Drawer'
import { NAV_QUERY, useMediaQuery } from './design-system/useMediaQuery'
import { ROLE_OPTIONS } from './constants/roles'
import type { RoleNotarial } from './types/database'
import { DossiersPage } from './dossiers/DossiersPage'
import { PersonnesPage } from './personnes/PersonnesPage'
import { ImmeublesPage } from './immeubles/ImmeublesPage'
import { WeekStrip } from './agenda/WeekStrip'
import { GlobalSearch } from './recherche/GlobalSearch'
import { AdministrationPage } from './administration/AdministrationPage'
import { MonComptePage } from './account/MonComptePage'
import { NouveauDossierButton } from './dashboard/NouveauDossierButton'
import { DossiersEnCoursCard } from './dashboard/DossiersEnCoursCard'
import { FormalitesEnAttenteCard } from './dashboard/FormalitesEnAttenteCard'

const AgendaPage = lazy(() => import('./agenda/AgendaPage').then((m) => ({ default: m.AgendaPage })))

type Section = 'accueil' | 'dossiers' | 'personnes' | 'immeubles' | 'agenda' | 'administration' | 'mon-compte'

export function Dashboard({ onSwitchToAdmin }: { onSwitchToAdmin?: () => void }) {
  const isMobileNav = useMediaQuery(NAV_QUERY)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { user, memberships, signOut, activeRoles, setActiveRole } = useAuth()
  // Returning from the Outlook OAuth redirect lands here with ?mailbox_oauth=1
  // in the URL — jump straight to Mon compte so MailboxConnectionSection
  // mounts and finishes the exchange, instead of stranding the callback on
  // whatever section happened to be default.
  const [section, setSection] = useState<Section>(() =>
    new URLSearchParams(window.location.search).get('mailbox_oauth') === '1' ? 'mon-compte' : 'accueil'
  )
  const [focusDossierId, setFocusDossierId] = useState<string | null>(null)
  const [focusPersonneId, setFocusPersonneId] = useState<string | null>(null)
  const [focusImmeubleId, setFocusImmeubleId] = useState<string | null>(null)
  const [dossiersResetKey, setDossiersResetKey] = useState(0)
  const [personnesResetKey, setPersonnesResetKey] = useState(0)
  const [immeublesResetKey, setImmeublesResetKey] = useState(0)

  function goToDossier(id: string) { setFocusDossierId(id); setSection('dossiers') }
  function goToPersonne(id: string) { setFocusPersonneId(id); setSection('personnes') }
  function goToImmeuble(id: string) { setFocusImmeubleId(id); setSection('immeubles') }
  function goToDossiersList() { setSection('dossiers'); setFocusDossierId(null); setDossiersResetKey(k => k + 1) }

  // A user belongs to a single étude in practice — the membership query is
  // scoped to auth_user_id, so this is just "my" row (if any).
  const membership = memberships[0] ?? null
  const isAdmin = membership?.roles.includes('administrateur') ?? false
  const activeRole = membership
    ? activeRoles[membership.tenant_id] ?? (isAdmin ? 'administrateur' : membership.roles[0])
    : null

  function selectSection(next: Section) {
    setSection(next)
    setMobileNavOpen(false)
  }

  const navLinks = (
    <>
      <SidebarLink active={section === 'accueil'} onClick={() => selectSection('accueil')}>Accueil</SidebarLink>
      <SidebarLink active={section === 'agenda'} onClick={() => selectSection('agenda')}>Agenda</SidebarLink>
      <SidebarLink active={section === 'dossiers'} onClick={() => { selectSection('dossiers'); setFocusDossierId(null); setDossiersResetKey(k => k + 1) }}>Dossiers</SidebarLink>
      <SidebarLink active={section === 'personnes'} onClick={() => { selectSection('personnes'); setFocusPersonneId(null); setPersonnesResetKey(k => k + 1) }}>Personnes</SidebarLink>
      <SidebarLink active={section === 'immeubles'} onClick={() => { selectSection('immeubles'); setFocusImmeubleId(null); setImmeublesResetKey(k => k + 1) }}>Immeubles</SidebarLink>
      {isAdmin && (
        <>
          <div style={{ height: '1px', background: 'var(--border-default)', margin: 'var(--space-3) var(--space-2)' }} />
          <SidebarLink active={section === 'administration'} onClick={() => selectSection('administration')}>Administration de l'étude</SidebarLink>
        </>
      )}
    </>
  )

  return (
    <div style={{ minHeight: '100svh', background: 'var(--surface-subtle)', display: 'flex', flexDirection: 'column' }}>
      {/* Top nav */}
      <header style={{
        background: 'var(--color-ink)',
        padding: isMobileNav ? '0 var(--space-4)' : '0 var(--space-8)',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0, flexShrink: 1 }}>
          {membership && isMobileNav && (
            <button
              type="button"
              title="Navigation"
              aria-label="Ouvrir la navigation"
              onClick={() => setMobileNavOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                flexShrink: 0,
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid transparent',
                background: 'transparent',
                color: 'var(--n-400)',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
          )}
          <img src="/favicon.png" alt="" style={{ width: '28px', height: '28px', flexShrink: 0 }} />
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-md)',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: 'var(--tracking-tight)',
            flexShrink: 0,
          }}>Nottarie</span>
          {membership?.etude && !isMobileNav && (
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
            </>
          )}
        </div>

        {membership && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0, padding: isMobileNav ? '0 var(--space-2)' : '0 var(--space-6)' }}>
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

        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <UserMenu email={user?.email} onSignOut={signOut} onOpenAccount={membership ? () => setSection('mon-compte') : undefined}>
            {membership && (
              activeRole
                ? <Badge status="ongoing" label={ROLE_OPTIONS.find(o => o.value === activeRole)?.label ?? activeRole} />
                : <Badge status="archived" label="Aucun rôle" />
            )}
          </UserMenu>
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
          {/* Left nav — static on desktop, a drawer triggered by the header hamburger on mobile */}
          {!isMobileNav && (
            <nav style={{
              width: '220px',
              flexShrink: 0,
              background: 'var(--surface-subtle)',
              padding: 'var(--space-5) var(--space-3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-1)',
            }}>
              {navLinks}
            </nav>
          )}

          <Drawer open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} side="left" size="sm" title="Nottarie">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              {navLinks}
            </div>
          </Drawer>

          <main style={{ flex: 1, padding: isMobileNav ? 'var(--space-4)' : 'var(--space-8)', minWidth: 0, overflowY: 'auto' }}>
            {section === 'dossiers' ? (
              <DossiersPage
                key={dossiersResetKey}
                tenantId={membership.tenant_id}
                focusId={focusDossierId}
                onFocusHandled={() => setFocusDossierId(null)}
                onSelectPersonne={goToPersonne}
                onSelectImmeuble={goToImmeuble}
              />
            ) : section === 'personnes' ? (
              <PersonnesPage key={personnesResetKey} tenantId={membership.tenant_id} focusId={focusPersonneId} onFocusHandled={() => setFocusPersonneId(null)} onSelectDossier={goToDossier} />
            ) : section === 'immeubles' ? (
              <ImmeublesPage key={immeublesResetKey} tenantId={membership.tenant_id} focusId={focusImmeubleId} onFocusHandled={() => setFocusImmeubleId(null)} onSelectDossier={goToDossier} onSelectPersonne={goToPersonne} />
            ) : section === 'agenda' ? (
              <Suspense fallback={<p>Chargement…</p>}>
                <AgendaPage tenantId={membership.tenant_id} onSelectDossier={goToDossier} />
              </Suspense>
            ) : section === 'administration' && isAdmin ? (
              <AdministrationPage tenantId={membership.tenant_id} />
            ) : section === 'mon-compte' ? (
              <MonComptePage tenantId={membership.tenant_id} utilisateurId={membership.id} />
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
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
                  <NouveauDossierButton
                    tenantId={membership.tenant_id}
                    defaultClercId={membership.roles.includes('redacteur') ? membership.id : undefined}
                    onCreated={goToDossier}
                  />
                </div>
                <WeekStrip tenantId={membership.tenant_id} onOpenAgenda={() => setSection('agenda')} />
                <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-6)', flexWrap: 'wrap' }}>
                  <DossiersEnCoursCard
                    tenantId={membership.tenant_id}
                    onSelectDossier={goToDossier}
                    onViewAll={goToDossiersList}
                  />
                  <FormalitesEnAttenteCard
                    tenantId={membership.tenant_id}
                    onSelectDossier={goToDossier}
                  />
                </div>
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
                  height="30px"
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
