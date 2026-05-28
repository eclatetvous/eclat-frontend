
import { useState, useEffect, useCallback } from 'react'
import { searchContenus } from '../../lib/api'
import { getApprenant, getLatestNiveaux, saveSession } from '../../lib/supabase'
import type { Contenu, ApprenantProfile, DomaineCode } from '../../types'
import ActiviteCard from './ActiviteCard'
import FalcViewer from './FalcViewer'
import ProgressBar from './ProgressBar'

const TABS = [
  { id: 'activites', label: 'Mes activités' },
  { id: 'fiches',    label: 'Mes fiches'    },
  { id: 'progres',   label: 'Mes progrès'   },
]
const NIV_LABEL = ['', 'Initiation', 'Développement', 'Consolidation', 'Maîtrise']
const NIV_COLOR = ['', 'var(--amber)', 'var(--teal)', 'var(--purple)', 'var(--coral)']

export default function DashboardApprenant() {
  const [tab, setTab]           = useState('activites')
  const [apprenant, setApprenant] = useState<ApprenantProfile | null>(null)
  const [exercices, setExercices] = useState<Contenu[]>([])
  const [falcItems, setFalcItems] = useState<Contenu[]>([])
  const [niveaux, setNiveaux]   = useState<Partial<Record<DomaineCode, number>>>({})
  const [selected, setSelected] = useState<Contenu | null>(null)
  const [done, setDone]         = useState<Set<string>>(new Set())
  const [sessionSaved, setSessionSaved] = useState(false)
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const profile = await getApprenant('00000000-0000-0000-0000-000000000001')
      if (!profile) return
      setApprenant(profile)

      const niv = await getLatestNiveaux(profile.id)
      setNiveaux(niv)

      const tnd = profile.profils_tnd[0] ?? 'TDAH'
      const [exRes, falcRes] = await Promise.all([
        searchContenus({ type: 'exercice', tnd, niveau: 'N1,N2', limit: 6 }),
        searchContenus({ type: 'falc',     tnd, limit: 9 }),
      ])
      setExercices(exRes.items)
      setFalcItems(falcRes.items)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const progress = exercices.length > 0
    ? Math.round((done.size / exercices.length) * 100) : 0

  async function finirSeance() {
    if (!apprenant || sessionSaved) return
    await saveSession({
      apprenant_id: apprenant.id,
      date_session: new Date().toISOString().split('T')[0],
      domaines_traites: [...new Set(exercices.map(e => e.domaine_id!))],
      exercices_ids: [...done],
    })
    setSessionSaved(true)
  }

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center' }}>
      <div className="spinner" style={{ marginBottom: 12 }} />
      <p style={{ color: 'var(--gray-400)', fontSize: 13 }}>Chargement de tes activités…</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* Bandeau bienvenue */}
      <div style={{
        background: 'linear-gradient(135deg, var(--teal-light), var(--purple-light))',
        borderRadius: 16, padding: 20, marginBottom: 20,
        border: '1px solid #c5e8da',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--teal-dark)', marginBottom: 4 }}>
          Bonjour {apprenant?.prenom ?? '!'} 👋
        </div>
        <div style={{ fontSize: 13, color: 'var(--teal)', marginBottom: 14 }}>
          Tu as {exercices.length} activités aujourd'hui. Chaque entraînement compte !
        </div>
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 12, color: 'var(--teal)', marginBottom: 6,
          }}>
            <span>Progression du jour</span>
            <span>{done.size} / {exercices.length}</span>
          </div>
          <ProgressBar value={progress} color="var(--teal)" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #eeeae0', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 18px', border: 'none', background: 'transparent',
            fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? 'var(--teal)' : 'var(--gray-600)',
            borderBottom: tab === t.id ? '2px solid var(--teal)' : '2px solid transparent',
            marginBottom: '-1px', cursor: 'pointer', fontSize: 13,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Activités ── */}
      {tab === 'activites' && (
        <div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
            gap: 10, marginBottom: 16,
          }}>
            {exercices.map(ex => (
              <ActiviteCard
                key={ex.id} item={ex}
                done={done.has(ex.id)}
                selected={selected?.id === ex.id}
                onClick={() => setSelected(prev => prev?.id === ex.id ? null : ex)}
              />
            ))}
          </div>
          {selected && (
            <FalcViewer
              item={selected}
              done={done.has(selected.id)}
              onDone={() => setDone(prev => new Set([...prev, selected.id]))}
            />
          )}
        </div>
      )}

      {/* ── Fiches FALC cliquables ── */}
      {tab === 'fiches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {falcItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)', fontSize: 13 }}>
              Aucune fiche disponible
            </div>
          )}

          {/* Fiche ouverte */}
          {selected && selected.tags.type === 'falc' && (
            <div style={{ marginBottom: 8 }}>
              <FalcViewer
                item={selected}
                done={done.has(selected.id)}
                onDone={() => setDone(prev => new Set([...prev, selected.id]))}
              />
              <button
                onClick={() => setSelected(null)}
                className="btn"
                style={{ marginTop: 8, width: '100%' }}
              >
                ← Revenir à la liste des fiches
              </button>
            </div>
          )}

          {/* Grille des fiches */}
          {(!selected || selected.tags.type !== 'falc') && falcItems.map(f => (
            <div
              key={f.id}
              onClick={() => setSelected(f)}
              style={{
                background: '#fff', borderRadius: 12,
                border: '1px solid #eeeae0', padding: '14px 16px',
                cursor: 'pointer', transition: 'all .15s',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--teal)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#eeeae0')}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: 'var(--amber-light)', color: 'var(--amber)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {f.sous_type === 'psychoeducation' ? '📖'
                 : f.sous_type === 'strategie'     ? '🎯'
                 : f.sous_type === 'outil'          ? '🛠️'
                 : f.sous_type === 'routine'        ? '🔄'
                 : '📋'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                  {f.titre}
                </div>
                {f.contenu && (
                  <p style={{ fontSize: 12, color: 'var(--gray-600)', lineHeight: 1.5, margin: 0 }}>
                    {f.contenu.slice(0, 120).split('\n').join(' ')}…
                  </p>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <span className="badge badge-teal">{f.domaine_id}</span>
                  {f.sous_type && (
                    <span className="badge badge-amber">{f.sous_type}</span>
                  )}
                </div>
              </div>
              <div style={{ color: 'var(--teal)', fontSize: 18, flexShrink: 0 }}>›</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Progrès ── */}
      {tab === 'progres' && (
        <div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 8, marginBottom: 20,
          }}>
            {(Object.entries(niveaux) as [DomaineCode, number][]).map(([dom, niv]) => (
              <div key={dom} className="card">
                <div style={{
                  display: 'flex', justifyContent: 'space-between', marginBottom: 8,
                }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{dom}</span>
                  <span style={{ fontSize: 12, color: NIV_COLOR[niv], fontWeight: 500 }}>
                    {NIV_LABEL[niv]}
                  </span>
                </div>
                <ProgressBar value={(niv / 4) * 100} color={NIV_COLOR[niv]} />
              </div>
            ))}
          </div>

          {Object.keys(niveaux).length === 0 && (
            <div className="empty">Pas encore de scores enregistrés</div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: '100%', height: 44, fontSize: 14 }}
            onClick={finirSeance}
            disabled={sessionSaved}
          >
            {sessionSaved
              ? '✅ Séance enregistrée — bravo !'
              : 'Terminer la séance'}
          </button>
        </div>
      )}
    </div>
  )
}
