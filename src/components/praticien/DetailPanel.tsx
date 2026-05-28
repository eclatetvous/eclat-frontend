import type { Contenu } from '../../types'

interface Props {
  item: Contenu
  onClose: () => void
}

const ADA_COLOR: Record<string, string> = {
  TDAH: 'var(--teal)', TSA: 'var(--purple)', DYS: 'var(--coral)',
  HPI: 'var(--amber)', SEN: 'var(--gray-600)'
}
const ADA_BG: Record<string, string> = {
  TDAH: 'var(--teal-light)', TSA: 'var(--purple-light)', DYS: 'var(--coral-light)',
  HPI: 'var(--amber-light)', SEN: 'var(--gray-50)'
}

export default function DetailPanel({ item, onClose }: Props) {
  const ada = item.adaptations ?? {}
  const etapes = item.etapes ?? []

  return (
    <div className="card" style={{ fontSize: 13 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3, marginBottom: 4 }}>
            {item.titre}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span className="badge badge-teal">{item.domaine_id ?? item.domaines_ids?.[0]}</span>
            <span className="badge badge-gray">{item.tags.type}</span>
          </div>
        </div>
        <button onClick={onClose} className="btn btn-sm" style={{ flexShrink: 0 }}>✕</button>
      </div>

      {item.objectif && (
        <Section label="Objectif">
          <p>{item.objectif}</p>
        </Section>
      )}

      {item.consigne_prof && (
        <Section label="Consigne praticien">
          <p style={{ lineHeight: 1.5 }}>{item.consigne_prof}</p>
        </Section>
      )}

      {item.consigne && (
        <Section label="Consigne élève">
          <div style={{
            background: 'var(--teal-light)', borderRadius: 8,
            padding: '10px 12px', color: 'var(--teal-dark)', fontWeight: 500,
          }}>
            {item.consigne}
          </div>
        </Section>
      )}

      {etapes.length > 0 && (
        <Section label="Étapes">
          {etapes.map(e => (
            <div key={e.ordre} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', background: 'var(--teal)',
                color: '#fff', fontSize: 11, fontWeight: 600, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{e.ordre}</span>
              <span style={{ paddingTop: 2 }}>{e.texte}</span>
            </div>
          ))}
        </Section>
      )}

      {item.critere_reussite && (
        <Section label="Critère de réussite">
          <p style={{ color: 'var(--teal-dark)', fontWeight: 500 }}>✓ {item.critere_reussite}</p>
        </Section>
      )}

      {Object.keys(ada).length > 0 && (
        <Section label="Adaptations TND">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(ada).map(([k, v]) => v && (
              <div key={k} style={{
                background: ADA_BG[k] ?? 'var(--gray-50)', borderRadius: 8,
                padding: '8px 10px',
              }}>
                <strong style={{ color: ADA_COLOR[k] ?? 'var(--gray-600)', fontSize: 11 }}>{k}</strong>
                <p style={{ marginTop: 2, color: 'var(--gray-900)' }}>{v}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {item.materiel && item.materiel.length > 0 && (
        <Section label="Matériel">
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {item.materiel.map(m => <span key={m} className="tag">{m}</span>)}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--gray-400)', marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  )
}
