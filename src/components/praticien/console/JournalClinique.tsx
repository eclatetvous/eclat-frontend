import { useState, useEffect } from 'react'
import type { ApprenantProfile } from '../../../types'

interface Note {
  id: string
  date: string
  type: 'observation' | 'progression' | 'difficulte' | 'ajustement' | 'objectif'
  texte: string
  domaine?: string
}

const TYPE_CONFIG = {
  observation: { label: 'Observation', color: 'var(--teal)', bg: 'var(--teal-light)', icon: '👁️' },
  progression:  { label: 'Progression', color: '#1a7a3a', bg: '#e6f4ea', icon: '📈' },
  difficulte:   { label: 'Difficulté', color: 'var(--coral)', bg: 'var(--coral-light)', icon: '⚠️' },
  ajustement:   { label: 'Ajustement parcours', color: 'var(--purple)', bg: 'var(--purple-light)', icon: '🔧' },
  objectif:     { label: 'Nouvel objectif', color: 'var(--amber)', bg: 'var(--amber-light)', icon: '🎯' },
}

const STORAGE_KEY = (id: string) => `eclat_journal_${id}`

export default function JournalClinique({ apprenant }: { apprenant: ApprenantProfile }) {
  const [notes, setNotes]       = useState<Note[]>([])
  const [type, setType]         = useState<Note['type']>('observation')
  const [texte, setTexte]       = useState('')
  const [domaine, setDomaine]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter]     = useState<Note['type'] | 'all'>('all')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY(apprenant.id))
      if (stored) setNotes(JSON.parse(stored))
    } catch {}
  }, [apprenant.id])

  function save(updated: Note[]) {
    setNotes(updated)
    try { localStorage.setItem(STORAGE_KEY(apprenant.id), JSON.stringify(updated)) } catch {}
  }

  function addNote() {
    if (!texte.trim()) return
    const note: Note = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type, texte: texte.trim(), domaine: domaine || undefined,
    }
    save([note, ...notes])
    setTexte(''); setDomaine(''); setShowForm(false)
  }

  function deleteNote(id: string) {
    save(notes.filter(n => n.id !== id))
  }

  const filtered = filter === 'all' ? notes : notes.filter(n => n.type === filter)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Journal clinique</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Annuler' : '+ Ajouter une note'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--teal-light)', borderRadius: 10, padding: 14, marginBottom: 14, border: '1px solid #c5e8da' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {(Object.entries(TYPE_CONFIG) as [Note['type'], typeof TYPE_CONFIG[keyof typeof TYPE_CONFIG]][]).map(([k, v]) => (
              <button key={k} type="button" onClick={() => setType(k)}
                style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid', borderColor: type === k ? v.color : 'var(--gray-100)', background: type === k ? v.bg : '#fff', color: type === k ? v.color : 'var(--gray-600)' }}>
                {v.icon} {v.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 8 }}>
            <input value={domaine} onChange={e => setDomaine(e.target.value.toUpperCase())} placeholder="Domaine (ex: ATT)" style={{ textTransform: 'uppercase' }} />
            <span style={{ fontSize: 12, color: 'var(--gray-400)', alignSelf: 'center' }}>optionnel</span>
          </div>
          <textarea value={texte} onChange={e => setTexte(e.target.value)} placeholder="Décrire l'observation, la progression, la difficulté, ou l'ajustement proposé…" rows={3} style={{ width: '100%', resize: 'vertical', marginBottom: 8 }} />
          <button className="btn btn-primary" onClick={addNote} disabled={!texte.trim()}>Enregistrer la note</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <button onClick={() => setFilter('all')} className="btn btn-sm" style={{ background: filter === 'all' ? 'var(--teal)' : '#fff', color: filter === 'all' ? '#fff' : 'var(--gray-600)', border: '1px solid', borderColor: filter === 'all' ? 'var(--teal)' : 'var(--gray-100)' }}>
          Tout ({notes.length})
        </button>
        {(Object.entries(TYPE_CONFIG) as [Note['type'], typeof TYPE_CONFIG[keyof typeof TYPE_CONFIG]][]).map(([k, v]) => {
          const n = notes.filter(x => x.type === k).length
          if (n === 0) return null
          return (
            <button key={k} onClick={() => setFilter(k)} className="btn btn-sm"
              style={{ background: filter === k ? v.bg : '#fff', color: filter === k ? v.color : 'var(--gray-600)', border: '1px solid', borderColor: filter === k ? v.color : 'var(--gray-100)' }}>
              {v.icon} {v.label} ({n})
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)', fontSize: 13, background: 'var(--gray-50)', borderRadius: 8 }}>
          {notes.length === 0 ? 'Aucune note — commencez à documenter le suivi clinique.' : 'Aucune note de ce type.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(note => {
          const cfg = TYPE_CONFIG[note.type]
          return (
            <div key={note.id} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${cfg.color}30`, padding: '12px 14px', borderLeft: `3px solid ${cfg.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: cfg.bg, color: cfg.color, fontWeight: 600 }}>
                    {cfg.icon} {cfg.label}
                  </span>
                  {note.domaine && (
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, background: 'var(--gray-50)', color: 'var(--gray-600)', border: '1px solid var(--gray-100)' }}>
                      {note.domaine}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>
                    {new Date(note.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <button onClick={() => deleteNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray-900)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{note.texte}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
