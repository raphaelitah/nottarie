import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, EditPenButton, Input } from '../design-system'
import type { Etude } from '../types/database'

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

export function EtudeInfoSection({ etude, onUpdated }: { etude: Etude; onUpdated: (etude: Etude) => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EtudeForm>(etudeToForm(etude))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startEdit() {
    setForm(etudeToForm(etude))
    setError(null)
    setEditing(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
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
    const { data, error } = await supabase.from('etudes').update(payload).eq('id', etude.id).select().single()
    setSaving(false)
    if (error) { setError('Erreur lors de la mise à jour : ' + error.message); return }
    setEditing(false)
    onUpdated(data)
  }

  if (!editing) {
    return (
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={sectionLabel}>Informations de l'étude</div>
          <EditPenButton label="Modifier les informations de l'étude" onClick={startEdit} />
        </div>
        <div style={grid3}>
          <Field label="Raison sociale" value={etude.raison_sociale} />
          <Field label="SIRET" value={etude.siret ?? '—'} />
          <Field label="N° Chambre" value={etude.numero_chambre ?? '—'} />
          <Field label="Téléphone" value={etude.telephone ?? '—'} />
          <Field label="Email" value={etude.email ?? '—'} />
          <Field label="Pays" value={etude.pays} />
          <Field label="Adresse" value={etude.adresse_ligne1 ?? '—'} />
          <Field label="Code postal" value={etude.code_postal ?? '—'} />
          <Field label="Ville" value={etude.ville ?? '—'} />
        </div>
      </div>
    )
  }

  return (
    <div style={card}>
      {error && <div style={alertStyle}>{error}</div>}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
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
              <div>
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

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button type="submit" variant="primary" size="sm" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>Annuler</Button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={valueStyle}>{value}</div>
    </div>
  )
}

const card: React.CSSProperties = {
  background: 'var(--surface-base)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
  boxShadow: 'var(--shadow-sm)',
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-xs)',
  fontWeight: 600,
  color: 'var(--n-700)',
  marginBottom: 'var(--space-1)',
}

const valueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: 'var(--n-900)',
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

const alertStyle: React.CSSProperties = {
  background: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)',
  marginBottom: 'var(--space-4)',
  fontFamily: 'var(--font-sans)',
  fontSize: 'var(--text-sm)',
  color: '#DC2626',
}
