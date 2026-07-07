import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/useAuth'
import { Button, UserMenu, AppFooter, Input } from '../design-system'
import type { Etude } from '../types/database'
import { TrameLibraryPage } from './trames/TrameLibraryPage'
import { BaremeLibraryPage } from './baremes/BaremeLibraryPage'
import { EtudeUsersSection } from '../administration/EtudeUsersSection'

interface EtudeForm {
  raison_sociale: string
  siret: string
  numero_chambre: string
  telephone: string
  email: string
  adresse_ligne1: string
  code_postal: string
  ville: string
  pays: string
}

const EMPTY_ETUDE_FORM: EtudeForm = {
  raison_sociale: '',
  siret: '',
  numero_chambre: '',
  telephone: '',
  email: '',
  adresse_ligne1: '',
  code_postal: '',
  ville: '',
  pays: 'France',
}

function etudeToForm(e: Etude): EtudeForm {
  return {
    raison_sociale: e.raison_sociale,
    siret: e.siret ?? '',
    numero_chambre: e.numero_chambre ?? '',
    telephone: e.telephone ?? '',
    email: e.email ?? '',
    adresse_ligne1: e.adresse_ligne1 ?? '',
    code_postal: e.code_postal ?? '',
    ville: e.ville ?? '',
    pays: e.pays ?? 'France',
  }
}

