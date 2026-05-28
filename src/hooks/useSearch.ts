// Hook de recherche avec debounce

import { useState, useEffect, useCallback } from 'react'
import { searchContenus } from '../lib/api'
import type { Contenu, SearchParams } from '../types'

export function useSearch(initialParams: SearchParams = {}) {
  const [params, setParams] = useState<SearchParams>(initialParams)
  const [results, setResults] = useState<Contenu[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const doSearch = useCallback(async (p: SearchParams) => {
    setLoading(true)
    try {
      const res = await searchContenus(p as Record<string, string | number | boolean | undefined>)
      setResults(res.items)
      setTotal(res.total)
      setError(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce sur q (texte libre)
  useEffect(() => {
    const timer = setTimeout(() => doSearch(params), params.q ? 300 : 0)
    return () => clearTimeout(timer)
  }, [params, doSearch])

  const update = useCallback((updates: Partial<SearchParams>) => {
    setParams((prev: import('../types').SearchParams) => ({ ...prev, ...updates, page: 1 }))
  }, [])

  const reset = useCallback(() => {
    setParams(initialParams)
  }, [initialParams])

  return { results, total, loading, error, params, update, reset }
}
