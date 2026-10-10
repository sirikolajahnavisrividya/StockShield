import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { useQuotes } from '../hooks/useQuotes'
import { supabase } from '../services/supabase'
import { api } from '../services/api'
import StockSearch from '../components/StockSearch'
import { Empty, ErrorBox, Skeleton } from '../components/ui'
import { dateTime, money, pct, tone, arrow } from '../utils/format'
import { holdingMetrics } from '../utils/validation'

export default function Overview() {
  const { user } = useAuth()
  const wl = useAsync(async () => { const { data, error } = await supabase.from('watchlist').select('*').order('created_at', { ascending: false }).limit(5); if (error) throw error; return data }, [])
  const pf = useAsync(async () => { const { data, error } = await supabase.from('portfolio_holdings').select('*'); if (error) throw error; return data }, [])
  const rp = useAsync(() => api.listReports(), [])
  const syms = [...(wl.data || []).map((w) => w.symbol), ...(pf.data || []).map((h) => h.symbol)]
  const { quotes } = useQuotes(syms)
  const totals = (pf.data || []).reduce((a, h) => { const m = holdingMetrics(h, quotes[h.symbol]?.data?.price ?? null); a.cost += m.cost; if (m.value != null) { a.value += m.value; a.costValued += m.cost; a.valued++ } return a }, { cost: 0, value: 0, costValued: 0, valued: 0 })
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-navy-900">Welcome{user?.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ''}</h1>
      <section className="card"><h2 className="mb-3 font-semibold">Search for stocks</h2><StockSearch /></section>
      <section className="card"><h2 className="mb-2 font-semibold">Market overview</h2><p className="text-sm text-slate-600">Market index values are not available from the configured data provider, so none are shown. StockShield never displays invented index values.</p></section>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card"><div className="mb-2 flex justify-between"><h2 className="font-semibold">Watchlist</h2><Link to="/app/watchlist" className="text-sm text-blue-700 underline">View all</Link></div>
          {wl.loading ? <Skeleton /> : wl.error ? <ErrorBox message={wl.error} onRetry={wl.reload} /> : !wl.data.length ? <Empty title="Your watchlist is empty">Search for a stock and add it to track it here.</Empty> :
            <ul className="divide-y">{wl.data.map((w) => { const q = quotes[w.symbol]; return <li key={w.id} className="flex justify-between py-2 text-sm"><Link className="font-medium text-blue-700" to={`/app/analysis/${encodeURIComponent(w.symbol)}`}>{w.symbol}</Link>
              <span className={tone(q?.data?.change_pct)}>{q?.data ? `${money(q.data.price)} ${arrow(q.data.change_pct)}${pct(q.data.change_pct)}` : q?.error ? 'Price unavailable' : 'Loading…'}</span></li> })}</ul>}</section>
        <section className="card"><div className="mb-2 flex justify-between"><h2 className="font-semibold">Portfolio summary</h2><Link to="/app/portfolio" className="text-sm text-blue-700 underline">Open</Link></div>
          {pf.loading ? <Skeleton /> : pf.error ? <ErrorBox message={pf.error} onRetry={pf.reload} /> : !pf.data.length ? <Empty title="No holdings recorded">Add a holding in My Portfolio.</Empty> :
            <div className="space-y-1 text-sm"><p>Holdings: {pf.data.length}</p><p>Recorded purchase cost: {money(totals.cost)}</p>
              {totals.valued === pf.data.length ? <p>Current value: {money(totals.value)} · Unrealised: <span className={tone(totals.value - totals.cost)}>{money(totals.value - totals.cost)}</span></p> : <p className="text-slate-600">Current valuation unavailable for {pf.data.length - totals.valued} holding(s).</p>}</div>}</section>
      </div>
      <section className="card"><h2 className="mb-2 font-semibold">Recently saved reports</h2>
        {rp.loading ? <Skeleton h="h-16" /> : rp.error ? <ErrorBox message={rp.error} onRetry={rp.reload} /> : !rp.data.length ? <Empty title="No saved reports yet">Open a stock analysis and choose "Save report".</Empty> :
          <ul className="divide-y">{rp.data.slice(0, 5).map((r) => <li key={r.id} className="flex justify-between py-2 text-sm"><Link className="font-medium text-blue-700" to={`/app/reports/${r.id}`}>{r.symbol} · {r.analysis_period}</Link><span className="text-slate-500">{dateTime(r.created_at)}</span></li>)}</ul>}</section>
    </div>
  )
}
