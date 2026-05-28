import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Layout from './components/shared/Layout'
import DashboardPraticien from './components/praticien/DashboardPraticien'
import DashboardApprenant from './components/apprenant/DashboardApprenant'
import LoginPage from './components/auth/LoginPage'
import EspaceParents from './components/parents/EspaceParents'
import { getCurrentUser, onAuthStateChange } from './lib/auth'
import { isOffline } from './lib/supabase'
import { initMonitoring } from './lib/monitoring'
import type { PraticienUser } from './lib/auth'

// Initialiser Sentry si configuré
initMonitoring()

type AppMode = 'praticien' | 'apprenant' | 'parents'

// Détecter le mode parents via URL
function detectMode(): AppMode {
  const params = new URLSearchParams(window.location.search)
  if (params.has('token')) return 'parents'
  return 'praticien'
}

export default function App() {
  const [mode, setMode]       = useState<AppMode>(detectMode)
  const [user, setUser]       = useState<PraticienUser | null>(null)
  const [authLoaded, setAuthLoaded] = useState(false)

  useEffect(() => {
    getCurrentUser().then(u => {
      setUser(u); setAuthLoaded(true)
    })
    const { data } = onAuthStateChange(u => setUser(u))
    return () => data.subscription.unsubscribe()
  }, [])

  // Espace parents — pas besoin d'auth
  if (mode === 'parents') {
    return (
      <ErrorBoundary>
        <Toaster position="top-right" />
        <EspaceParents />
      </ErrorBoundary>
    )
  }

  // Auth — afficher login si pas connecté (sauf mode offline)
  if (!authLoaded) {
    return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--gray-50)', color:'var(--gray-400)', fontSize:14 }}>Chargement…</div>
  }

  if (!user && !isOffline) {
    return (
      <ErrorBoundary>
        <Toaster position="top-right" />
        <LoginPage onLogin={() => getCurrentUser().then(setUser)} />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-right" toastOptions={{ className: '', style: { borderRadius: 10, fontFamily: 'system-ui,sans-serif', fontSize: 13 } }} />
      <Layout
        mode={mode}
        onModeChange={setMode}
        user={user}
      >
        <main id="main-content" tabIndex={-1}>
          {mode === 'praticien' && <DashboardPraticien user={user} />}
          {mode === 'apprenant' && <DashboardApprenant />}
        </main>
      </Layout>
    </ErrorBoundary>
  )
}
