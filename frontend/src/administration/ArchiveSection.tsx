import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabase'
import { Badge, Button } from '../design-system'
import type { Dossier, Immeuble, Personne, Utilisateur } from '../types/database'
import { acteTypeLabel } from '../constants/acteTypes'
import { dossierStatutLabel } from '../constants/dossierStatuts'
import { utilisateurLabel } from '../utilisateurs/utilisateurLabel'
import { personneDisplayName } from '../personnes/personneForm'
import { immeubleDisplayName } from '../immeubles/immeubleForm'

function statutBadgeStatus(statut: string): 'ongoing' | 'archived' {
  return statut === 'cloture' ? 'archived' : 'ongoing'
}

function formatDateTimeFr(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('fr-FR')
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${date} à ${time}`
}

export function ArchiveSection({ etudeId }: { etudeId: string }) {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [utilisateurs, setUtilisateurs] = useState<Record<string, Utilisateur>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('tenant_id', etudeId)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })
    if (error) { setError('Impossible de charger les dossiers archivés : ' + error.message); setLoading(false); return }
    setError(null)
    const rows = data ?? []
    setDossiers(rows)

    const userIds = [...new Set(rows.map((d) => d.mis_a_jour_par).filter((id): id is string => !!id))]
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('utilisateurs').select('*').in('id', userIds)
      setUtilisateurs(Object.fromEntries((users ?? []).map((u) => [u.id, u])))
    } else {
      setUtilisateurs({})
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etudeId])

  async function handleRestore(dossier: Dossier) {
    setRestoringId(dossier.id)
    setError(null)
    const { error } = await supabase.from('dossiers').update({ archived_at: null }).eq('id', dossier.id)
    setRestoringId(null)
    if (error) { setError('Erreur lors de la restauration : ' + error.message); return }
    load()
  }

  return (
    <div>
      <h3 style={h3}>Dossiers archivés</h3>
      <p style={subtitle}>Dossiers supprimés par un administrateur. Ils restent conservés et peuvent être restaurés à tout moment.</p>

      {error && <div style={alertStyle}>{error}</div>}

      {loading ? (
        <div style={emptyCard}>Chargement…</div>
      ) : dossiers.length === 0 ? (
        <div style={emptyCard}>Aucun dossier archivé.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          {dossiers.map((d) => (
            <div key={d.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <span style={numero}>{d.numero || 'Dossier sans numéro'}</span>
                    <Badge status={statutBadgeStatus(d.statut)} label={dossierStatutLabel(d.statut)} />
                  </div>
                  <div style={meta}>
                    {acteTypeLabel(d.type_acte)}
                    {d.archived_at && (
                      <>{' · Archivé le '}{formatDateTimeFr(d.archived_at)}{' par '}{utilisateurLabel(utilisateurs[d.mis_a_jour_par ?? ''])}</>
                    )}
                  </div>
                </div>
                <Button variant="secondary" size="sm" disabled={restoringId === d.id} onClick={() => handleRestore(d)}>
                  {restoringId === d.id ? 'Restauration…' : 'Restaurer'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'var(--space-8)' }}>
        <PersonnesArchiveSection etudeId={etudeId} />
      </div>

      <div style={{ marginTop: 'var(--space-8)' }}>
        <ImmeublesArchiveSection etudeId={etudeId} />
      </div>
    </div>
  )
}

function PersonnesArchiveSection({ etudeId }: { etudeId: string }) {
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('personnes')
      .select('*')
      .eq('tenant_id', etudeId)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })
    if (error) { setError('Impossible de charger les personnes archivées : ' + error.message); setLoading(false); return }
    setError(null)
    setPersonnes(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etudeId])

  async function handleRestore(personne: Personne) {
    setRestoringId(personne.id)
    setError(null)
    const { error } = await supabase.from('personnes').update({ archived_at: null }).eq('id', personne.id)
    setRestoringId(null)
    if (error) { setError('Erreur lors de la restauration : ' + error.message); return }
    load()
  }

  return (
    <div>
      <h3 style={h3}>Personnes archivées</h3>
      <p style={subtitle}>Personnes archivées par un notaire ou un administrateur. Elles restent conservées et peuvent être restaurées à tout moment.</p>

      {error && <div style={alertStyle}>{error}</div>}

      {loading ? (
        <div style={emptyCard}>Chargement…</div>
      ) : personnes.length === 0 ? (
        <div style={emptyCard}>Aucune personne archivée.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          {personnes.map((p) => (
            <div key={p.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                <div style={{ minWidth: 0 }}>
                  <span style={numero}>{personneDisplayName(p)}</span>
                  <div style={meta}>
                    {p.archived_at && <>Archivée le {formatDateTimeFr(p.archived_at)}</>}
                  </div>
                </div>
                <Button variant="secondary" size="sm" disabled={restoringId === p.id} onClick={() => handleRestore(p)}>
                  {restoringId === p.id ? 'Restauration…' : 'Restaurer'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ImmeublesArchiveSection({ etudeId }: { etudeId: string }) {
  const [immeubles, setImmeubles] = useState<Immeuble[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('immeubles')
      .select('*')
      .eq('tenant_id', etudeId)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })
    if (error) { setError('Impossible de charger les immeubles archivés : ' + error.message); setLoading(false); return }
    setError(null)
    setImmeubles(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etudeId])

  async function handleRestore(immeuble: Immeuble) {
    setRestoringId(immeuble.id)
    setError(null)
    const { error } = await supabase.from('immeubles').update({ archived_at: null }).eq('id', immeuble.id)
    setRestoringId(null)
    if (error) { setError('Erreur lors de la restauration : ' + error.message); return }
    load()
  }

  return (
    <div>
      <h3 style={h3}>Immeubles archivés</h3>
      <p style={subtitle}>Immeubles archivés par un notaire ou un administrateur. Ils restent conservés et peuvent être restaurés à tout moment.</p>

      {error && <div style={alertStyle}>{error}</div>}

      {loading ? (
        <div style={emptyCard}>Chargement…</div>
      ) : immeubles.length === 0 ? (
        <div style={emptyCard}>Aucun immeuble archivé.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          {immeubles.map((i) => (
            <div key={i.id} style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                <div style={{ minWidth: 0 }}>
                  <span style={numero}>{immeubleDisplayName(i)}</span>
                  <div style={meta}>
                    {i.archived_at && <>Archivé le {formatDateTimeFr(i.archived_at)}</>}
                  </div>
                </div>
                <Button variant="secondary" size="sm" disabled={restoringId === i.id} onClick={() => handleRestore(i)}>
                  {restoringId === i.id ? 'Restauration…' : 'Restaurer'}
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

const subtitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: 'var(--space-1) 0 0',
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
  marginTop: 'var(--space-4)',
}

const card: CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4) var(--space-5)',
  boxShadow: 'var(--shadow-xs)',
}

const numero: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const meta: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginTop: '2px',
}

const alertStyle: CSSProperties = {
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)',
  margin: 'var(--space-4) 0',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: '#DC2626',
}
