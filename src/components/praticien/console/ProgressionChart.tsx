
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getScores } from '../../../lib/supabase'
import type { ScoreRecord, DomaineCode } from '../../../types'

const COLORS = ['#1D9E75','#534AB7','#D85A30','#BA7517','#2C7BB6','#6B4C9A']
const NIV_LABEL = ['','N1','N2','N3','N4']

interface Props { apprenantId: string }

export default function ProgressionChart({ apprenantId }: Props) {
  const [scores, setScores]   = useState<ScoreRecord[]>([])
  const [selected, setSelected] = useState<DomaineCode[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getScores(apprenantId).then(s => {
      setScores(s)
      // Auto-sélectionner les 3 domaines les plus récents
      const domains = [...new Set(s.map(x => x.domaine_id))]
      setSelected(domains.slice(0, 3))
    }).finally(() => setLoading(false))
  }, [apprenantId])

  if (loading) return <div style={{ height:200, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gray-400)', fontSize:13 }}>Chargement…</div>
  if (scores.length === 0) return <div style={{ height:100, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gray-400)', fontSize:13 }}>Aucune donnée de progression</div>

  // Construire les données pour recharts
  const allDomains = [...new Set(scores.map(s => s.domaine_id))]
  
  // Regrouper par date
  const byDate: Record<string, Record<string,number>> = {}
  for (const s of scores) {
    const date = s.date_passation.split('T')[0]
    if (!byDate[date]) byDate[date] = {}
    byDate[date][s.domaine_id] = s.niveau
  }
  const chartData = Object.entries(byDate)
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([date, vals]) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day:'numeric', month:'short' }),
      ...vals,
    }))

  return (
    <div>
      <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>📈 Progression dans le temps</div>
      
      {/* Sélecteur domaines */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
        {allDomains.map((dom, i) => (
          <button key={dom} onClick={() => setSelected(prev => prev.includes(dom) ? prev.filter(x=>x!==dom) : [...prev, dom])}
            style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer', border:'1px solid',
              borderColor: selected.includes(dom) ? COLORS[i%COLORS.length] : 'var(--gray-100)',
              background: selected.includes(dom) ? COLORS[i%COLORS.length]+'22' : '#fff',
              color: selected.includes(dom) ? COLORS[i%COLORS.length] : 'var(--gray-600)',
            }}>
            {dom}
          </button>
        ))}
      </div>

      {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eeeae0" />
            <XAxis dataKey="date" tick={{ fontSize:11, fill:'#5F5E5A' }} />
            <YAxis domain={[0,4]} ticks={[1,2,3,4]} tickFormatter={v => NIV_LABEL[v]} tick={{ fontSize:11, fill:'#5F5E5A' }} />
            <Tooltip formatter={(val: any) => NIV_LABEL[val as number] ?? String(val)} labelStyle={{ fontSize:12 }} contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid #eeeae0' }} />
            <Legend wrapperStyle={{ fontSize:12 }} />
            {selected.map((dom, i) => (
              <Line key={dom} type="monotone" dataKey={dom} stroke={COLORS[i%COLORS.length]} strokeWidth={2} dot={{ r:4 }} activeDot={{ r:6 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ background:'var(--gray-50)', borderRadius:8, padding:'16px', textAlign:'center', fontSize:13, color:'var(--gray-400)' }}>
          Ajoutez au moins 2 évaluations pour voir la courbe de progression.
        </div>
      )}
    </div>
  )
}
