
import React from 'react'

interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Éclat] Erreur capturée:', error, info)
    // Sentry.captureException(error) — activé si VITE_SENTRY_DSN défini
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)', padding: 24 }}>
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #eeeae0', padding: '32px 28px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Une erreur est survenue</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 20, lineHeight: 1.6 }}>
            {this.state.error?.message ?? "L'application a rencontré un problème inattendu."}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>🔄 Recharger</button>
            <button className="btn" onClick={() => this.setState({ hasError: false })}>Réessayer</button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 16 }}>
            Si le problème persiste, vérifiez que l'API est démarrée (localhost:3000/health).
          </p>
        </div>
      </div>
    )
  }
}
