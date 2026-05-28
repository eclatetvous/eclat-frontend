import type { Contenu } from '../../types'

interface Props {
  item: Contenu
  done: boolean
  selected: boolean
  onClick: () => void
}

const TYPE_EMOJI: Record<string, string> = {
  exercice:'📝', jeu:'🎲', routine:'🔄', falc:'📋', evaluation:'📊'
}
const NIV = ['★☆☆☆','★★☆☆','★★★☆','★★★★']

export default function ActiviteCard({ item, done, selected, onClick }: Props) {
  const niv = item.niveau ?? 1
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: `1.5px solid ${selected ? 'var(--teal)' : done ? '#c5e8da' : '#eeeae0'}`,
        borderRadius: 12, padding: 14, cursor: 'pointer',
        transition: 'all .15s',
        position: 'relative', overflow: 'hidden',
        boxShadow: selected ? '0 0 0 3px var(--teal-light)' : '0 1px 2px rgba(0,0,0,.05)',
        opacity: done && !selected ? 0.7 : 1,
      }}
    >
      {done && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'var(--teal)', color: '#fff',
          fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 600,
        }}>✓</div>
      )}
      <div style={{ fontSize: 24, marginBottom: 8 }}>
        {TYPE_EMOJI[item.tags.type] ?? '📄'}
      </div>
      <div style={{ fontWeight: 600, fontSize: 12, lineHeight: 1.3, marginBottom: 6 }}>
        {item.titre}
      </div>
      <div style={{ fontSize: 11, color: 'var(--amber)' }}>{NIV[niv-1]}</div>
      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
        ⏱ {item.duree_min ?? item.tags.duree_min} min
      </div>
    </div>
  )
}
