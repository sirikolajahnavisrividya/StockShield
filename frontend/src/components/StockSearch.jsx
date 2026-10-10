import { useState } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { ErrorBox } from './ui'

export default function StockSearch() {
  const [q, setQ] = useState(''); const [results, setResults] = useState(null)
  const [error, setError] = useState(null); const [busy, setBusy] = useState(false)
  const nav = useNavigate()
  async function submit(e) {
    e.preventDefault()
    if (!q.trim()) { setError('Enter a company name or ticker.'); return }
    setBusy(true); setError(null); setResults(null)
    try { const r = await api.search(q.trim()); setResults(r.results); if (!r.results.length) setError('No matching stocks found. Check the spelling or try a ticker (Indian stocks: use the .BSE suffix, e.g. RELIANCE.BSE).') }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return (
    <div>
      <form onSubmit={submit} className="flex gap-2" role="search">
        <label htmlFor="stock-q" className="sr-only">Search stocks by company name or ticker</label>
        <input id="stock-q" className="input" placeholder="Search company or ticker, e.g. Apple, AAPL, RELIANCE.BSE" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-primary" disabled={busy}><Search className="h-4 w-4" />{busy ? 'Searching…' : 'Search'}</button>
      </form>
      {error && <div className="mt-3"><ErrorBox message={error} /></div>}
      {results?.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {results.map((r) => (
            <li key={r.symbol}><button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50" onClick={() => nav(`/app/analysis/${encodeURIComponent(r.symbol)}`)}>
              <span><span className="font-semibold">{r.symbol}</span> <span className="text-sm text-slate-600">{r.name}</span></span>
              <span className="text-xs text-slate-500">{[r.region, r.currency].filter(Boolean).join(' · ')}</span></button></li>
          ))}
        </ul>
      )}
    </div>
  )
}
