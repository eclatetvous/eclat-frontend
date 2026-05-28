
import { useEffect, useState } from 'react'
import type { ApprenantProfile } from '../../types'
import { getApprenant, getLatestNiveaux, getAffectations } from '../../lib/supabase'

const NIV_LABEL = ['','Initiation','Développement','Consolidation','Maîtrise']
const NIV_COLOR = ['','var(--amber)','var(--teal)','var(--purple)','var(--coral)']
const NIV_STARS = ['','★☆☆☆','★★☆☆','★★★☆','★★★★']

// L'URL contient ?token=APPRENANT_ID pour le mode parent
export default function EspaceParents() {
  const params = new URLSearchParams(window.location.search)
  const token  = params.get('token') ?? '00000000-0000-0000-0000-000000000001'

  const [apprenant, setApp]     = useState<ApprenantProfile|null>(null)
  const [niveaux, setNiv]       = useState<Record<string,number>>({})
  const [affectations, setAff]  = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getApprenant(token), getLatestNiveaux(token), getAffectations(token)]).then(([app, niv, aff]) => {
      setApp(app); setNiv(niv as any); setAff(aff)
    }).finally(() => setLoading(false))
  }, [token])

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'var(--gray-400)' }}>Chargement…</div>
  if (!apprenant) return <div style={{ padding:40, textAlign:'center', color:'var(--coral)' }}>Lien invalide ou expiré.</div>

  const age = Math.floor(apprenant.age_mois / 12)
  const enCours = affectations.filter(a => a.statut === 'en_cours' || a.statut === 'affecte').slice(0, 4)
  const termines = affectations.filter(a => a.statut === 'termine').length

  return (
    <div style={{ maxWidth:600, margin:'0 auto', padding:'24px 16px', fontFamily:'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontSize:22, fontWeight:700, color:'var(--teal-dark)' }}>✦ Éclat & Vous</div>
        <div style={{ fontSize:13, color:'var(--gray-600)', marginTop:4 }}>Espace familles — lecture seule</div>
      </div>

      {/* Profil */}
      <div style={{ background:'linear-gradient(135deg,var(--teal-light),var(--purple-light))', borderRadius:14, padding:'18px 20px', marginBottom:16, border:'1px solid #c5e8da' }}>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--teal-dark)' }}>{apprenant.prenom}{apprenant.nom ? ' '+apprenant.nom : ''}</div>
        <div style={{ fontSize:13, color:'var(--teal)', marginTop:2 }}>{age} ans · {apprenant.niveau_classe ?? '—'}</div>
        <div style={{ display:'flex', gap:6, marginTop:8 }}>
          {apprenant.profils_tnd.map(t => <span key={t} style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:'rgba(255,255,255,.7)', color:'var(--teal-dark)', fontWeight:600 }}>{t}</span>)}
        </div>
      </div>

      {/* Résumé */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        <div style={{ background:'#fff', borderRadius:10, border:'1px solid #eeeae0', padding:'14px 16px', textAlign:'center' }}>
          <div style={{ fontSize:26, fontWeight:700, color:'var(--teal)' }}>{Object.keys(niveaux).length}</div>
          <div style={{ fontSize:12, color:'var(--gray-600)', marginTop:2 }}>domaine(s) suivi(s)</div>
        </div>
        <div style={{ background:'#fff', borderRadius:10, border:'1px solid #eeeae0', padding:'14px 16px', textAlign:'center' }}>
          <div style={{ fontSize:26, fontWeight:700, color:'var(--purple)' }}>{termines}</div>
          <div style={{ fontSize:12, color:'var(--gray-600)', marginTop:2 }}>activité(s) terminée(s)</div>
        </div>
      </div>

      {/* Progression */}
      {Object.keys(niveaux).length > 0 && (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #eeeae0', padding:'14px 16px', marginBottom:14 }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>📊 Progression par domaine</div>
          {(Object.entries(niveaux) as [string,number][]).map(([dom, niv]) => (
            <div key={dom} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4, fontSize:13 }}>
                <span style={{ fontWeight:500 }}>{dom}</span>
                <span style={{ color:NIV_COLOR[niv], fontWeight:600 }}>{NIV_STARS[niv]} {NIV_LABEL[niv]}</span>
              </div>
              <div style={{ height:8, background:'#e5e5e0', borderRadius:4, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(niv/4)*100}%`, background:NIV_COLOR[niv], borderRadius:4, transition:'width .5s' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activités en cours */}
      {enCours.length > 0 && (
        <div style={{ background:'#fff', borderRadius:12, border:'1px solid #eeeae0', padding:'14px 16px', marginBottom:14 }}>
          <div style={{ fontWeight:600, fontSize:14, marginBottom:10 }}>📝 Activités en cours</div>
          {enCours.map(a => (
            <div key={a.id} style={{ display:'flex', gap:10, marginBottom:8, alignItems:'center' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:a.statut==='en_cours'?'var(--purple)':'var(--teal)', flexShrink:0 }} />
              <div style={{ fontSize:13 }}>{a.titre ?? a.contenu_id}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize:11, color:'var(--gray-400)', textAlign:'center', lineHeight:1.6, marginTop:20 }}>
        Ce lien est partagé par le praticien de {apprenant.prenom}.<br/>
        Accès en lecture seule · Éclat & Vous
      </div>
    </div>
  )
}
