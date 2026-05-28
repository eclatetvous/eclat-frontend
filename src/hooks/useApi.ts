// Hook générique pour les appels API avec état loading/error/data

import { useState, useEffect, useCallback } from 'react'

interface State<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(
  fn: () => Promise<T>,
  deps: unknown[] = []
): State<T> & { refetch: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null })

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const data = await fn()
      setState({ data, loading: false, error: null })
    } catch (e) {
      setState({ data: null, loading: false, error: String(e) })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { fetch() }, [fetch])

  return { ...state, refetch: fetch }
}

// Version manuelle (déclencher sur action)
export function useApiMutation<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(async (args: TArgs): Promise<TResult | null> => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn(args)
      setLoading(false)
      return result
    } catch (e) {
      setError(String(e))
      setLoading(false)
      return null
    }
  }, [fn])

  return { mutate, loading, error }
}
