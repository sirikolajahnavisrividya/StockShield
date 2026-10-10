import { useCallback, useEffect, useState } from 'react'
// Runs an async function, tracks loading/error, ignores stale responses.
export function useAsync(fn, deps, enabled = true) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    fn().then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((e) => !cancelled && setState({ data: null, error: e.message, loading: false }))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, enabled])
  return { ...state, reload: useCallback(() => setTick((t) => t + 1), []) }
}
