
import { useState } from 'react'
import { supabase, isOffline } from '../../lib/supabase'
import { signOut } from '../../lib/auth'

interface Props { praticienId: string; onBack: () => void }

export default function RgpdPage({ praticienId, onBack }: Props) {
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [confirm, setConfirm]     = useState('')
  const [done, setDone]           = useState('')

  async function exportDonnees() {
    setExporting(true)
    try {
      if (isOffline) {
        const data = { apprenants: [], sessions: [], evaluations: [], scores: [], affectations: [], exported_at: new Date().toISOString(), note: 'Mode démo — données fictives' }
        download(JSON.stringify(data, null, 2), 'eclat_mes_donnees.json', 'application/json')
        setDone('Export téléchargé.')
        return
      }
      const [a, s, ev, sc, af] = await Promise.all([
        supabase!.from('apprenants').select('*').eq('praticien_id', praticienId),
        supabase!.from('sessions').select('*'),
        supabase!.from('evaluations_passees').select('*'),
        supabase!.from('scores').select('*'),
        supabase!.from('affectations').select('*'),
      ])
      const data = {
        apprenants: a.data ?? [], sessions: s.data ?? [],
        evaluations: ev.data ?? [], scores: sc.data ?? [],
        affectations: af.data ?? [], exported_at: new Date().toISOString()
      }
      download(JSON.stringify(data, null, 2), 'eclat_mes_donnees.json', 'application/json')
      setDone('Vos données ont été téléchargées.')
    } finally { setExporting(false) }
  }

  async function supprimerCompte() {
    if (confirm !== 'SUPPRIMER') return
    setDeleting(true)
    try {
      if (!isOffline && supabase) {
        // Supprimer toutes les données liées
        const { data: apprenants } = await supabase.from('apprenants').select('id').eq('praticien_id', praticienId)
        const ids = (apprenants ?? []).map((a: any) => a.id)
        if (ids.length > 0) {
          await Promise.all([
            supabase.from('sessions').delete().in('apprenant_id', ids),
            supabase.from('evaluations_passees').delete().in('apprenant_id', ids),
            supabase.from('scores').delete().in('apprenant_id', ids),
            supabase.from('affectations').delete().in('apprenant_id', ids),
          ])
          await supabase.from('apprenants').delete().in('id', ids)
        }
      }
      await signOut()
    } finally { setDeleting(false) }
  }

  return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'24px 20px' }}>
      <button onClick={onBack} style={{ background:'none', border:'none', color:'var(--teal)', cursor:'pointer', fontSize:13, marginBottom:20 }}>← Retour</button>
      <h2 style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Confidentialité & RGPD</h2>
      <p style={{ fontSize:13, color:'var(--gray-600)', marginBottom:24, lineHeight:1.6 }}>
        Éclat & Vous respecte le Règlement Général sur la Protection des Données (RGPD). Vos données et celles de vos apprenants restent sous votre contrôle à tout moment.
      </p>

      {/* Mentions légales */}
      <Section title="📋 Mentions légales">
        <p style={p}>Les données sont hébergées sur Supabase (infrastructure EU). Elles ne sont jamais vendues ni partagées avec des tiers. La durée de conservation est illimitée tant que le compte est actif.</p>
        <p style={p}>Données collectées : profil praticien (email, nom), dossiers apprenants (prénom, âge, profil TND, évaluations, sessions). Aucune donnée biométrique ni de santé au sens strict n'est collectée.</p>
        <p style={p}>Pour toute question : <strong>rgpd@eclat-vous.fr</strong></p>
      </Section>

      {/* Export */}
      <Section title="📥 Exporter mes données">
        <p style={p}>Télécharger l'intégralité de vos données au format JSON (dossiers apprenants, évaluations, sessions, affectations).</p>
        {done && <div style={{ background:'var(--teal-light)', borderRadius:6, padding:'8px 12px', fontSize:13, color:'var(--teal-dark)', marginBottom:10 }}>{done}</div>}
        <button className="btn btn-primary" onClick={exportDonnees} disabled={exporting}>{exporting ? 'Export en cours…' : '⬇ Télécharger mes données'}</button>
      </Section>

      {/* Suppression */}
      <Section title="🗑️ Supprimer mon compte" danger>
        <p style={{ ...p, color:'var(--coral)' }}>Cette action est irréversible. Tous vos apprenants et leurs données seront définitivement supprimés.</p>
        <div style={{ marginBottom:10 }}>
          <label style={{ fontSize:12, fontWeight:500, display:'block', marginBottom:4 }}>Tapez SUPPRIMER pour confirmer</label>
          <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="SUPPRIMER" style={{ borderColor: confirm === 'SUPPRIMER' ? 'var(--coral)' : undefined }} />
        </div>
        <button className="btn" style={{ background:'var(--coral)', color:'#fff', border:'none' }} disabled={confirm !== 'SUPPRIMER' || deleting} onClick={supprimerCompte}>
          {deleting ? 'Suppression…' : 'Supprimer définitivement mon compte'}
        </button>
      </Section>
    </div>
  )
}

function Section({ title, children, danger }: { title:string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div style={{ background:'#fff', borderRadius:12, border:`1px solid ${danger?'rgba(216,90,48,.3)':'#eeeae0'}`, padding:'16px 18px', marginBottom:16 }}>
      <div style={{ fontWeight:600, fontSize:14, marginBottom:10, color: danger?'var(--coral)':'var(--gray-900)' }}>{title}</div>
      {children}
    </div>
  )
}

function download(content: string, filename: string, mime: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([content], { type: mime }))
  a.download = filename; a.click()
}

const p: React.CSSProperties = { fontSize:13, color:'var(--gray-600)', lineHeight:1.6, marginBottom:8 }
