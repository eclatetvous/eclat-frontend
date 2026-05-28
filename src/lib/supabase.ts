import { createClient } from '@supabase/supabase-js'
import type {
  ApprenantProfile, EvaluationPassee, ScoreRecord,
  Affectation, SessionRecord, DomaineCode, TagTND, StatutAffectation
} from '../types'

const url = (import.meta as any).env?.VITE_SUPABASE_URL ?? ''
const key = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? ''
export const supabase = url && key ? createClient(url, key) : null
const offline = !supabase

// ── Apprenants ────────────────────────────────────────────────

export async function getAllApprenants(): Promise<ApprenantProfile[]> {
  if (offline) return MOCK_APPRENANTS
  const { data } = await supabase!.from('apprenants').select('*').eq('actif', true).order('prenom')
  return data ?? []
}

export async function getApprenant(id: string): Promise<ApprenantProfile | null> {
  if (offline) return MOCK_APPRENANTS.find(a => a.id === id) ?? null
  const { data } = await supabase!.from('apprenants').select('*').eq('id', id).single()
  return data
}

export async function createApprenant(p: Omit<ApprenantProfile, 'id'|'created_at'>): Promise<ApprenantProfile | null> {
  if (offline) return null
  const { data } = await supabase!.from('apprenants').insert(p).select().single()
  return data
}

export async function updateApprenant(id: string, p: Partial<ApprenantProfile>): Promise<void> {
  if (offline) return
  await supabase!.from('apprenants').update({ ...p, updated_at: new Date().toISOString() }).eq('id', id)
}

// ── Évaluations passées ───────────────────────────────────────

export async function getEvaluationsPassees(apprenantId: string): Promise<EvaluationPassee[]> {
  if (offline) return MOCK_EVALS.filter(e => e.apprenant_id === apprenantId)
  const { data } = await supabase!.from('evaluations_passees')
    .select('*').eq('apprenant_id', apprenantId)
    .order('date_passation', { ascending: false })
  return data ?? []
}

export async function saveEvaluationPassee(ev: Omit<EvaluationPassee, 'id'|'created_at'>): Promise<EvaluationPassee | null> {
  if (offline) return null
  const { data } = await supabase!.from('evaluations_passees').insert(ev).select().single()
  return data
}

// ── Scores (niveaux par domaine) ──────────────────────────────

export async function getScores(apprenantId: string): Promise<ScoreRecord[]> {
  if (offline) return MOCK_SCORES.filter(s => s.apprenant_id === apprenantId)
  const { data } = await supabase!.from('scores').select('*')
    .eq('apprenant_id', apprenantId).order('date_passation', { ascending: false })
  return data ?? []
}

export async function getLatestNiveaux(apprenantId: string): Promise<Partial<Record<DomaineCode, number>>> {
  const scores = await getScores(apprenantId)
  const latest: Partial<Record<DomaineCode, number>> = {}
  for (const s of scores) {
    if (!(s.domaine_id in latest)) latest[s.domaine_id] = s.niveau
  }
  return latest
}

export async function saveScore(s: Omit<ScoreRecord, 'id'>): Promise<void> {
  if (offline) return
  await supabase!.from('scores').insert(s)
}

// ── Affectations ──────────────────────────────────────────────

export async function getAffectations(apprenantId: string): Promise<Affectation[]> {
  if (offline) return MOCK_AFFECTATIONS.filter(a => a.apprenant_id === apprenantId)
  const { data } = await supabase!.from('affectations').select('*')
    .eq('apprenant_id', apprenantId).order('date_affectation', { ascending: false })
  return data ?? []
}

export async function createAffectation(a: Omit<Affectation, 'id'|'created_at'>): Promise<Affectation | null> {
  if (offline) return null
  const { data } = await supabase!.from('affectations').insert(a).select().single()
  return data
}

export async function updateAffectation(id: string, statut: StatutAffectation): Promise<void> {
  if (offline) return
  await supabase!.from('affectations').update({ statut, updated_at: new Date().toISOString() }).eq('id', id)
}

export async function deleteAffectation(id: string): Promise<void> {
  if (offline) return
  await supabase!.from('affectations').delete().eq('id', id)
}

