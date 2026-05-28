
import { useState, useEffect } from 'react'
import { getAllApprenants, createApprenant, isOffline } from '../../../lib/supabase'
import type { ApprenantProfile, TagTND } from '../../../types'

const TND_COLORS: Record<string, string> = {
  TDAH:'var(--teal)', TSA:'var(--purple)', DYS_LEX:'var(--coral)',
  DYS_CALC:'var(--teal)', DYP:'var(--amber)', HPI:'var(--gray-600)'
}
const TND_BG: Record<string, string> = {
  TDAH:'var(--teal-light)', TSA:'var(--purple-light)', DYS_LEX:'var(--coral-light)',
  DYS_CALC:'var(--teal-light)', DYP:'var(--amber-light)', HPI:'var(--gray-50)'
}
const PROFILS: TagTND[] = ['TDAH','TSA','DYS_LEX','DYS_CALC','DYP','HPI','ANXIETE','TDC']
const CLASSES = ['Petite section','Moyenne section','Grande section','CP','CE1','CE2','CM1','CM2','6e','5e','4e','3e','2nde','1re','Terminale','Adulte']

interface Props { onSelect: (a: ApprenantProfile) => void; selected: string | null }

export default function ListeApprenants({ onSelect, selected }: Props) {
  const [list, setList] = useState<ApprenantProfile[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ prenom:'', nom:'', age_mois:'108', profils_tnd:[] as TagTND[], niveau_classe:'CM1' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { getAllApprenants().then(setList) }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.prenom || form.profils_tnd.length === 0) return
    setSaving(true)
    const result = await createApprenant({
      prenom: form.prenom, nom: form.nom || undefined,
      age_mois: parseInt(form.age_mois),
      profils_tnd: form.profils_tnd,
      niveau_classe: form.niveau_classe,
      actif: true,
    })
    if (result) setList(prev => [...prev, result])
    setShowForm(false)
    setForm({ prenom:'', nom:'', age_mois:'108', profils_tnd:[], niveau_classe:'CM1' })
    setSaving(false)
    if (!result) { const updated = await getAllApprenants(); setList(updated) }
  }

  const toggleProfil = (p: TagTND) =>
    setForm(f => ({ ...f, profils_tnd: f.profils_tnd.includes(p) ? f.profils_tnd.filter(x=>x!==p) : [...f.profils_tnd, p] }))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
        <span style={{ fontSize:13, fontWeight:500, color:'var(--gray-600)' }}>
          {list.length} apprenant{list.length>1?'s':''}
          {isOffline && <span style={{ marginLeft:8, fontSize:11, color:'var(--amber)', background:'var(--amber-light)', padding:'2px 6px', borderRadius:4 }}>démo</span>}
        </span>
        <button onClick={() => setShowForm(s=>!s)} className="btn btn-primary btn-sm">
          {showForm ? '✕ Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background:'var(--teal-light)', borderRadius:10, padding:14, border:'1px solid #c5e8da', display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={labelStyle}>Prénom *</label>
              <input value={form.prenom} onChange={e => setForm(f=>({...f,prenom:e.target.value}))} placeholder="Léa" required />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={labelStyle}>Nom</label>
              <input value={form.nom} onChange={e => setForm(f=>({...f,nom:e.target.value}))} placeholder="Martin" />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={labelStyle}>Âge (mois)</label>
              <input type="number" value={form.age_mois} onChange={e => setForm(f=>({...f,age_mois:e.target.value}))} min={36} max={999} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <label style={labelStyle}>Classe</label>
              <select value={form.niveau_classe} onChange={e => setForm(f=>({...f,niveau_classe:e.target.value}))}>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Profil(s) TND *</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
              {PROFILS.map(p => (
                <button key={p} type="button" onClick={() => toggleProfil(p)}
                  style={{ padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', border:'1px solid', borderColor: form.profils_tnd.includes(p) ? TND_COLORS[p]||'var(--teal)' : 'var(--gray-100)', background: form.profils_tnd.includes(p) ? TND_BG[p]||'var(--teal-light)' : '#fff', color: form.profils_tnd.includes(p) ? TND_COLORS[p]||'var(--teal-dark)' : 'var(--gray-600)' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={saving || !form.prenom || form.profils_tnd.length===0} className="btn btn-primary" style={{ alignSelf:'flex-start' }}>
            {saving ? 'Enregistrement…' : "Créer l'apprenant"}
          </button>
        </form>
      )}

      {list.map(a => (
        <div key={a.id} onClick={() => onSelect(a)}
          style={{ background:'#fff', border:`1.5px solid ${selected===a.id?'var(--teal)':'#eeeae0'}`, borderRadius:10, padding:'12px 14px', cursor:'pointer', transition:'all .15s', boxShadow: selected===a.id?'0 0 0 3px var(--teal-light)':'0 1px 2px rgba(0,0,0,.05)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontWeight:600, fontSize:14 }}>{a.prenom}{a.nom ? ` ${a.nom}` : ''}</div>
              <div style={{ fontSize:12, color:'var(--gray-400)', marginTop:2 }}>
                {Math.floor(a.age_mois/12)} ans{a.niveau_classe ? ` · ${a.niveau_classe}` : ''}
              </div>
            </div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'flex-end' }}>
              {a.profils_tnd.slice(0,2).map(t => (
                <span key={t} style={{ fontSize:11, padding:'2px 7px', borderRadius:12, fontWeight:500, background:TND_BG[t]||'var(--gray-50)', color:TND_COLORS[t]||'var(--gray-600)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      ))}

      {list.length === 0 && !showForm && (
        <div style={{ textAlign:'center', padding:24, color:'var(--gray-400)', fontSize:13 }}>
          Aucun apprenant — cliquer "+" pour en créer un
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = { fontSize:12, fontWeight:500, color:'var(--gray-600)' }
