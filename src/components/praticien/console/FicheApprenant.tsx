import { useState, useEffect, useCallback } from 'react'
import {
  getLatestNiveaux, getEvaluationsPassees, getAffectations,
  getSessions, saveEvaluationPassee, createAffectation,
  updateAffectation, deleteAffectation, saveScore,
} from '../../../lib/supabase'
import { recommander, searchContenus, getParcours } from '../../../lib/api'
import type {
  ApprenantProfile, EvaluationPassee, Affectation,
  DomaineCode, RecommandationResponse, Contenu, StatutEval, Parcours,
} from '../../../types'
import ProgressionChart from './ProgressionChart'
import { notify } from '../../../lib/toast'
import JournalClinique from './JournalClinique'
import AideBilan from './AideBilan'

const NIV_LABEL = ['','Initiation','Développement','Consolidation','Maîtrise']
const NIV_COLOR = ['','var(--amber)','var(--teal)','var(--purple)','var(--coral)']
const NIV_STARS = ['','★☆☆☆','★★☆☆','★★★☆','★★★★']
const STATUT_COLOR: Record<string,string> = { normal:'var(--teal)', limite:'var(--amber)', clinique:'var(--coral)' }
const STATUT_BG: Record<string,string>    = { normal:'var(--teal-light)', limite:'var(--amber-light)', clinique:'var(--coral-light)' }
const AFFECTATION_COLOR: Record<string,string> = { affecte:'var(--teal)', en_cours:'var(--purple)', termine:'var(--gray-400)', reporte:'var(--amber)' }

const TABS = [
  { id:'profil',      label:'Profil'         },
  { id:'evals',       label:'Évaluations'    },
  { id:'reco',        label:'Recommandations'},
  { id:'parcours',    label:'Parcours'       },
  { id:'affectations',label:'Plan de travail'},
  { id:'journal',     label:'Journal'        },
  { id:'bilan',       label:'Bilan'          },
  { id:'historique',  label:'Historique'     },
]

interface Props { apprenant: ApprenantProfile }

