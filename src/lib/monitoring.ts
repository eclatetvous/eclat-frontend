
// Monitoring erreurs — Sentry (activé si VITE_SENTRY_DSN est défini)
let sentryInitialized = false

export function initMonitoring() {
  const dsn = (import.meta as any).env?.VITE_SENTRY_DSN
  if (!dsn || sentryInitialized) return
  try {
    // @ts-ignore
    import('@sentry/react').then(Sentry => {
      Sentry.init({
        dsn,
        environment: (import.meta as any).env?.MODE ?? 'development',
        tracesSampleRate: 0.2,
        replaysOnErrorSampleRate: 1.0,
      })
      sentryInitialized = true
      console.log('[Éclat] Sentry monitoring activé')
    })
  } catch {}
}

export function captureError(error: Error, context?: Record<string,unknown>) {
  console.error('[Éclat]', error, context)
  if (!sentryInitialized) return
  try {
    // @ts-ignore
    import('@sentry/react').then(Sentry => {
      Sentry.captureException(error, { extra: context })
    })
  } catch {}
}
