import { useState } from 'react'
import { recommander } from '../../lib/api'
import ContentCard from '../shared/ContentCard'
import type { RecommandationResponse, TagTND, DomaineCode } from '../../types'

const PROFILS: TagTND[] = ['TDAH','TSA','DYS_LEX','DYS_CALC','HPI','ANXIETE']
const DOMAINES: DomaineCode[] = ['ATT','INH','MDT','FLX','PLN','ORG','LEC','ECR','MAT','EMO','CSOC','SEN']
const NIVEAUX = ['1','2','3']
const AGES = [{ label:'5 ans',val:60},{label:'7 ans',val:84},{label:'9 ans',val:108},{label:'11 ans',val:132},{label:'14 ans',val:168}]

export default function RecoPanel() {
  const [profil, setProfil] = useState<TagTND>('TDAH')
  const [domaine, setDomaine] = useState<DomaineCode>('ATT')
  const [niveau, setNiveau] = useState('1')
  const [age, setAge] = useState(108)
  const [loading, setLoading] = useState(false)
  const [reco, setReco] = useState<RecommandationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setLoading(true); setError(null)
    try {
      const res = await recommander({
        profil_tnd: [profil],
        domaines_deficit: [domaine],
        niveaux: { [domaine]: parseInt(niveau) } as Partial<Record<DomaineCode, number>>,
        age_mois: age,
      })
      setReco(res)
    } catch (e) { setError(String(e)) }
    finally { setLoading(false) }
  }

  const allItems = reco ? [...reco.exercices, ...reco.routines, ...reco.falc, ...reco.jeux] : []

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Formulaire */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Paramètres de la recommandation</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
          <label style={labelStyle}>
            <span>Profil TND</span>
            <select value={profil} onChange={e => setProfil(e.target.value as TagTND)}>
              {PROFILS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            <span>Domaine déficitaire</span>
            <select value={domaine} onChange={e => setDomaine(e.target.value as DomaineCode)}>
              {DOMAINES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            <span>Niveau actuel</span>
            <select value={niveau} onChange={e => setNiveau(e.target.value)}>
              {NIVEAUX.map(n => <option key={n} value={n}>N{n}</option>)}
            </select>
          </label>
          <label style={labelStyle}>
            <span>Âge</span>
            <select value={age} onChange={e => setAge(Number(e.target.value))}>
              {AGES.map(a => <option key={a.val} value={a.val}>{a.label}</option>)}
            </select>
          </label>
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? 'Calcul en cours…' : '🧠 Générer la recommandation'}
        </button>
      </div>

      {/* Erreur */}
      {error && <div style={{ color: 'var(--coral)', fontSize: 13, padding: 12 }}>⚠️ {error}</div>}

      {/* Résultats */}
      {reco && (
        <>
          {/* Alertes */}
          {reco.alertes.map((a, i) => (
            <div key={i} style={{
              background: 'var(--amber-light)', border: '1px solid #e8c064',
              borderRadius: 8, padding: '10px 14px', fontSize: 13,
              color: '#412402', marginBottom: 10, display: 'flex', gap: 8,
            }}>
              ⚠️ {a}
            </div>
          ))}

          {/* Adaptations */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Adaptations systématiques · {profil}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {reco.adaptations.map((a, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--gray-600)', paddingLeft: 12, borderLeft: '2px solid var(--teal)' }}>
                  {a}
                </div>
              ))}
            </div>
          </div>

          {/* Contenus recommandés */}
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>
            Contenus recommandés ({allItems.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {allItems.map(item => <ContentCard key={item.id} item={item} compact />)}
            {allItems.length === 0 && <div className="empty">Aucun contenu trouvé pour ces critères</div>}
          </div>

          {/* Prochaine séance */}
          <div className="card" style={{ borderLeft: '3px solid var(--teal)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Prochaine séance</div>
            <p style={{ fontSize: 13, color: 'var(--teal-dark)', marginBottom: 8 }}>
              {reco.prochaine_seance.objectif}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {reco.prochaine_seance.preparer.map((p, i) => (
                <span key={i} className="tag">{p}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4,
  fontSize: 12, fontWeight: 500, color: 'var(--gray-600)'
}