export function AdminPage({ onSwitchToDashboard }: { onSwitchToDashboard?: () => void }) {
  const { user, signOut } = useAuth()
  const [section, setSection] = useState<'etudes' | 'trames' | 'baremes'>('etudes')
  const [trameLibraryKey, setTrameLibraryKey] = useState(0)
  const [baremeLibraryKey, setBaremeLibraryKey] = useState(0)
  const [etudes, setEtudes] = useState<Etude[]>([])
  const [form, setForm] = useState<EtudeForm>(EMPTY_ETUDE_FORM)
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'list' | 'create' | { edit: string } | { detail: string }>('list')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function loadEtudes() {
    const { data, error } = await supabase.from('etudes').select('*').order('created_at', { ascending: false })
    if (error) setError('Impossible de charger les études : ' + error.message)
    else setEtudes(data ?? [])
  }

  useEffect(() => { loadEtudes() }, [])

  function openCreate() {
    setForm(EMPTY_ETUDE_FORM)
    setError(null)
    setSuccess(null)
    setMode('create')
  }

  function openEdit(etude: Etude) {
    setForm(etudeToForm(etude))
    setError(null)
    setSuccess(null)
    setMode({ edit: etude.id })
  }

  function openDetail(etude: Etude) {
    setError(null)
    setSuccess(null)
    setMode({ detail: etude.id })
  }

  function backToList() {
    setMode('list')
    setError(null)
    setSuccess(null)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!form.raison_sociale.trim()) { setError('La raison sociale est obligatoire.'); return }
    setSaving(true)
    const payload = {
      raison_sociale: form.raison_sociale.trim(),
      siret: form.siret.trim() || null,
      numero_chambre: form.numero_chambre.trim() || null,
      telephone: form.telephone.trim() || null,
      email: form.email.trim() || null,
      adresse_ligne1: form.adresse_ligne1.trim() || null,
      code_postal: form.code_postal.trim() || null,
      ville: form.ville.trim() || null,
      pays: form.pays.trim() || 'France',
    }
    if (typeof mode === 'object' && 'edit' in mode) {
      const { error } = await supabase.from('etudes').update(payload).eq('id', mode.edit)
      setSaving(false)
      if (error) { setError('Erreur lors de la mise à jour : ' + error.message); return }
      setSuccess('Étude mise à jour.')
      await loadEtudes()
      setMode('list')
    } else {
      const { error } = await supabase.from('etudes').insert(payload)
      setSaving(false)
      if (error) { setError('Erreur lors de la création : ' + error.message); return }
      setSuccess('Étude créée avec succès.')
      await loadEtudes()
      setMode('list')
    }
  }

  const activeEtude =
    typeof mode === 'object' && 'detail' in mode ? etudes.find(e => e.id === mode.detail) ?? null
    : typeof mode === 'object' && 'edit' in mode ? etudes.find(e => e.id === mode.edit) ?? null
    : null

  return (
    <div style={{ minHeight: '100svh', background: 'var(--surface-subtle)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <img src="/favicon.png" alt="" style={{ width: '28px', height: '28px' }} />
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-md)', fontWeight: 700, color: '#fff', letterSpacing: 'var(--tracking-tight)' }}>Nottarie</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--n-400)', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>Administration</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserMenu email={user?.email} onSignOut={signOut} />
        </div>
      </header>

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
          <SidebarLink active={section === 'etudes'} onClick={() => setSection('etudes')}>Études</SidebarLink>
          <SidebarLink active={section === 'trames'} onClick={() => { setSection('trames'); setTrameLibraryKey(k => k + 1) }}>Trames</SidebarLink>
          <SidebarLink active={section === 'baremes'} onClick={() => { setSection('baremes'); setBaremeLibraryKey(k => k + 1) }}>Barèmes</SidebarLink>
        </nav>

        <main style={{ flex: 1, padding: 'var(--space-8)', minWidth: 0 }}>
          {section === 'trames' ? <TrameLibraryPage key={trameLibraryKey} />
          : section === 'baremes' ? <BaremeLibraryPage key={baremeLibraryKey} />
          : <>

        {/* Breadcrumb */}
        {mode !== 'list' && (
          <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button onClick={backToList} style={breadcrumbBtn}>Études</button>
            <span style={{ color: 'var(--n-400)', fontSize: 'var(--text-xs)' }}>›</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--n-700)', fontWeight: 600 }}>
              {mode === 'create' ? 'Nouvelle étude'
                : typeof mode === 'object' && 'edit' in mode ? `Modifier — ${activeEtude?.raison_sociale ?? ''}`
                : activeEtude?.raison_sociale ?? ''}
            </span>
          </div>
        )}

        {/* Feedback */}
        {error && <div style={alertStyle('danger')}>{error}</div>}
        {success && <div style={alertStyle('success')}>{success}</div>}

        {/* ── LIST ── */}
        {mode === 'list' && (
          <>
            <div style={{ marginBottom: 'var(--space-8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h1 style={h1}>Études</h1>
                <p style={subtitle}>Gérez les études notariales sur la plateforme.</p>
              </div>
              <Button variant="primary" size="sm" onClick={openCreate}>+ Nouvelle étude</Button>
            </div>

            {etudes.length === 0 ? (
              <div style={emptyCard}>
                <div style={emptyIcon}>🏛️</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--n-900)', marginBottom: 'var(--space-2)' }}>Aucune étude</div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', maxWidth: '280px', margin: '0 auto' }}>Créez la première étude notariale sur la plateforme.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={countLabel}>{etudes.length} étude{etudes.length > 1 ? 's' : ''}</div>
                {etudes.map(etude => (
                  <div key={etude.id} style={card}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                      {/* Row 1 : nom + boutons */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--n-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{etude.raison_sociale}</div>
                        <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
                          <IconButton icon="users" label="Utilisateurs" onClick={() => openDetail(etude)} />
                          <IconButton icon="pencil" label="Modifier" onClick={() => openEdit(etude)} />
                        </div>
                      </div>
                      {/* Row 2 : infos */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: '8px' }}>
                        <IconMeta icon="pin" value={etude.adresse_ligne1 ?? ''} />
                        <IconMeta icon="city" value={[etude.code_postal, etude.ville].filter(Boolean).join(' ')} />
                        <IconMeta icon="phone" value={etude.telephone ?? ''} href={etude.telephone ? `tel:${etude.telephone}` : undefined} />
                        <IconMeta icon="mail" value={etude.email ?? ''} href={etude.email ? `mailto:${etude.email}` : undefined} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── CREATE / EDIT FORM ── */}
        {(mode === 'create' || (typeof mode === 'object' && 'edit' in mode)) && (
          <div style={{ ...card, padding: 'var(--space-7)' }}>
            <h2 style={h2}>{mode === 'create' ? 'Nouvelle étude' : 'Modifier l\'étude'}</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

              {/* Identité */}
              <section>
                <div style={sectionLabel}>Identité</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={labelStyle}>Raison sociale *</label>
                    <Input placeholder="ex. Étude Maître Dupont" value={form.raison_sociale} onChange={e => setForm(f => ({ ...f, raison_sociale: e.target.value }))} />
                  </div>
                  <div style={grid2}>
                    <div>
                      <label style={labelStyle}>SIRET</label>
                      <Input placeholder="ex. 123 456 789 00012" value={form.siret} onChange={e => setForm(f => ({ ...f, siret: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>N° Chambre</label>
                      <Input placeholder="ex. 75-001" value={form.numero_chambre} onChange={e => setForm(f => ({ ...f, numero_chambre: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </section>

              <div style={divider} />

              {/* Contact */}
              <section>
                <div style={sectionLabel}>Contact</div>
                <div style={grid2}>
                  <div>
                    <label style={labelStyle}>Téléphone</label>
                    <Input placeholder="ex. 01 23 45 67 89" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <Input type="email" placeholder="ex. contact@etude-dupont.fr" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
              </section>

              <div style={divider} />

              {/* Adresse */}
              <section>
                <div style={sectionLabel}>Adresse</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={labelStyle}>Adresse</label>
                    <Input placeholder="ex. 12 rue de la Paix" value={form.adresse_ligne1} onChange={e => setForm(f => ({ ...f, adresse_ligne1: e.target.value }))} />
                  </div>
                  <div style={grid3}>
                    <div>
                      <label style={labelStyle}>Code postal</label>
                      <Input placeholder="ex. 75002" value={form.code_postal} onChange={e => setForm(f => ({ ...f, code_postal: e.target.value }))} />
                    </div>
                    <div style={{ gridColumn: 'span 1' }}>
                      <label style={labelStyle}>Ville</label>
                      <Input placeholder="ex. Paris" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} />
                    </div>
                    <div>
                      <label style={labelStyle}>Pays</label>
                      <Input placeholder="France" value={form.pays} onChange={e => setForm(f => ({ ...f, pays: e.target.value }))} />
                    </div>
                  </div>
                </div>
              </section>

              <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-2)' }}>
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  {saving ? 'Enregistrement…' : mode === 'create' ? 'Créer l\'étude' : 'Enregistrer'}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={backToList}>Annuler</Button>
              </div>
            </form>
          </div>
        )}

        {/* ── DETAIL / USERS ── */}
        {typeof mode === 'object' && 'detail' in mode && activeEtude && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Étude summary card */}
            <div style={card}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--n-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{activeEtude.raison_sociale}</div>
                  <div style={{ flexShrink: 0 }}>
                    <IconButton icon="pencil" label="Modifier" onClick={() => openEdit(activeEtude)} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', rowGap: '8px' }}>
                  <IconMeta icon="pin" value={activeEtude.adresse_ligne1 ?? ''} />
                  <IconMeta icon="city" value={[activeEtude.code_postal, activeEtude.ville].filter(Boolean).join(' ')} />
                  <IconMeta icon="phone" value={activeEtude.telephone ?? ''} href={activeEtude.telephone ? `tel:${activeEtude.telephone}` : undefined} />
                  <IconMeta icon="mail" value={activeEtude.email ?? ''} href={activeEtude.email ? `mailto:${activeEtude.email}` : undefined} />
                </div>
              </div>
            </div>

            <EtudeUsersSection etudeId={activeEtude.id} />
          </div>
        )}
          </>}
        </main>
      </div>

      {onSwitchToDashboard && (
        <AppFooter>
          <Button variant="secondary" size="sm" onClick={onSwitchToDashboard}>Mon tableau de bord</Button>
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

const ICON_SVGS: Record<string, (color: string) => React.JSX.Element> = {
  users: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  pencil: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    </svg>
  ),
  key: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5"/>
      <path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>
    </svg>
  ),
  ban: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="m4.9 4.9 14.2 14.2"/>
    </svg>
  ),
  refresh: (c) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 12a9 9 0 0 1-15 6.7L3 16"/>
      <path d="M21 3v5h-5M3 21v-5h5"/>
    </svg>
  ),
}

function IconButton({ icon, label, onClick, disabled }: { icon: keyof typeof ICON_SVGS; label: string; onClick: () => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false)
  const isDanger = icon === 'ban'
  const activeColor = isDanger ? '#991B1B' : '#1E2D45'
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={label}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        height: '32px',
        padding: hovered ? '0 10px' : '0 8px',
        background: hovered ? (isDanger ? '#FEF2F2' : 'var(--n-100)') : 'transparent',
        border: '1px solid',
        borderColor: hovered ? (isDanger ? '#FECACA' : 'var(--border-default)') : 'transparent',
        borderRadius: 'var(--radius-md)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 120ms ease',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      {ICON_SVGS[icon](hovered ? activeColor : '#716E84')}
      {hovered && (
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', fontWeight: 600, color: activeColor }}>
          {label}
        </span>
      )}
    </button>
  )
}

const ICONS: Record<string, React.JSX.Element> = {
  phone: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A07600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.4 2 2 0 0 1 3.58 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.62-1.62a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  mail: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A07600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  pin: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A07600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  city: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A07600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  id: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A07600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <path d="M16 10h2M16 14h2M6 10h4M6 14h4"/>
    </svg>
  ),
  building: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A07600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2"/>
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
    </svg>
  ),
}

function IconMeta({ icon, value, href }: { icon: keyof typeof ICONS; value: string; href?: string }) {
  const inner = (
    <>
      {ICONS[icon]}
      {value}
    </>
  )
  const base: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--text-muted)', marginRight: '40px', whiteSpace: 'nowrap', textDecoration: 'none' }
  return href
    ? <a href={href} style={base}>{inner}</a>
    : <span style={base}>{inner}</span>
}

// ── Styles ──

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--n-700)',
  marginBottom: 'var(--space-1)',
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-3)',
}

const h1: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xl)',
  fontWeight: 700,
  color: 'var(--n-900)',
  letterSpacing: 'var(--tracking-tight)',
  margin: '0 0 var(--space-1)',
}

