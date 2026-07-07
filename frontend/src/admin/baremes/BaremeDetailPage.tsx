import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../../lib/supabase'
import { Badge, Button } from '../../design-system'
import type { Bareme } from '../../types/database'
import { BaremeFormDrawer, type BaremeFormValues } from './BaremeFormDrawer'
import { baremeFormToTranches } from './baremeForm'

const TYPE_LABELS: Record<string, string> = { succession: 'Succession', donation: 'Donation' }
const SOUS_TYPE_LABELS: Record<string, string> = {
  acceptee: 'Acceptée',
  non_acceptee: 'Non acceptée',
  sur_acceptation: 'Sur acceptation',
  valeurs_mobilieres: 'Valeurs mobilières et sommes d’argent',
}

interface BaremeDetailPageProps {
  typeActe: 'succession' | 'donation'
  onBack: () => void
}

export function BaremeDetailPage({ typeActe, onBack }: BaremeDetailPageProps) {
  const [baremes, setBaremes] = useState<Bareme[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('baremes')
      .select('*')
      .eq('type_acte', typeActe)
      .order('sous_type')
      .order('version', { ascending: false })
    if (error) setError('Impossible de charger le barème : ' + error.message)
    else setBaremes(data ?? [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [typeActe])

  async function handleSave(values: BaremeFormValues) {
    setSaving(true)
    setError(null)

    const nextVersion = 1 + Math.max(
      0,
      ...baremes.filter((b) => b.sous_type === (values.sous_type || null)).map((b) => b.version),
    )

    const payload = {
      version: nextVersion,
      libelle: values.libelle.trim(),
      type_acte: typeActe,
      sous_type: typeActe === 'donation' ? values.sous_type : null,
      bareme: {
        source: values.source.trim(),
        effective_date: values.effective_date,
        tva_taux: Number(values.tva_taux_pct) / 100,
        csi_taux: Number(values.csi_taux_pct) / 100,
        debours_estimation_defaut: Number(values.debours_estimation_defaut),
        tranches: baremeFormToTranches(values),
      },
    }
    const { error } = await supabase.from('baremes').insert(payload)
    setSaving(false)
    if (error) { setError("Erreur lors de l'enregistrement : " + error.message); return }
    setDrawerOpen(false)
    load()
  }

  return (
    <div>
      <button onClick={onBack} style={breadcrumbBtn}>‹ Barèmes</button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={h1}>{TYPE_LABELS[typeActe]}</h1>
          <p style={subtitle}>Chaque nouvelle version s'ajoute à l'historique ; la version la plus récente par variante est celle utilisée par le calculateur.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setDrawerOpen(true)}>+ Nouvelle version</Button>
      </div>

      {error && <div style={alertStyle}>{error}</div>}

      {!loading && (
        baremes.length === 0 ? (
          <div style={emptyCard}>
            <p style={emptyText}>Aucune version enregistrée pour ce type d'acte.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            {baremes.map((b) => (
              <div key={b.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
                  <Badge status="draft" label={`v${b.version}`} size="sm" />
                  <div style={{ minWidth: 0 }}>
                    <div style={cardTitle}>{b.libelle}</div>
                    <div style={cardMeta}>
                      {b.sous_type && <span>{SOUS_TYPE_LABELS[b.sous_type]} · </span>}
                      {b.bareme.source} · en vigueur au {b.bareme.effective_date}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <BaremeFormDrawer
        open={drawerOpen}
        typeActe={typeActe}
        saving={saving}
        onSave={handleSave}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}

const breadcrumbBtn: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--color-ink)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  fontWeight: 500,
  marginBottom: 'var(--space-4)',
  display: 'block',
}

const h1: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xl)',
  fontWeight: 700,
  color: 'var(--n-900)',
  letterSpacing: 'var(--tracking-tight)',
  margin: '0 0 var(--space-1)',
}

const subtitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: 0,
  maxWidth: '480px',
}

const card: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--space-4)',
  padding: 'var(--space-4) var(--space-5)',
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
}

const cardTitle: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  color: 'var(--n-900)',
}

const cardMeta: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-muted)',
  marginTop: '2px',
}

const emptyCard: CSSProperties = {
  textAlign: 'center',
  padding: 'var(--space-7)',
  background: 'var(--surface-base)',
  border: '1px dashed var(--border-strong)',
  borderRadius: 'var(--radius-lg)',
  marginTop: 'var(--space-6)',
}

const emptyText: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-muted)',
  margin: 0,
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
