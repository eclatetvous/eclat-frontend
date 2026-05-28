import { createClient } from '@supabase/supabase-js'
import type {
  ApprenantProfile,
  EvaluationPassee,
  ScoreRecord,
  Affectation,
  SessionRecord,
  DomaineCode,
  StatutAffectation
} from '../types'

const url = (import.meta as any).env?.VITE_SUPABASE_URL ?? ''
const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? ''

export const supabase =
  url && key ? createClient(url, key) : null

const offline = !supabase

// ─────────────────────────────────────────────
// APPRENANTS
// ─────────────────────────────────────────────

export async function getAllApprenants(): Promise<ApprenantProfile[]> {
  if (offline) return MOCK_APPRENANTS

  const { data, error } = await supabase!
    .from('apprenants')
    .select('*')
    .eq('actif', true)
    .order('prenom')

  if (error) {
    console.error('Erreur getAllApprenants:', error)
    return []
  }

  return data ?? []
}

export async function getApprenant(
  id: string
): Promise<ApprenantProfile | null> {
  if (offline) {
    return MOCK_APPRENANTS.find(a => a.id === id) ?? null
  }

  const { data, error } = await supabase!
    .from('apprenants')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Erreur getApprenant:', error)
    return null
  }

  return data
}

export async function createApprenant(
  p: Omit<ApprenantProfile, 'id' | 'created_at'>
): Promise<ApprenantProfile | null> {
  if (offline) return null

  const payload = {
    ...p,
    actif: true,
    created_at: new Date().toISOString()
  }

  const { data, error } = await supabase!
    .from('apprenants')
    .insert(payload)
    .select()
    .maybeSingle()

  if (error) {
    console.error('Erreur createApprenant:', error)
    return null
  }

  return data
}

export async function updateApprenant(
  id: string,
  p: Partial<ApprenantProfile>
): Promise<void> {
  if (offline) return

  const { error } = await supabase!
    .from('apprenants')
    .update({
      ...p,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Erreur updateApprenant:', error)
  }
}

// ─────────────────────────────────────────────
// ÉVALUATIONS PASSÉES
// ─────────────────────────────────────────────

export async function getEvaluationsPassees(
  apprenantId: string
): Promise<EvaluationPassee[]> {
  if (offline) {
    return MOCK_EVALS.filter(
      e => e.apprenant_id === apprenantId
    )
  }

  const { data, error } = await supabase!
    .from('evaluations_passees')
    .select('*')
    .eq('apprenant_id', apprenantId)
    .order('date_passation', {
      ascending: false
    })

  if (error) {
    console.error(
      'Erreur getEvaluationsPassees:',
      error
    )
    return []
  }

  return data ?? []
}

export async function saveEvaluationPassee(
  ev: Omit<EvaluationPassee, 'id' | 'created_at'>
): Promise<EvaluationPassee | null> {
  if (offline) return null

  const payload = {
    ...ev,
    created_at: new Date().toISOString()
  }

  const { data, error } = await supabase!
    .from('evaluations_passees')
    .insert(payload)
    .select()
    .maybeSingle()

  if (error) {
    console.error(
      'Erreur saveEvaluationPassee:',
      error
    )
    return null
  }

  return data
}

// ─────────────────────────────────────────────
// SCORES
// ─────────────────────────────────────────────

export async function getScores(
  apprenantId: string
): Promise<ScoreRecord[]> {
  if (offline) {
    return MOCK_SCORES.filter(
      s => s.apprenant_id === apprenantId
    )
  }

  const { data, error } = await supabase!
    .from('scores')
    .select('*')
    .eq('apprenant_id', apprenantId)
    .order('date_passation', {
      ascending: false
    })

  if (error) {
    console.error('Erreur getScores:', error)
    return []
  }

  return data ?? []
}

export async function getLatestNiveaux(
  apprenantId: string
): Promise<Partial<Record<DomaineCode, number>>> {
  const scores = await getScores(apprenantId)

  const latest: Partial<
    Record<DomaineCode, number>
  > = {}

  for (const s of scores) {
    if (!(s.domaine_id in latest)) {
      latest[s.domaine_id] = s.niveau
    }
  }

  return latest
}

export async function saveScore(
  s: Omit<ScoreRecord, 'id'>
): Promise<void> {
  if (offline) return

  const { error } = await supabase!
    .from('scores')
    .insert(s)

  if (error) {
    console.error('Erreur saveScore:', error)
  }
}

// ─────────────────────────────────────────────
// AFFECTATIONS
// ─────────────────────────────────────────────

export async function getAffectations(
  apprenantId: string
): Promise<Affectation[]> {
  if (offline) {
    return MOCK_AFFECTATIONS.filter(
      a => a.apprenant_id === apprenantId
    )
  }

  const { data, error } = await supabase!
    .from('affectations')
    .select('*')
    .eq('apprenant_id', apprenantId)
    .order('date_affectation', {
      ascending: false
    })

  if (error) {
    console.error(
      'Erreur getAffectations:',
      error
    )
    return []
  }

  return data ?? []
}

export async function createAffectation(
  a: Omit<Affectation, 'id' | 'created_at'>
): Promise<Affectation | null> {
  if (offline) return null

  const payload = {
    ...a,
    created_at: new Date().toISOString()
  }

  const { data, error } = await supabase!
    .from('affectations')
    .insert(payload)
    .select()
    .maybeSingle()

  if (error) {
    console.error(
      'Erreur createAffectation:',
      error
    )
    return null
  }

  return data
}

export async function updateAffectation(
  id: string,
  statut: StatutAffectation
): Promise<void> {
  if (offline) return

  const { error } = await supabase!
    .from('affectations')
    .update({
      statut,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error(
      'Erreur updateAffectation:',
      error
    )
  }
}

export async function deleteAffectation(
  id: string
): Promise<void> {
  if (offline) return

  const { error } = await supabase!
    .from('affectations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(
      'Erreur deleteAffectation:',
      error
    )
  }
}

// ─────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────

export async function getSessions(
  apprenantId: string
): Promise<SessionRecord[]> {
  if (offline) return []

  const { data, error } = await supabase!
    .from('sessions')
    .select('*')
    .eq('apprenant_id', apprenantId)
    .order('date_session', {
      ascending: false
    })
    .limit(20)

  if (error) {
    console.error('Erreur getSessions:', error)
    return []
  }

  return data ?? []
}

export async function saveSession(
  s: Omit<SessionRecord, 'id' | 'created_at'>
): Promise<void> {
  if (offline) return

  const payload = {
    ...s,
    created_at: new Date().toISOString()
  }

  const { error } = await supabase!
    .from('sessions')
    .insert(payload)

  if (error) {
    console.error('Erreur saveSession:', error)
  }
}

// ─────────────────────────────────────────────
// DONNÉES OFFLINE
// ─────────────────────────────────────────────

export const MOCK_APPRENANTS: ApprenantProfile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    prenom: 'Léa',
    nom: 'Martin',
    age_mois: 108,
    profils_tnd: ['TDAH'],
    niveau_classe: 'CM1',
    actif: true,
    created_at: new Date().toISOString()
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    prenom: 'Thomas',
    nom: 'Dupont',
    age_mois: 120,
    profils_tnd: ['TSA'],
    niveau_classe: 'CM2',
    actif: true,
    created_at: new Date().toISOString()
  }
]

export const MOCK_EVALS: EvaluationPassee[] = []

export const MOCK_SCORES: ScoreRecord[] = []

export const MOCK_AFFECTATIONS: Affectation[] = []

export const isOffline = offline