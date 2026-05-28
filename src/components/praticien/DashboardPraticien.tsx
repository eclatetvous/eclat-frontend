import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { getStats } from '../../lib/api'
import SearchPanel from './SearchPanel'
import RecoPanel from './RecoPanel'
import ParcoursPanel from './ParcoursPanel'
import ConsolePanel from './console/ConsolePanel'
import AgendaPanel from './AgendaPanel'
import type { PraticienUser } from '../../lib/auth'

const TABS = [
  { id:'apprenants', label:'👤 Apprenants' },
  { id:'agenda',     label:'🗓️ Agenda'     },
  { id:'search',     label:'🔍 Recherche'  },
  { id:'reco',       label:'🧠 Recommandations' },
  { id:'parcours',   label:'🗺️ Parcours'   },
]

interface Props { user: PraticienUser | null }

export default function DashboardPraticien({ user }: Props) {
  const [tab, setTab] = useState('apprenants')
  const { data: stats } = useApi(getStats)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
          <div>
            <h1 style={{ fontSize:18, fontWeight:600, marginBottom:2 }}>
              Bonjour {user?.nom?.split(' ')[0] ?? user?.email?.split('@')[0] ?? ''} 👋
            </h1>
            <p style={{ fontSize:13, color:'var(--gray-400)' }}>Console de suivi orthopédagogique — Éclat & Vous</p>
          </div>
          <div style={{ fontSize:12, padding:'4px 10px', borderRadius:20, background: stats?'var(--teal-light)':'var(--amber-light)', color: stats?'var(--teal-dark)':'var(--amber)', fontWeight:500 }}>
            {stats ? `✓ API · ${stats.index?.total ?? stats.total} contenus` : 'Connexion API…'}
          </div>
        </div>

        {/* Métriques */}
        {stats && (
          <div className="metrics-grid" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:16 }}>
            {[
              { label:'Exercices',   val:stats.exercices,  color:'var(--teal)'   },
              { label:'Évaluations', val:stats.evaluations,color:'var(--purple)' },
              { label:'Jeux',        val:stats.jeux,       color:'var(--coral)'  },
              { label:'FALC',        val:stats.falc,       color:'var(--amber)'  },
              { label:'Total',       val:stats.index?.total ?? stats.total, color:'var(--gray-600)' },
            ].map(m => (
              <div key={m.label} style={{ background:'#fff', borderRadius:10, padding:'12px 14px', border:'1px solid #eeeae0' }}>
                <div style={{ fontSize:11, color:'var(--gray-400)', textTransform:'uppercase', letterSpacing:'.04em' }}>{m.label}</div>
                <div style={{ fontSize:20, fontWeight:600, color:m.color, marginTop:4 }}>{m.val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs-row" style={{ display:'flex', borderBottom:'1px solid #eeeae0', overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              aria-current={tab===t.id ? 'page' : undefined}
              style={{ padding:'9px 16px', border:'none', background:'transparent', fontWeight:tab===t.id?600:400, color:tab===t.id?'var(--teal)':'var(--gray-600)', borderBottom:tab===t.id?'2px solid var(--teal)':'2px solid transparent', marginBottom:'-1px', cursor:'pointer', fontSize:13, whiteSpace:'nowrap', transition:'all .15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      {tab === 'apprenants' && <ConsolePanel />}
      {tab === 'agenda'     && <AgendaPanel />}
      {tab === 'search'     && <SearchPanel />}
      {tab === 'reco'       && <RecoPanel />}
      {tab === 'parcours'   && <ParcoursPanel />}
    </div>
  )
}
