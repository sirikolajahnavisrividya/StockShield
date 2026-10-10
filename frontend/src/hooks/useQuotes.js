import { useEffect, useState } from 'react'
import { api } from '../services/api'
// Fetch quotes for symbols one after another (gentle on provider rate limits). Missing data stays null.
export function useQuotes(symbols, refreshKey = 0) {
  const [quotes, setQuotes] = useState({})
  const [loading, setLoading] = useState(false)
  const key = [...new Set(symbols)].sort().join(',')
  useEffect(() => {
    if (!key) { setQuotes({}); return }
    let cancelled = false
    setLoading(true)
    ;(async () => {
      const out = {}
      for (const s of key.split(',')) {
        try { out[s] = { data: await api.quote(s) } } catch (e) { out[s] = { error: e.message } }
        if (cancelled) return
        setQuotes({ ...out })
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [key, refreshKey])
  return { quotes, loading }
}
