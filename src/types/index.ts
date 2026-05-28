
export type TagType = 'exercice'|'evaluation'|'jeu'|'falc'|'routine'|'parcours'
export type DomaineCode = 'ATT'|'INH'|'MDT'|'FLX'|'PLN'|'ORG'|'MON'|'VIT'|'INI'|'MEL'|'MPD'|'MP'|'LAN'|'LEC'|'ECR'|'MAT'|'EMO'|'CSOC'|'META'|'RAI'|'AUTO'|'SEN'
export type TagNiveau = 'N1'|'N2'|'N3'|'N4'
export type TagTND = 'TDAH'|'TDAH_INA'|'TDAH_HYP'|'TDAH_MIX'|'TSA'|'TSA_N1'|'TSA_N2'|'DYS_LEX'|'DYS_CALC'|'DYP'|'DYP_LANG'|'HPI'|'ANXIETE'|'TDC'
export type StatutEval = 'normal'|'limite'|'clinique'
export type StatutAffectation = 'affecte'|'en_cours'|'termine'|'reporte'

export interface Tags {
  domaine: DomaineCode[]; niveau: TagNiveau[]; age: string[]
  type: TagType; duree_min: number; tnd?: TagTND[]
  objectif?: string[]; materiel?: string[]; format?: string[]; adaptation?: string[]
}
export interface Meta { version: string; created_at: string; actif: boolean }
export interface Adaptations { TDAH?: string; TSA?: string; DYS?: string; HPI?: string; SEN?: string }

export interface Contenu {
  id: string; domaine_id?: DomaineCode; domaines_ids?: DomaineCode[]
  titre: string; niveau?: number; age_min_mois?: number; age_max_mois?: number
  duree_min?: number; objectif?: string; consigne?: string; consigne_prof?: string
  materiel?: string[]; deroulement?: string[]; adaptations?: Adaptations
  critere_reussite?: string; regles_adaptees?: string; contenu?: string
  sous_type?: string; etapes?: Array<{ordre:number;texte:string;duree_sec?:number}>
  cotation?: Record<string, unknown>; protocole?: string
  tags: Tags; meta: Meta
}

export interface Domaine {
  id: DomaineCode; label: string; categorie: string
  couverture_pct: number; sous_domaines: string[]
  tnd_prioritaires: TagTND[]; definition: string; couleur: string
  relations: Array<{domaine_id: DomaineCode; force: number}>
}

export interface Phase {
  numero: number; label: string; semaines_debut: number; semaines_fin: number
  domaines: DomaineCode[]; critere_passage: string
  exercices_ids?: string[]; routines_ids?: string[]; falc_ids?: string[]
}

export interface Parcours {
  id: string; profil_id: string; titre: string
  duree_semaines: number; domaines: DomaineCode[]; phases: Phase[]
  seance_type?: Record<string, number>
}

export interface SearchParams {
  type?: TagType; domaine?: string; niveau?: string; age?: string
  tnd?: string; q?: string; duree_max?: number
  page?: number; limit?: number; sort?: string; order?: 'asc'|'desc'
}

// ── Supabase v2 ───────────────────────────────────────────────
export interface ApprenantProfile {
  id: string; prenom: string; nom?: string
  age_mois: number; date_naissance?: string
  profils_tnd: TagTND[]; niveau_classe?: string
  notes?: string; actif?: boolean; created_at: string
}

export interface EvaluationPassee {
  id: string; apprenant_id: string
  evaluation_id: string; domaine_id: DomaineCode
  titre_evaluation?: string; date_passation: string
  score_brut?: number; percentile?: number
  statut: StatutEval; notes?: string; created_at: string
}

export interface ScoreRecord {
  id: string; apprenant_id: string; domaine_id: DomaineCode
  niveau: number; score_brut?: number; date_passation: string
}

export interface Affectation {
  id: string; apprenant_id: string; contenu_id: string
  type_contenu: TagType; titre?: string; domaine_id?: string
  statut: StatutAffectation; date_affectation: string
  date_debut?: string; date_fin?: string
  notes?: string; priorite: 1|2|3; created_at: string
}

export interface SessionRecord {
  id: string; apprenant_id: string; date_session: string
  duree_min?: number; domaines_traites: DomaineCode[]
  exercices_ids: string[]; notes?: string; created_at: string
}

export interface RecommandationRequest {
  profil_tnd: TagTND[]; domaines_deficit: DomaineCode[]
  niveaux: Partial<Record<DomaineCode, number>>
  age_mois: number; contraintes?: {duree_max?: number}; historique?: string[]
}

export interface RecommandationResponse {
  exercices: Contenu[]; evaluations: Contenu[]; routines: Contenu[]
  falc: Contenu[]; jeux: Contenu[]; adaptations: string[]
  alertes: string[]; prochaine_seance: {objectif: string; preparer: string[]}
}