const h2: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-base)',
  fontWeight: 700,
  color: 'var(--n-900)',
  margin: '0 0 var(--space-1)',
}

const subtitle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: 0,
}

const card: React.CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4) var(--space-5)',
  boxShadow: 'var(--shadow-xs)',
}

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 'var(--space-4)',
}

const grid3: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 'var(--space-4)',
}

const divider: React.CSSProperties = {
  borderTop: '1px solid var(--border-default)',
}

const countLabel: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: 'var(--tracking-caps)',
  textTransform: 'uppercase',
  marginBottom: 'var(--space-1)',
}

const emptyCard: React.CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-10)',
  textAlign: 'center',
  boxShadow: 'var(--shadow-sm)',
}

const emptyIcon: React.CSSProperties = {
  width: '48px',
  height: '48px',
  background: 'var(--n-100)',
  borderRadius: 'var(--radius-lg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto var(--space-4)',
  fontSize: '22px',
}

const breadcrumbBtn: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-accent)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  fontWeight: 500,
}

function alertStyle(type: 'danger' | 'success'): React.CSSProperties {
  return {
    background: type === 'danger' ? 'var(--color-danger-subtle, #FEF2F2)' : 'var(--color-success-subtle, #F0FDF4)',
    border: `1px solid ${type === 'danger' ? 'var(--color-danger-border, #FECACA)' : 'var(--color-success-border, #BBF7D0)'}`,
    borderRadius: 'var(--radius-md)',
    padding: 'var(--space-3) var(--space-4)',
    marginBottom: 'var(--space-4)',
    fontFamily: 'var(--font-sans)',
    fontSize: 'var(--text-sm)',
    color: type === 'danger' ? 'var(--color-danger, #DC2626)' : 'var(--color-success, #16A34A)',
  }
}