export default function FicheApprenant({ apprenant }: Props) {
  const [tab, setTab]               = useState('profil')
  const [niveaux, setNiveaux]       = useState<Partial<Record<DomaineCode,number>>>({})
  const [evals, setEvals]           = useState<EvaluationPassee[]>([])
  const [affectations, setAffect]   = useState<Affectation[]>([])
  const [sessions, setSessions]     = useState<any[]>([])
  const [reco, setReco]             = useState<RecommandationResponse|null>(null)
  const [recoLoading, setRecoLoading] = useState(false)
  const [evalItems, setEvalItems]   = useState<Contenu[]>([])
  const [parcours, setParcours]     = useState<Parcours[]>([])
  const [notesGenerales, setNotesG] = useState('')

  const load = useCallback(async () => {
    const [niv, ev, aff, sess, parc] = await Promise.all([
      getLatestNiveaux(apprenant.id),
      getEvaluationsPassees(apprenant.id),
      getAffectations(apprenant.id),
      getSessions(apprenant.id),
      getParcours(),
    ])
    setNiveaux(niv); setEvals(ev); setAffect(aff); setSessions(sess); setParcours(parc)
  }, [apprenant.id])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    searchContenus({ type:'evaluation', tnd: apprenant.profils_tnd[0], limit:30 })
      .then(r => setEvalItems(r.items))
  }, [apprenant])

  // Notes locales
  useEffect(() => {
    try {
      const n = localStorage.getItem(`eclat_notes_${apprenant.id}`)
      if (n) setNotesG(n)
    } catch {}
  }, [apprenant.id])
  function saveNotes(txt: string) {
    setNotesG(txt)
    try { localStorage.setItem(`eclat_notes_${apprenant.id}`, txt) } catch {}
  }

  async function genererReco() {
    setRecoLoading(true)
    const deficits = Object.entries(niveaux)
      .filter(([,n]) => n! <= 2).map(([d]) => d as DomaineCode)
    if (deficits.length === 0) { setRecoLoading(false); return }
    try {
      const r = await recommander({ profil_tnd: apprenant.profils_tnd, domaines_deficit: deficits, niveaux, age_mois: apprenant.age_mois })
      setReco(r); setTab('reco')
    } finally { setRecoLoading(false) }
  }

  async function affecter(contenu: Contenu) {
    const a = await createAffectation({
      apprenant_id: apprenant.id, contenu_id: contenu.id,
      type_contenu: contenu.tags.type, titre: contenu.titre,
      domaine_id: contenu.domaine_id || contenu.domaines_ids?.[0],
      statut: 'affecte', date_affectation: new Date().toISOString().split('T')[0], priorite: 2,
    })
    if (a) { setAffect(prev => [a, ...prev]); notify.success('Contenu affecté ✓') } else load()
  }

  async function affecterParcours(p: Parcours) {
    const a = await createAffectation({
      apprenant_id: apprenant.id, contenu_id: p.id,
      type_contenu: 'parcours', titre: p.titre,
      statut: 'affecte', date_affectation: new Date().toISOString().split('T')[0], priorite: 1,
    })
    if (a) { setAffect(prev => [a, ...prev]); notify.success('Contenu affecté ✓') } else load()
  }

  async function saveEval(evId: string, titre: string, domaine: string, score: number, percentile: number|undefined, statut: StatutEval, notes: string) {
    const saved = await saveEvaluationPassee({
      apprenant_id: apprenant.id, evaluation_id: evId,
      domaine_id: domaine as DomaineCode, titre_evaluation: titre,
      date_passation: new Date().toISOString().split('T')[0],
      score_brut: score, percentile, statut, notes,
    })
    // Mettre à jour le niveau dans scores
    const niv = statut === 'normal' ? 3 : statut === 'limite' ? 2 : 1
    await saveScore({ apprenant_id: apprenant.id, domaine_id: domaine as DomaineCode, niveau: niv, date_passation: new Date().toISOString().split('T')[0] })
    if (saved) { setEvals(prev => [saved, ...prev]); notify.success('Évaluation enregistrée ✓') } else load()
    const newNiv = await getLatestNiveaux(apprenant.id); setNiveaux(newNiv)
  }

  const deficitDomaines = Object.entries(niveaux).filter(([,n]) => n! <= 2)
  const parcoursAffecter = affectations.filter(a => a.type_contenu === 'parcours')

  return (
    <div style={{ background:'#fff', borderRadius:14, border:'1px solid #eeeae0', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,var(--teal-light),var(--purple-light))', padding:'16px 20px', borderBottom:'1px solid #eeeae0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:'var(--teal-dark)' }}>
              {apprenant.prenom}{apprenant.nom ? ` ${apprenant.nom}` : ''}
            </div>
            <div style={{ fontSize:13, color:'var(--teal)', marginTop:2 }}>
              {Math.floor(apprenant.age_mois/12)} ans · {apprenant.niveau_classe || '—'}
            </div>
            <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
              {apprenant.profils_tnd.map(t => (
                <span key={t} style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,.7)', color:'var(--teal-dark)', fontWeight:600, border:'1px solid rgba(29,158,117,.3)' }}>{t}</span>
              ))}
              {parcoursAffecter.length > 0 && (
                <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:'var(--purple-light)', color:'var(--purple)', fontWeight:600 }}>
                  🗺️ {parcoursAffecter[0].titre ?? 'Parcours en cours'}
                </span>
              )}
            </div>
          </div>
          <button onClick={genererReco} disabled={recoLoading || Object.keys(niveaux).length===0} className="btn btn-primary" style={{ whiteSpace:'nowrap' }}>
            {recoLoading ? 'Calcul…' : '🧠 Recommandations'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid #eeeae0', background:'#fafaf8', overflowX:'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'9px 14px', border:'none', background:'transparent', fontWeight: tab===t.id?600:400, color: tab===t.id?'var(--teal)':'var(--gray-600)', borderBottom: tab===t.id?'2px solid var(--teal)':'2px solid transparent', marginBottom:'-1px', cursor:'pointer', fontSize:12, whiteSpace:'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:20 }}>

        {/* ── PROFIL ── */}
        {tab==='profil' && (
          <div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Profil cognitif actuel</div>
            {Object.keys(niveaux).length === 0 && (
              <div style={{ color:'var(--gray-400)', fontSize:13, padding:20, textAlign:'center', background:'var(--gray-50)', borderRadius:8 }}>
                Aucun score — enregistrez des évaluations pour établir le profil.
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {(Object.entries(niveaux) as [DomaineCode,number][]).sort((a,b) => a[1]-b[1]).map(([dom,niv]) => (
                <div key={dom} style={{ background:'var(--gray-50)', borderRadius:8, padding:'10px 12px', border:'1px solid #eeeae0' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontWeight:500, fontSize:13 }}>{dom}</span>
                    <span style={{ fontSize:12, color:NIV_COLOR[niv], fontWeight:600 }}>{NIV_STARS[niv]}</span>
                  </div>
                  <div style={{ height:6, background:'#e5e5e0', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${(niv/4)*100}%`, background:NIV_COLOR[niv], borderRadius:3, transition:'width .5s' }} />
                  </div>
                  <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:4 }}>{NIV_LABEL[niv]}</div>
                </div>
              ))}
            </div>
            {deficitDomaines.length > 0 && (
              <div style={{ background:'var(--amber-light)', borderRadius:8, padding:'12px 14px', border:'1px solid #e8c064', marginBottom:12 }}>
                <div style={{ fontWeight:600, fontSize:13, color:'#412402', marginBottom:6 }}>⚠️ Domaines déficitaires (N1-N2)</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {deficitDomaines.map(([d]) => <span key={d} style={{ fontSize:12, padding:'3px 8px', borderRadius:6, background:'rgba(255,255,255,.6)', color:'#412402', fontWeight:500 }}>{d}</span>)}
                </div>
              </div>
            )}
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Notes générales</div>
              <textarea value={notesGenerales} onChange={e => saveNotes(e.target.value)} placeholder="Observations générales, contexte familial, aménagements scolaires en place…" rows={4} style={{ width:'100%', resize:'vertical', fontSize:13 }} />
            </div>
          </div>
        )}

        {/* ── ÉVALUATIONS ── */}
        {tab==='evals' && (
          <div>
            <PasserEvaluation evalItems={evalItems} onSave={saveEval} />
            {evals.length > 0 && (
              <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:8 }}>
                {evals.map(ev => (
                  <div key={ev.id} style={{ background:'var(--gray-50)', borderRadius:8, padding:'10px 14px', border:'1px solid #eeeae0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:500, fontSize:13 }}>{ev.titre_evaluation || ev.evaluation_id}</div>
                      <div style={{ fontSize:12, color:'var(--gray-400)', marginTop:2 }}>
                        {ev.domaine_id} · {new Date(ev.date_passation).toLocaleDateString('fr-FR')}
                        {ev.score_brut !== null && ev.score_brut !== undefined && ` · Score: ${ev.score_brut}`}
                        {ev.percentile && ` · P${ev.percentile}`}
                      </div>
                      {ev.notes && <div style={{ fontSize:12, color:'var(--gray-600)', marginTop:4, fontStyle:'italic' }}>{ev.notes}</div>}
                    </div>
                    <span style={{ fontSize:11, padding:'3px 8px', borderRadius:12, fontWeight:600, background:STATUT_BG[ev.statut], color:STATUT_COLOR[ev.statut], flexShrink:0 }}>{ev.statut}</span>
                  </div>
                ))}
              </div>
            )}
            {evals.length === 0 && <div style={{ color:'var(--gray-400)', fontSize:13, textAlign:'center', marginTop:16 }}>Aucune évaluation enregistrée</div>}
          </div>
        )}

        {/* ── RECOMMANDATIONS ── */}
        {tab==='reco' && (
          <div>
            {!reco && (
              <div style={{ textAlign:'center', padding:32, color:'var(--gray-400)' }}>
                <div style={{ fontSize:32, marginBottom:12 }}>🧠</div>
                <div style={{ fontSize:14, marginBottom:8 }}>Pas encore de recommandations</div>
                <div style={{ fontSize:13 }}>Enregistrez des évaluations puis cliquez "Recommandations"</div>
              </div>
            )}
            {reco && (
              <div>
                {reco.alertes.map((a,i) => <div key={i} style={{ background:'var(--amber-light)', border:'1px solid #e8c064', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#412402', marginBottom:10 }}>{a}</div>)}
                {reco.adaptations.length > 0 && (
                  <div style={{ background:'var(--teal-light)', borderRadius:8, padding:'12px 14px', marginBottom:16, border:'1px solid #c5e8da' }}>
                    <div style={{ fontWeight:600, fontSize:13, color:'var(--teal-dark)', marginBottom:6 }}>Adaptations systématiques</div>
                    {reco.adaptations.map((a,i) => <div key={i} style={{ fontSize:12, color:'var(--teal-dark)', borderLeft:'2px solid var(--teal)', paddingLeft:8, marginBottom:4 }}>{a}</div>)}
                  </div>
                )}
                {/* Parcours recommandés */}
                {(reco as any).parcours_recommandes?.length > 0 && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontWeight:600, fontSize:13, color:'var(--purple)', marginBottom:8 }}>🗺️ Parcours recommandé</div>
                    {(reco as any).parcours_recommandes.map((p: any) => (
                      <div key={p.id} style={{ background:'var(--purple-light)', borderRadius:8, padding:'10px 14px', marginBottom:6, border:'1px solid #c5c0f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:13, color:'var(--purple)' }}>{p.titre}</div>
                          <div style={{ fontSize:12, color:'var(--gray-600)', marginTop:2 }}>{p.raison}</div>
                        </div>
                        <button className="btn btn-sm" style={{ background:'var(--purple)', color:'#fff', border:'none', whiteSpace:'nowrap', flexShrink:0 }}
                          onClick={() => { const parc = parcours.find(x => x.id === p.id); if (parc) affecterParcours(parc) }}>
                          + Démarrer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {reco.evaluations.length > 0 && <RecoSection title="📊 Évaluations à passer" items={reco.evaluations} color="var(--purple)" onAffecter={affecter} />}
                <RecoSection title="📝 Exercices recommandés" items={reco.exercices} color="var(--teal)" onAffecter={affecter} />
                <RecoSection title="🔄 Routines" items={reco.routines} color="var(--teal)" onAffecter={affecter} />
                <RecoSection title="📋 Fiches FALC" items={reco.falc} color="var(--amber)" onAffecter={affecter} />
                <RecoSection title="🎲 Jeux" items={reco.jeux} color="var(--coral)" onAffecter={affecter} />
                {reco.prochaine_seance && (
                  <div style={{ background:'var(--gray-50)', borderRadius:8, padding:'12px 14px', marginTop:8, border:'1px solid #eeeae0' }}>
                    <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>Objectif prochaine séance</div>
                    <div style={{ fontSize:13, color:'var(--teal-dark)' }}>{reco.prochaine_seance.objectif}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── PARCOURS ── */}
        {tab==='parcours' && (
          <div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Parcours de remédiation</div>
            {parcoursAffecter.length > 0 && (
              <div style={{ background:'var(--teal-light)', borderRadius:8, padding:'12px 14px', marginBottom:16, border:'1px solid #c5e8da' }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--teal-dark)', marginBottom:4 }}>✅ Parcours en cours</div>
                {parcoursAffecter.map(a => (
                  <div key={a.id} style={{ fontSize:13, color:'var(--teal-dark)' }}>
                    {a.titre} — démarré le {new Date(a.date_affectation).toLocaleDateString('fr-FR')}
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize:13, fontWeight:500, color:'var(--gray-600)', marginBottom:10 }}>Parcours disponibles</div>
            {parcours.map(p => (
              <div key={p.id} style={{ background:'var(--gray-50)', borderRadius:10, border:'1px solid #eeeae0', padding:'14px 16px', marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14 }}>{p.titre}</div>
                    <div style={{ fontSize:12, color:'var(--gray-400)', marginTop:2 }}>
                      {p.duree_semaines} semaines · {p.phases.length} phases · {p.domaines.length} domaines
                    </div>
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={() => affecterParcours(p)} style={{ flexShrink:0 }}>
                    {parcoursAffecter.find(a => a.contenu_id === p.id) ? '✓ Démarré' : '+ Démarrer'}
                  </button>
                </div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:10 }}>
                  {p.domaines.map(d => <span key={d} style={{ fontSize:11, padding:'2px 6px', borderRadius:6, background:'var(--teal-light)', color:'var(--teal-dark)' }}>{d}</span>)}
                </div>
                {p.phases.map(ph => (
                  <div key={ph.numero} style={{ borderLeft:'2px solid var(--teal)', paddingLeft:10, marginBottom:8 }}>
                    <div style={{ fontSize:12, fontWeight:600 }}>Phase {ph.numero} — {ph.label}</div>
                    <div style={{ fontSize:11, color:'var(--gray-400)' }}>S{ph.semaines_debut}–S{ph.semaines_fin} · Critère : {ph.critere_passage}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── PLAN DE TRAVAIL ── */}
        {tab==='affectations' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:600 }}>Plan de travail</div>
              <span style={{ fontSize:12, color:'var(--gray-400)' }}>{affectations.filter(a=>a.statut!=='termine').length} actif(s)</span>
            </div>
            {affectations.length === 0 && (
              <div style={{ textAlign:'center', padding:24, color:'var(--gray-400)', fontSize:13, background:'var(--gray-50)', borderRadius:8 }}>
                Aucun contenu affecté. Générez des recommandations et cliquez "Affecter".
              </div>
            )}
            {['en_cours','affecte','reporte','termine'].map(statut => {
              const items = affectations.filter(a => a.statut === statut)
              if (items.length === 0) return null
              const labels: Record<string,string> = { affecte:'À faire', en_cours:'En cours', termine:'Terminé', reporte:'Reporté' }
              return (
                <div key={statut} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:8 }}>{labels[statut]} ({items.length})</div>
                  {items.map(a => (
                    <div key={a.id} style={{ background:'var(--gray-50)', borderRadius:8, padding:'10px 14px', border:'1px solid #eeeae0', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:500, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.titre || a.contenu_id}</div>
                        <div style={{ fontSize:12, color:'var(--gray-400)', marginTop:2 }}>
                          {a.type_contenu}{a.domaine_id ? ` · ${a.domaine_id}` : ''} · {new Date(a.date_affectation).toLocaleDateString('fr-FR')}
                        </div>
                        {a.notes && <div style={{ fontSize:11, color:'var(--gray-600)', marginTop:4, fontStyle:'italic' }}>{a.notes}</div>}
                      </div>
                      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                        {statut === 'affecte' && <button className="btn btn-sm" style={{ background:'var(--purple-light)', color:'var(--purple)', border:'none' }} onClick={() => updateAffectation(a.id,'en_cours').then(load)}>▶ Démarrer</button>}
                        {statut === 'en_cours' && <button className="btn btn-sm" style={{ background:'var(--teal-light)', color:'var(--teal-dark)', border:'none' }} onClick={() => updateAffectation(a.id,'termine').then(load)}>✓ Terminer</button>}
                        {statut !== 'termine' && <button className="btn btn-sm" style={{ background:'var(--amber-light)', color:'var(--amber)', border:'none' }} onClick={() => updateAffectation(a.id,'reporte').then(load)}>⏸ Reporter</button>}
                        <button className="btn btn-sm" style={{ color:'var(--coral)', border:'none', background:'transparent' }} onClick={() => deleteAffectation(a.id).then(load)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        {/* ── JOURNAL ── */}
        {tab==='journal' && <JournalClinique apprenant={apprenant} />}

        {/* ── BILAN ── */}
        {tab==='bilan' && (
          <AideBilan
            apprenant={apprenant}
            niveaux={niveaux}
            evaluations={evals}
            affectations={affectations}
            notes={notesGenerales}
          />
        )}

        {/* ── HISTORIQUE ── */}
        {tab==='historique' && (
          <div>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:12 }}>Historique des séances</div>
            {sessions.length === 0 && <div style={{ textAlign:'center', color:'var(--gray-400)', fontSize:13, padding:24, background:'var(--gray-50)', borderRadius:8 }}>Aucune séance enregistrée.</div>}
            {sessions.map((s: any) => (
              <div key={s.id} style={{ background:'var(--gray-50)', borderRadius:8, padding:'10px 14px', border:'1px solid #eeeae0', marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontWeight:500, fontSize:13 }}>{new Date(s.date_session).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</span>
                  {s.duree_min && <span style={{ fontSize:12, color:'var(--gray-400)' }}>{s.duree_min} min</span>}
                </div>
                {s.domaines_traites?.length > 0 && <div style={{ display:'flex', gap:4, marginTop:6, flexWrap:'wrap' }}>{s.domaines_traites.map((d: string) => <span key={d} style={{ fontSize:11, padding:'2px 6px', borderRadius:6, background:'var(--teal-light)', color:'var(--teal-dark)' }}>{d}</span>)}</div>}
                {s.notes && <div style={{ fontSize:12, color:'var(--gray-600)', marginTop:6 }}>{s.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RecoSection({ title, items, color, onAffecter }: { title:string; items:Contenu[]; color:string; onAffecter:(c:Contenu)=>void }) {
  if (items.length === 0) return null
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontWeight:600, fontSize:13, color, marginBottom:8 }}>{title} ({items.length})</div>
      {items.map(c => (
        <div key={c.id} style={{ background:'var(--gray-50)', borderRadius:8, padding:'10px 14px', border:'1px solid #eeeae0', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center', gap:10 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontWeight:500, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.titre}</div>
            <div style={{ fontSize:12, color:'var(--gray-400)', marginTop:2 }}>{c.domaine_id||c.domaines_ids?.[0]} · {c.duree_min??c.tags.duree_min} min</div>
          </div>
          <button className="btn btn-sm btn-primary" style={{ whiteSpace:'nowrap', flexShrink:0 }} onClick={() => onAffecter(c)}>+ Affecter</button>
        </div>
      ))}
    </div>
  )
}

function PasserEvaluation({ evalItems, onSave }: { evalItems:Contenu[]; onSave:(evId:string,titre:string,domaine:string,score:number,percentile:number|undefined,statut:StatutEval,notes:string)=>void }) {
  const [open, setOpen]         = useState(false)
  const [selected, setSelected] = useState<Contenu|null>(null)
  const [score, setScore]       = useState('')
  const [percentile, setPerc]   = useState('')
  const [statut, setStatut]     = useState<StatutEval>('normal')
  const [notes, setNotes]       = useState('')

  function submit() {
    if (!selected) return
    onSave(selected.id, selected.titre, selected.domaine_id||selected.domaines_ids?.[0]||'', parseFloat(score)||0, percentile ? parseInt(percentile) : undefined, statut, notes)
    setOpen(false); setSelected(null); setScore(''); setPerc(''); setStatut('normal'); setNotes('')
  }

  return (
    <div style={{ marginBottom:12 }}>
      <button className="btn btn-primary" onClick={() => setOpen(o => !o)}>
        {open ? '✕ Annuler' : '+ Enregistrer une évaluation'}
      </button>
      {open && (
        <div style={{ background:'var(--purple-light)', borderRadius:10, padding:14, marginTop:10, border:'1px solid #c5c0f0' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div>
              <label style={ls}>Évaluation</label>
              <select value={selected?.id||''} onChange={e => setSelected(evalItems.find(x => x.id===e.target.value)||null)}>
                <option value="">— Choisir —</option>
                {evalItems.map(ev => <option key={ev.id} value={ev.id}>{ev.titre} ({ev.domaine_id||ev.domaines_ids?.[0]})</option>)}
              </select>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              <div><label style={ls}>Score brut</label><input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder="Ex: 72" /></div>
              <div><label style={ls}>Percentile</label><input type="number" value={percentile} onChange={e => setPerc(e.target.value)} placeholder="Ex: 25" min={1} max={99} /></div>
              <div><label style={ls}>Statut clinique</label>
                <select value={statut} onChange={e => setStatut(e.target.value as StatutEval)}>
                  <option value="normal">Normal</option>
                  <option value="limite">Limite</option>
                  <option value="clinique">Clinique</option>
                </select>
              </div>
            </div>
            <div><label style={ls}>Notes (observations)</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Comportement pendant l'épreuve, facteurs influençant le résultat…" /></div>
            <button className="btn btn-primary" onClick={submit} disabled={!selected}>Enregistrer</button>
          </div>
        </div>
      )}
    </div>
  )
}
const ls: React.CSSProperties = { fontSize:12, fontWeight:500, color:'var(--gray-600)', display:'block', marginBottom:4 }
