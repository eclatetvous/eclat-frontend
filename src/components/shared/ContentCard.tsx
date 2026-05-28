import type { Contenu } from '../../types'

const TYPE_COLOR: Record<string, string> = {
  exercice:   'var(--teal)',
  evaluation: 'var(--purple)',
  jeu:        'var(--coral)',
  falc:       'var(--amber)',
  routine:    'var(--teal)',
  parcours:   'var(--purple)',
}
const TYPE_EMOJI: Record<string, string> = {
  exercice: '📝', evaluation: '📊', jeu: '🎲',
  falc: '📋', routine: '🔄', parcours: '🗺️',
}
const NIV_STARS = ['★☆☆☆','★★☆☆','★★★☆','★★★★']

interface Props {
  item: Contenu
  onClick?: (item: Contenu) => void
  selected?: boolean
  compact?: boolean
}

export default function ContentCard({ item, onClick, selected, compact }: Props) {
  const type = item.tags.type
  const color = TYPE_COLOR[type] ?? 'var(--gray-600)'
  const emoji = TYPE_EMOJI[type] ?? '📄'
  const niv = item.niveau
  const tnd = item.tags.tnd ?? []

  return (
    <div
      onClick={() => onClick?.(item)}
      style={{
        background: '#fff',
        border: `1px solid ${selected ? 'var(--teal)' : '#eeeae0'}`,
        borderRadius: 12,
        padding: compact ? '10px 14px' : '14px 16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .15s, box-shadow .15s',
        boxShadow: selected ? '0 0 0 2px var(--teal-light)' : '0 1px 2px rgba(0,0,0,.05)',
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}
      onMouseEnter={e => { if (!selected && onClick) (e.currentTarget as HTMLDivElement).style.borderColor = '#ccc' }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.borderColor = '#eeeae0' }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: `${color}18`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        {emoji}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 5, lineHeight: 1.3 }}>
          {item.titre}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="badge badge-teal">{item.domaine_id ?? item.domaines_ids?.[0]}</span>
          <span className="tag">{type}</span>
          {tnd.slice(0,2).map((t: string) => <span key={t} className="tag">{t}</span>)}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {niv && <div className="stars" style={{ fontSize: 12 }}>{NIV_STARS[niv-1]}</div>}
        <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
          {item.duree_min ?? item.tags.duree_min} min
        </div>
      </div>
    </div>
  )
}
