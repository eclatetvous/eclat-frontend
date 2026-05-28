import { useState } from 'react'
import { useSearch } from '../../hooks/useSearch'
import ContentCard from '../shared/ContentCard'
import DetailPanel from './DetailPanel'
import type { Contenu } from '../../types'

const TYPES  = ['','exercice','evaluation','jeu','falc','routine']
const DOMS   = ['','ATT','INH','MDT','FLX','PLN','ORG','MON','VIT','INI','MEL','LEC','ECR','MAT','EMO','CSOC','META','SEN']
const NIVS   = ['','N1','N2','N3','N4']
const TNDS   = ['','TDAH','TSA','DYS_LEX','DYS_CALC','HPI','ANXIETE']
const TYPE_LABELS: Record<string, string> = { '':'Tous les types', exercice:'Exercice', evaluation:'Évaluation', jeu:'Jeu', falc:'FALC', routine:'Routine' }
const NIV_LABELS: Record<string, string>  = { '':'Tous les niveaux', N1:'★☆☆☆ Initiation', N2:'★★☆☆ Développement', N3:'★★★☆ Consolidation', N4:'★★★★ Maîtrise' }

export default function SearchPanel() {
  const { results, total, loading, error, params, update, reset } = useSearch({ limit: 20 })
  const [selected, setSelected] = useState<Contenu | null>(null)

  const handleClick = (item: Contenu) =>
    setSelected(prev => prev?.id === item.id ? null : item)

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      {/* Colonne principale */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Barre de recherche */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="search"
            placeholder="Rechercher un exercice, un jeu, une FALC…"
            value={params.q ?? ''}
            onChange={e => update({ q: e.target.value })}
            style={{ flex: 1 }}
          />
          <button className="btn" onClick={reset}>Réinitialiser</button>
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { key: 'type', opts: TYPES, labels: TYPE_LABELS },
            { key: 'domaine', opts: DOMS, labels: Object.fromEntries(DOMS.map(d => [d, d || 'Tous les domaines'])) },
            { key: 'niveau', opts: NIVS, labels: NIV_LABELS },
            { key: 'tnd',    opts: TNDS, labels: Object.fromEntries(TNDS.map(t => [t, t || 'Tous profils TND'])) },
          ].map(({ key, opts, labels }) => (
            <select
              key={key}
              value={(params as Record<string, string>)[key] ?? ''}
              onChange={e => update({ [key]: e.target.value } as Record<string, string>)}
              style={{ width: 'auto', flex: '0 0 auto' }}
            >
              {opts.map(o => <option key={o} value={o}>{labels[o] ?? o}</option>)}
            </select>
          ))}
        </div>

        {/* Résultats header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
            {loading ? 'Chargement…' : `${total} résultat${total > 1 ? 's' : ''}`}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {['niveau','duree_min','titre'].map(s => (
              <button
                key={s}
                className={`btn btn-sm ${params.sort === s ? 'btn-primary' : ''}`}
                onClick={() => update({ sort: s as any })}
              >
                {s === 'niveau' ? 'Niveau' : s === 'duree_min' ? 'Durée' : 'Titre'}
              </button>
            ))}
          </div>
        </div>

        {/* Liste */}
        {error && <div style={{ color: 'var(--coral)', fontSize: 13, padding: 12 }}>⚠️ {error}</div>}
        {loading && <div style={{ padding: 40 }}><div className="spinner" /></div>}
        {!loading && results.length === 0 && <div className="empty">Aucun résultat — essayez d'autres filtres</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              onClick={handleClick}
              selected={selected?.id === item.id}
            />
          ))}
        </div>
      </div>

      {/* Panneau détail */}
      {selected && (
        <div style={{ width: 340, flexShrink: 0, position: 'sticky', top: 24 }}>
          <DetailPanel item={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  )
}
