import { useState } from 'react'
import type { ApprenantProfile, EvaluationPassee, Affectation } from '../../../types'

const NIV_LABEL = ['', 'Initiation (N1)', 'Développement (N2)', 'Consolidation (N3)', 'Maîtrise (N4)']
const STATUT_LABEL: Record<string, string> = { normal: 'dans la norme', limite: 'zone limite', clinique: 'niveau clinique' }

interface Props {
  apprenant: ApprenantProfile
  niveaux: Partial<Record<string, number>>
  evaluations: EvaluationPassee[]
  affectations: Affectation[]
  notes: string
}

export default function AideBilan({ apprenant, niveaux, evaluations, affectations, notes }: Props) {
  const [type, setType]       = useState<'positionnement' | 'mi_parcours' | 'fin_parcours'>('positionnement')
  const [bilan, setBilan]     = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)

  const age = Math.floor(apprenant.age_mois / 12)
  const profils = apprenant.profils_tnd.join(', ')
  const domainesDeficitaires = Object.entries(niveaux)
    .filter(([, n]) => (n ?? 0) <= 2)
    .map(([d, n]) => `${d} (${NIV_LABEL[n ?? 1]})`)
    .join(', ')
  const domainesForce = Object.entries(niveaux)
    .filter(([, n]) => (n ?? 0) >= 3)
    .map(([d]) => d)
    .join(', ')
  const termines = affectations.filter(a => a.statut === 'termine').length
  const total    = affectations.length

  const evResume = evaluations.slice(0, 8).map(ev =>
    `${ev.domaine_id} — ${ev.titre_evaluation ?? ev.evaluation_id} : ${STATUT_LABEL[ev.statut] ?? ev.statut}${ev.score_brut !== undefined ? ` (score: ${ev.score_brut})` : ''}`
  ).join('\n')

  const typeLabels = {
    positionnement: 'de positionnement initial',
    mi_parcours:    'de mi-parcours',
    fin_parcours:   'de fin de parcours',
  }

  async function genererBilan() {
    setLoading(true)
    setBilan('')

    const prompt = `Tu es orthopédagogue expert en TND (TDAH, TSA, Dyslexie, Dyscalculie, HPI).
Rédige un bilan clinique ${typeLabels[type]} complet, professionnel et bienveillant pour cet apprenant.

DONNÉES DE L'APPRENANT :
- Prénom : ${apprenant.prenom}${apprenant.nom ? ' ' + apprenant.nom : ''}
- Âge : ${age} ans (${apprenant.age_mois} mois)
- Classe : ${apprenant.niveau_classe ?? 'non renseigné'}
- Profil(s) TND : ${profils}

PROFIL COGNITIF (niveaux actuels) :
${Object.entries(niveaux).map(([d, n]) => `  - ${d} : ${NIV_LABEL[n ?? 1]}`).join('\n')}

DOMAINES DÉFICITAIRES : ${domainesDeficitaires || 'aucun identifié'}
DOMAINES FORTS : ${domainesForce || 'non identifiés'}

ÉVALUATIONS RÉALISÉES :
${evResume || 'Aucune évaluation enregistrée'}

PLAN DE TRAVAIL :
${termines} activité(s) terminée(s) sur ${total} affectée(s)
${affectations.filter(a => a.statut === 'termine').map(a => `  ✓ ${a.titre ?? a.contenu_id}`).join('\n')}

NOTES DU PRATICIEN :
${notes || 'Aucune note'}

STRUCTURE DU BILAN À RÉDIGER :
1. Présentation de l'apprenant et contexte du bilan
2. Profil cognitif général (forces et défis)
3. Analyse domaine par domaine (uniquement les domaines évalués)
4. Synthèse clinique${type === 'fin_parcours' ? ' et bilan de progression' : ''}
5. Préconisations${type === 'fin_parcours' ? ' pour la suite' : ' pour le parcours de remédiation'}
6. Conclusion bienveillante pour l'apprenant et sa famille

Utilise un vocabulaire professionnel mais accessible aux parents. Longueur : 400 à 600 mots.`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }],
        }),
      })
      const data = await response.json()
      const text = data.content?.map((c: any) => c.text || '').join('') ?? ''
      setBilan(text)
    } catch (e) {
      setBilan('Erreur de génération. Vérifiez votre connexion à l\'API.')
    } finally {
      setLoading(false)
    }
  }

  async function copier() {
    try {
      await navigator.clipboard.writeText(bilan)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Aide à la rédaction de bilan</div>

      <div style={{ background: 'var(--purple-light)', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid #c5c0f0' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--purple)', marginBottom: 10 }}>Type de bilan</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {([
            ['positionnement', '📊 Positionnement initial', 'En début de prise en charge'],
            ['mi_parcours',    '📈 Mi-parcours',            'À mi-chemin du programme'],
            ['fin_parcours',   '🏁 Fin de parcours',        'Bilan final et préconisations'],
          ] as const).map(([k, label, sub]) => (
            <button key={k} onClick={() => setType(k)}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid', cursor: 'pointer', textAlign: 'left', background: type === k ? 'var(--purple-light)' : '#fff', borderColor: type === k ? 'var(--purple)' : 'var(--gray-100)', flex: '1 1 160px' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: type === k ? 'var(--purple)' : 'var(--gray-900)' }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{sub}</div>
            </button>
          ))}
        </div>

        <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 12, color: 'var(--purple)' }}>
          <strong>Données utilisées :</strong> {apprenant.prenom} · {age} ans · {profils} · {Object.keys(niveaux).length} domaines évalués · {evaluations.length} évaluations · {notes ? 'notes cliniques incluses' : 'pas de notes'}
        </div>

        <button className="btn btn-primary" onClick={genererBilan} disabled={loading || Object.keys(niveaux).length === 0}
          style={{ background: 'var(--purple)', width: '100%', height: 44, fontSize: 14 }}>
          {loading ? '✍️ Rédaction en cours…' : `✍️ Générer le bilan ${typeLabels[type]}`}
        </button>
        {Object.keys(niveaux).length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--coral)', marginTop: 8, textAlign: 'center' }}>
            Enregistrez au moins une évaluation pour générer un bilan.
          </div>
        )}
      </div>

      {bilan && (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #eeeae0', overflow: 'hidden' }}>
          <div style={{ background: 'var(--gray-50)', padding: '10px 14px', borderBottom: '1px solid #eeeae0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Bilan généré — {typeLabels[type]}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-sm" onClick={copier}>
                {copied ? '✓ Copié !' : '📋 Copier'}
              </button>
              <button className="btn btn-sm" onClick={() => window.print()}>
                🖨️ Imprimer
              </button>
            </div>
          </div>
          <div style={{ padding: '16px 20px', fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--gray-900)' }}>
            {bilan}
          </div>
          <div style={{ padding: '10px 14px', borderTop: '1px solid #eeeae0', fontSize: 11, color: 'var(--gray-400)', fontStyle: 'italic' }}>
            ⚠️ Ce bilan est une aide à la rédaction — à relire, adapter et valider par le praticien avant transmission.
          </div>
        </div>
      )}
    </div>
  )
}
