import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { useQuotes } from '../hooks/useQuotes'
import { useToast } from '../components/Toast'
import { Empty, ErrorBox, Skeleton } from '../components/ui'
import { arrow, dateTime, money, pct, tone } from '../utils/format'
import { validSymbol } from '../utils/validation'

export default function Watchlist() {
  const { user } = useAuth(); const toast = useToast()
  const list = useAsync(async () => { const { data, error } = await supabase.from('watchlist').select('*').order('created_at', { ascending: false }); if (error) throw error; return data }, [])
  const [refresh, setRefresh] = useState(0)
  const { quotes, loading } = useQuotes((list.data || []).map((w) => w.symbol), refresh)
  const [sym, setSym] = useState(''); const [busy, setBusy] = useState(false)
  async function add(e) {
    e.preventDefault(); const s = sym.trim().toUpperCase()
    if (!validSymbol(s)) return toast('Enter a valid symbol, e.g. AAPL or RELIANCE.BSE', 'error')
    setBusy(true)
    try {
      await api.quote(s) // confirms the symbol exists before saving
      const { error } = await supabase.from('watchlist').insert({ user_id: user.id, symbol: s })
      if (error) toast(error.code === '23505' ? `${s} is already in your watchlist` : error.message, 'error')
      else { toast(`${s} added`); setSym(''); list.reload() }
    } catch (x) { toast(`Could not add ${s}: ${x.message}`, 'error') } finally { setBusy(false) }
  }
  async function remove(id, s) { const { error } = await supabase.from('watchlist').delete().eq('id', id); if (error) toast(error.message, 'error'); else { toast(`${s} removed`); list.reload() } }
  return (<div className="space-y-4"><div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-navy-900">Watchlist</h1>
    <button className="btn-secondary" onClick={() => setRefresh((x) => x + 1)} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh prices</button></div>
    <form onSubmit={add} className="card flex gap-2"><label htmlFor="wl-sym" className="sr-only">Symbol</label><input id="wl-sym" className="input" placeholder="Add a symbol, e.g. AAPL" value={sym} onChange={(e) => setSym(e.target.value)} /><button className="btn-primary" disabled={busy}>{busy ? 'Checking…' : 'Add'}</button></form>
    {list.loading ? <Skeleton /> : list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : !list.data.length ? <Empty title="Your watchlist is empty">Add a symbol above, or open a stock and choose "Add to watchlist".</Empty> :
      <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-2">Symbol</th><th>Price</th><th>Change</th><th>Retrieved</th><th /></tr></thead><tbody>
        {list.data.map((w) => { const q = quotes[w.symbol]; return (<tr key={w.id} className="border-b"><td className="py-2"><Link className="font-semibold text-blue-700" to={`/app/analysis/${encodeURIComponent(w.symbol)}`}>{w.symbol}</Link><span className="block text-xs text-slate-500">{w.company_name}</span></td>
          <td>{q?.data ? money(q.data.price) : q?.error ? 'Unavailable' : '…'}</td><td className={tone(q?.data?.change_pct)}>{q?.data ? `${arrow(q.data.change_pct)}${pct(q.data.change_pct)}` : q?.error ? <span className="text-xs text-slate-500" title={q.error}>{q.error.slice(0, 40)}</span> : '…'}</td>
          <td className="text-xs text-slate-500">{q?.data ? dateTime(q.data.fetched_at) : ''}</td>
          <td><button className="btn-danger" aria-label={`Remove ${w.symbol}`} onClick={() => remove(w.id, w.symbol)}><Trash2 className="h-4 w-4" /></button></td></tr>) })}</tbody></table></div>}
    <p className="text-xs text-slate-500">Prices come from the configured provider, may be delayed, and free API keys have small daily limits.</p></div>)
}
