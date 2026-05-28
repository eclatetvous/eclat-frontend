
import { supabase } from './supabase'

export interface PraticienUser {
  id: string
  email: string
  nom?: string
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export async function signUp(email: string, password: string, nom?: string) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { nom } }
  })
  if (error) throw error
  return data.user
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentUser(): Promise<PraticienUser | null> {
  if (!supabase) return { id: 'offline', email: 'demo@eclat.fr', nom: 'Mode démo' }
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  return {
    id: data.user.id,
    email: data.user.email ?? '',
    nom: data.user.user_metadata?.nom,
  }
}

export function onAuthStateChange(cb: (user: PraticienUser | null) => void) {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } }
  return supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      cb({ id: session.user.id, email: session.user.email ?? '', nom: session.user.user_metadata?.nom })
    } else {
      cb(null)
    }
  })
}
