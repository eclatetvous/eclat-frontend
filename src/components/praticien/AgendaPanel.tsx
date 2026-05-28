
import { useState, useEffect } from 'react'
import { notify } from '../../lib/toast'
import type { ApprenantProfile } from '../../types'
import { getAllApprenants } from '../../lib/supabase'

interface Seance {
  id: string
  date: string
  heure: string
  duree: number
  apprenant_id: string
  apprenant_nom: string
  objectif: string
  statut: 'planifiee' | 'realisee' | 'annulee'
}

const STORAGE_KEY = 'eclat_agenda'
const JOURS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
const MOIS  = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

function loadSeances(): Seance[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
}
function saveSeances(s: Seance[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
}

export default function AgendaPanel() {
  const today = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [seances, setSeances]     = useState<Seance[]>(loadSeances())
  const [apprenants, setApp]      = useState<ApprenantProfile[]>([])
  const [selectedDay, setSelDay]  = useState<string|null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm] = useState({ apprenant_id:'', heure:'09:00', duree:60, objectif:'' })

  useEffect(() => { getAllApprenants().then(setApp) }, [])

  const firstDay  = new Date(year, month, 1).getDay()
  const daysCount = new Date(year, month + 1, 0).getDate()
  const cells: (number|null)[] = Array(firstDay).fill(null).concat(Array.from({length:daysCount},(_,i)=>i+1))
  while (cells.length % 7 !== 0) cells.push(null)

  function seancesOnDay(d: number) {
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return seances.filter(s => s.date === key)
  }

  function addSeance() {
    if (!form.apprenant_id || !selectedDay) return
    const app = apprenants.find(a => a.id === form.apprenant_id)
    const s: Seance = {
      id: Date.now().toString(), date: selectedDay, heure: form.heure,
      duree: form.duree, apprenant_id: form.apprenant_id,
      apprenant_nom: app ? `${app.prenom}${app.nom ? ' '+app.nom : ''}` : '?',
      objectif: form.objectif, statut: 'planifiee',
    }
    const updated = [...seances, s]
    saveSeances(updated); setSeances(updated)
    setShowForm(false)
    notify.success(`Séance planifiée — ${s.apprenant_nom} le ${s.date} à ${s.heure}`)
  }

  function toggleStatut(id: string, statut: Seance['statut']) {
    const updated = seances.map(s => s.id === id ? {...s, statut} : s)
    saveSeances(updated); setSeances(updated)
  }

  function deleteSeance(id: string) {
    const updated = seances.filter(s => s.id !== id)
    saveSeances(updated); setSeances(updated)
  }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y=>y-1) } else setMonth(m=>m-1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y=>y+1) } else setMonth(m=>m+1) }

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  const daySeances = selectedDay ? seances.filter(s => s.date === selectedDay).sort((a,b) => a.heure.localeCompare(b.heure)) : []

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, alignItems:'flex-start' }}>
      {/* Calendrier */}
      <div style={{ background:'#fff', borderRadius:14, border:'1px solid #eeeae0', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', borderBottom:'1px solid #eeeae0' }}>
          <button className="btn btn-sm" onClick={prevMonth}>←</button>
          <span style={{ fontWeight:600, fontSize:15 }}>{MOIS[month]} {year}</span>
          <button className="btn btn-sm" onClick={nextMonth}>→</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:'var(--gray-50)', borderBottom:'1px solid #eeeae0' }}>
          {JOURS.map(j => <div key={j} style={{ padding:'8px 0', textAlign:'center', fontSize:11, fontWeight:600, color:'var(--gray-400)', textTransform:'uppercase' }}>{j}</div>)}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:0 }}>
          {cells.map((d, i) => {
            if (!d) return <div key={i} style={{ minHeight:80, background:'var(--gray-50)', border:'1px solid #f5f5f0' }} />
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDay
            const dayS = seancesOnDay(d)
            return (
              <div key={i} onClick={() => setSelDay(dateStr)} style={{
                minHeight:80, padding:'6px 8px', border:'1px solid #f5f5f0',
                cursor:'pointer', background: isSelected ? 'var(--teal-light)' : '#fff',
                transition:'background .1s',
              }}>
                <div style={{ fontSize:12, fontWeight: isToday?700:400, color: isToday?'var(--teal)':'var(--gray-900)', marginBottom:4 }}>
                  {d}
                </div>
                {dayS.map(s => (
                  <div key={s.id} style={{ fontSize:10, padding:'2px 4px', borderRadius:4, marginBottom:2, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                    background: s.statut==='realisee'?'var(--teal-light)':s.statut==='annulee'?'var(--gray-50)':'var(--purple-light)',
                    color: s.statut==='realisee'?'var(--teal-dark)':s.statut==='annulee'?'var(--gray-400)':'var(--purple)',
                  }}>
                    {s.heure} {s.apprenant_nom.split(' ')[0]}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Panneau latéral */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {selectedDay && (
          <div style={{ background:'#fff', borderRadius:14, border:'1px solid #eeeae0', overflow:'hidden' }}>
            <div style={{ padding:'12px 14px', borderBottom:'1px solid #eeeae0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:600, fontSize:13 }}>
                {new Date(selectedDay+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
              </span>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s=>!s)}>
                {showForm ? '✕' : '+ Séance'}
              </button>
            </div>

            {showForm && (
              <div style={{ padding:12, background:'var(--teal-light)', borderBottom:'1px solid #eeeae0' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <select value={form.apprenant_id} onChange={e => setForm(f=>({...f,apprenant_id:e.target.value}))}>
                    <option value="">— Apprenant —</option>
                    {apprenants.map(a => <option key={a.id} value={a.id}>{a.prenom}{a.nom?' '+a.nom:''}</option>)}
                  </select>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <input type="time" value={form.heure} onChange={e => setForm(f=>({...f,heure:e.target.value}))} />
                    <select value={form.duree} onChange={e => setForm(f=>({...f,duree:parseInt(e.target.value)}))}>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>1 h</option>
                      <option value={90}>1h30</option>
                    </select>
                  </div>
                  <input placeholder="Objectif de la séance" value={form.objectif} onChange={e => setForm(f=>({...f,objectif:e.target.value}))} />
                  <button className="btn btn-primary" onClick={addSeance} disabled={!form.apprenant_id}>Planifier</button>
                </div>
              </div>
            )}

            <div style={{ padding:12, display:'flex', flexDirection:'column', gap:8 }}>
              {daySeances.length === 0 && <div style={{ color:'var(--gray-400)', fontSize:13, textAlign:'center', padding:16 }}>Aucune séance ce jour</div>}
              {daySeances.map(s => (
                <div key={s.id} style={{ background:'var(--gray-50)', borderRadius:8, padding:'10px 12px', border:'1px solid #eeeae0' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontWeight:600, fontSize:13 }}>{s.heure} · {s.apprenant_nom}</span>
                    <button onClick={() => deleteSeance(s.id)} style={{ background:'none', border:'none', color:'var(--gray-400)', cursor:'pointer', fontSize:14 }}>✕</button>
                  </div>
                  <div style={{ fontSize:12, color:'var(--gray-600)', marginBottom:6 }}>{s.duree} min{s.objectif ? ` · ${s.objectif}` : ''}</div>
                  <div style={{ display:'flex', gap:4 }}>
                    {['planifiee','realisee','annulee'].map(st => (
                      <button key={st} onClick={() => toggleStatut(s.id, st as any)} className="btn btn-sm"
                        style={{ fontSize:10, padding:'2px 6px', background: s.statut===st?'var(--teal)':'#fff', color: s.statut===st?'#fff':'var(--gray-600)', border:'1px solid', borderColor: s.statut===st?'var(--teal)':'var(--gray-100)' }}>
                        {st==='planifiee'?'Planifiée':st==='realisee'?'Réalisée':'Annulée'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Séances à venir */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #eeeae0', padding:14 }}>
          <div style={{ fontWeight:600, fontSize:13, marginBottom:10 }}>Prochaines séances</div>
          {seances.filter(s => s.date >= todayStr && s.statut === 'planifiee').sort((a,b) => a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure)).slice(0,5).map(s => (
            <div key={s.id} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'center' }}>
              <div style={{ width:40, textAlign:'center', fontSize:11, color:'var(--teal-dark)', fontWeight:600, flexShrink:0 }}>
                {new Date(s.date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.apprenant_nom}</div>
                <div style={{ fontSize:11, color:'var(--gray-400)' }}>{s.heure} · {s.duree} min</div>
              </div>
            </div>
          ))}
          {seances.filter(s => s.date >= todayStr && s.statut === 'planifiee').length === 0 && (
            <div style={{ color:'var(--gray-400)', fontSize:13, textAlign:'center' }}>Aucune séance planifiée</div>
          )}
        </div>
      </div>
    </div>
  )
}
