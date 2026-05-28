
import type {
  Domaine, Contenu, Parcours, Phase,
  RecommandationRequest, RecommandationResponse,
} from '../types'

const API = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3000'

async function call<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error ?? 'Erreur API')
  return json.data as T
}

export const getDomaines    = () => call<Domaine[]>('/api/domaines')
export const getDomaine     = (id: string) => call<Domaine>(`/api/domaines/${id}`)

export const searchContenus = (
  params: Record<string, string | number | boolean | undefined>
) => {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') q.set(k, String(v))
  })
  return call<{ items: Contenu[]; total: number; page: number; pages: number }>(
    `/api/contenus?${q}`
  )
}

export const searchAdvanced = (body: object) =>
  call<{ items: Contenu[]; total: number }>(
    '/api/contenus/search', { method: 'POST', body: JSON.stringify(body) }
  )

export const getContenu  = (id: string)    => call<Contenu>(`/api/contenus/${id}`)
export const getRelated  = (id: string)    => call<Contenu[]>(`/api/contenus/${id}/related`)
export const suggest     = (q: string)     =>
  call<Array<{ id: string; titre: string; type: string }>>(
    `/api/contenus/suggest?q=${encodeURIComponent(q)}`
  )

export const getParcours    = ()           => call<Parcours[]>('/api/parcours')
export const getOneParcours = (id: string) => call<Parcours>(`/api/parcours/${id}`)
export const getPhase       = (pid: string, num: number) =>
  call<Phase & { exercices: Contenu[]; routines: Contenu[]; falc: Contenu[] }>(
    `/api/parcours/${pid}/phase/${num}`
  )

export const recommander = (body: RecommandationRequest) =>
  call<RecommandationResponse>(
    '/api/recommandations', { method: 'POST', body: JSON.stringify(body) }
  )

export const getStats = () => call<{
  domaines: number; exercices: number; evaluations: number; jeux: number
  falc: number; routines: number; parcours: number; total: number
  loadedAt: string; index: { total: number }
}>('/api/meta/stats')

export const getTaxonomie = () =>
  call<Record<string, string[]>>('/api/meta/taxonomie')
