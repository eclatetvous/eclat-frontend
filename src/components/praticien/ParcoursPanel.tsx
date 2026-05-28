import { useState } from 'react'
import { useApi } from '../../hooks/useApi'
import { getParcours, getPhase } from '../../lib/api'
import ContentCard from '../shared/ContentCard'
import type { Parcours, Contenu } from '../../types'

const PROFIL_COLOR: Record<string, string> = {
  TDAH:'var(--teal)', TSA:'var(--purple)', DYS_LEX:'var(--coral)',
  DYS_CALC:'var(--teal)', DYP:'var(--amber)', HPI:'var(--gray-600)'
}

export default function ParcoursPanel() {
  const { data: list, loading } = useApi(getParcours)
  const [selected, setSelected] = useState<Parcours | null>(null)
  const [phaseNum, setPhaseNum] = useState(1)
  const [phaseData, setPhaseData] = useState<{ exercices: Contenu[]; routines: Contenu[]; falc: Contenu[] } | null>(null)
  const [loadingPhase, setLoadingPhase] = useState(false)

  async function loadPhase(p: Parcours, n: number) {
    setPhaseNum(n); setLoadingPhase(true)
    try {
      const data = await getPhase(p.id, n)
      setPhaseData(data)
    } catch { setPhaseData(null) }
    finally { setLoadingPhase(false) }
  }

  function selectParcours(p: Parcours) {
    setSelected(p); setPhaseData(null)
    loadPhase(p, 1)
  }

  if (loading) return <div style={{ padding: 40 }}><div className="spinner" /></div>

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Liste */}
      <div style={{ flex: '0 0 280px' }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>
          {list?.length ?? 0} parcours disponibles
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(list ?? []).map(p => {
            const color = PROFIL_COLOR[p.profil_id] ?? 'var(--gray-600)'
            return (
              <div
                key={p.id}
                onClick={() => selectParcours(p)}
                className="card"
                style={{
                  cursor: 'pointer',
                  border: selected?.id === p.id ? '1px solid var(--teal)' : '1px solid #eeeae0',
                  boxShadow: selected?.id === p.id ? '0 0 0 2px var(--teal-light)' : undefined,
                }}
              >
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 6 }}>{p.titre}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="badge" style={{ background: `${color}18`, color }}>{p.profil_id}</span>
                  <span className="badge badge-gray">{p.duree_semaines} sem.</span>
                  <span className="badge badge-gray">{p.phases.length} phases</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Détail */}
      {selected && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{selected.titre}</div>
          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 16 }}>
            Domaines : {selected.domaines.join(' · ')}
          </div>

          {/* Phases */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {selected.phases.map(ph => (
              <button
                key={ph.numero}
                className={`btn btn-sm ${phaseNum === ph.numero ? 'btn-primary' : ''}`}
                onClick={() => loadPhase(selected, ph.numero)}
              >
                Phase {ph.numero}
              </button>
            ))}
          </div>

          {/* Phase en cours */}
          {selected.phases.find(p => p.numero === phaseNum) && (() => {
            const ph = selected.phases.find(p => p.numero === phaseNum)!
            return (
              <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Phase {ph.numero} — {ph.label}</div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 8 }}>
                  Semaines {ph.semaines_debut}–{ph.semaines_fin} · Domaines : {ph.domaines.join(' · ')}
                </div>
                <div style={{ fontSize: 13, borderLeft: '2px solid var(--teal)', paddingLeft: 10, color: 'var(--gray-600)' }}>
                  {ph.critere_passage}
                </div>
              </div>
            )
          })()}

          {/* Contenus de la phase */}
          {loadingPhase && <div style={{ padding: 20 }}><div className="spinner" /></div>}
          {phaseData && (
            <>
              {[
                { label: 'Exercices', items: phaseData.exercices },
                { label: 'Routines', items: phaseData.routines },
                { label: 'Fiches FALC', items: phaseData.falc },
              ].filter(s => s.items?.length > 0).map(section => (
                <div key={section.label} style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--gray-400)', marginBottom: 8 }}>
                    {section.label} ({section.items.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {section.items.map(item => <ContentCard key={item.id} item={item} compact />)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