// ── Sessions ──────────────────────────────────────────────────

export async function getSessions(apprenantId: string): Promise<SessionRecord[]> {
  if (offline) return []
  const { data } = await supabase!.from('sessions').select('*')
    .eq('apprenant_id', apprenantId).order('date_session', { ascending: false }).limit(20)
  return data ?? []
}

export async function saveSession(s: Omit<SessionRecord, 'id'|'created_at'>): Promise<void> {
  if (offline) { console.log('[offline] session:', s); return }
  await supabase!.from('sessions').insert(s)
}

// ── Données démo (mode offline) ────────────────────────────────

export const MOCK_APPRENANTS: ApprenantProfile[] = [
  { id:'00000000-0000-0000-0000-000000000001', prenom:'Léa',    nom:'Martin', age_mois:108, profils_tnd:['TDAH'],    niveau_classe:'CM1', actif:true, created_at: new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000002', prenom:'Thomas', nom:'Dupont', age_mois:120, profils_tnd:['TSA'],     niveau_classe:'CM2', actif:true, created_at: new Date().toISOString() },
  { id:'00000000-0000-0000-0000-000000000003', prenom:'Emma',   nom:'Petit',  age_mois:96,  profils_tnd:['DYS_LEX'],niveau_classe:'CE2', actif:true, created_at: new Date().toISOString() },
]

export const MOCK_SCORES: ScoreRecord[] = [
  { id:'s1', apprenant_id:'00000000-0000-0000-0000-000000000001', domaine_id:'ATT', niveau:2, date_passation: new Date().toISOString() },
  { id:'s2', apprenant_id:'00000000-0000-0000-0000-000000000001', domaine_id:'INH', niveau:1, date_passation: new Date().toISOString() },
  { id:'s3', apprenant_id:'00000000-0000-0000-0000-000000000001', domaine_id:'MDT', niveau:1, date_passation: new Date().toISOString() },
  { id:'s4', apprenant_id:'00000000-0000-0000-0000-000000000002', domaine_id:'FLX', niveau:1, date_passation: new Date().toISOString() },
  { id:'s5', apprenant_id:'00000000-0000-0000-0000-000000000002', domaine_id:'SEN', niveau:1, date_passation: new Date().toISOString() },
  { id:'s6', apprenant_id:'00000000-0000-0000-0000-000000000003', domaine_id:'LEC', niveau:1, date_passation: new Date().toISOString() },
  { id:'s7', apprenant_id:'00000000-0000-0000-0000-000000000003', domaine_id:'VIT', niveau:1, date_passation: new Date().toISOString() },
]

export const MOCK_EVALS: EvaluationPassee[] = [
  { id:'e1', apprenant_id:'00000000-0000-0000-0000-000000000001', evaluation_id:'EV-ATT-001', domaine_id:'ATT', titre_evaluation:'Barrage d\'étoiles 30 items', date_passation: new Date().toISOString(), score_brut:72, percentile:28, statut:'limite', created_at: new Date().toISOString() },
  { id:'e2', apprenant_id:'00000000-0000-0000-0000-000000000001', evaluation_id:'EV-INH-001', domaine_id:'INH', titre_evaluation:'Go/No-Go 40 items', date_passation: new Date().toISOString(), score_brut:55, percentile:18, statut:'clinique', created_at: new Date().toISOString() },
]

export const MOCK_AFFECTATIONS: Affectation[] = [
  { id:'af1', apprenant_id:'00000000-0000-0000-0000-000000000001', contenu_id:'PAR-TDAH', type_contenu:'parcours', titre:'Parcours TDAH — 20 semaines', domaine_id:'ATT', statut:'en_cours', date_affectation: new Date().toISOString().split('T')[0], priorite:1, created_at: new Date().toISOString() },
  { id:'af2', apprenant_id:'00000000-0000-0000-0000-000000000001', contenu_id:'EX-ATT-001', type_contenu:'exercice', titre:'Barrage d\'étoiles — 20 items', domaine_id:'ATT', statut:'affecte', date_affectation: new Date().toISOString().split('T')[0], priorite:2, created_at: new Date().toISOString() },
]

export const isOffline = offline
