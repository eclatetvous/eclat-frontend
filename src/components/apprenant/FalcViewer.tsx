
import type { Contenu } from '../../types'

interface Props {
  item: Contenu
  done: boolean
  onDone: () => void
}

export default function FalcViewer({ item, done, onDone }: Props) {
  const etapes     = item.etapes       ?? []
  const consigne   = item.consigne     ?? ''
  const deroulement= item.deroulement  ?? []
  const contenu    = item.contenu      ?? ''           // fiches FALC

  return (
    <div className="card" style={{ border: '1.5px solid var(--teal)', marginTop: 4 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
        {item.titre}
      </div>

      {/* Contenu FALC brut (fiches psychoéducation / stratégies) */}
      {contenu && (
        <div style={{
          background: 'var(--teal-light)', borderRadius: 10,
          padding: '14px 16px', marginBottom: 14,
          color: 'var(--teal-dark)', fontSize: 14, lineHeight: 1.8,
          whiteSpace: 'pre-line',
        }}>
          {contenu}
        </div>
      )}

      {/* Consigne simplifiée élève */}
      {!contenu && consigne && (
        <div style={{
          background: 'var(--teal-light)', borderRadius: 10,
          padding: '12px 16px', marginBottom: 14,
          color: 'var(--teal-dark)', fontWeight: 600, fontSize: 15,
        }}>
          {consigne}
        </div>
      )}

      {/* Étapes numérotées FALC */}
      {etapes.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {etapes.map(e => (
            <div key={e.ordre} style={{
              display: 'flex', gap: 10,
              marginBottom: 10, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--teal)', color: '#fff',
                fontWeight: 700, fontSize: 13, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {e.ordre}
              </div>
              <div style={{ fontSize: 15, lineHeight: 1.5, paddingTop: 3 }}>
                {e.texte}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Déroulement textuel (exercices sans étapes) */}
      {etapes.length === 0 && !contenu && deroulement.map((d, i) => (
        <div key={i} style={{
          display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--teal)', color: '#fff',
            fontWeight: 700, fontSize: 13, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{i + 1}</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, paddingTop: 4 }}>{d}</div>
        </div>
      ))}


      {/* Bouton impression */}
      <button
        onClick={() => window.print()}
        style={{
          width: '100%', height: 38, borderRadius: 8, border: '1px solid #eeeae0',
          background: '#fff', color: 'var(--gray-600)',
          fontWeight: 500, fontSize: 13, cursor: 'pointer',
          marginTop: 8, marginBottom: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        🖨️ Imprimer cette fiche
      </button>
      <button
        onClick={onDone}
        disabled={done}
        style={{
          width: '100%', height: 46, borderRadius: 10, border: 'none',
          background: done ? 'var(--gray-100)' : 'var(--teal)',
          color: done ? 'var(--gray-600)' : '#fff',
          fontWeight: 700, fontSize: 15,
          cursor: done ? 'default' : 'pointer',
          transition: 'all .2s', marginTop: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {done ? "✅ Activité terminée — super travail !" : "✓ J'ai fini cette activité !"}
      </button>
    </div>
  )
}
