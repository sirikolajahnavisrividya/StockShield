import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Save, Star, StarOff } from 'lucide-react'
import { api } from '../services/api'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../components/Toast'
import StockSearch from '../components/StockSearch'
import PriceChart from '../components/PriceChart'
import ReportView from '../components/ReportView'
import Simulator from '../components/Simulator'
import { DemoBanner, ErrorBox, Skeleton, Stat } from '../components/ui'
import { NA, arrow, dateTime, money, pct, tone } from '../utils/format'

const PERIODS = [['1m', '1 month'], ['3m', '3 months'], ['6m', '6 months'], ['1y', '1 year'], ['5y', '5 years']]

export default function StockAnalysis() {
  const { symbol: raw } = useParams()
  if (!raw) return (<div className="space-y-4"><h1 className="text-2xl font-bold text-navy-900">Stock Analysis</h1><section className="card"><StockSearch /></section></div>)
  return <Detail key={raw} symbol={decodeURIComponent(raw).toUpperCase()} />
}

function Detail({ symbol }) {
  const { user } = useAuth(); const toast = useToast()
  const [period, setPeriod] = useState(localStorage.getItem('stockshield_default_period') || '1y')
  const quote = useAsync(() => api.quote(symbol), [symbol])
  const fund = useAsync(() => api.fundamentals(symbol), [symbol])
  const hist = useAsync(() => api.history(symbol, period), [symbol, period])
  const rep = useAsync(() => api.analysis(symbol, period), [symbol, period])
  const [inList, setInList] = useState(null); const [saving, setSaving] = useState(false)
  useEffect(() => { supabase.from('watchlist').select('id').eq('symbol', symbol).maybeSingle().then(({ data }) => setInList(!!data)) }, [symbol])
  const q = quote.data, f = fund.data, currency = f?.currency || undefined

  async function toggle() {
    if (inList) { const { error } = await supabase.from('watchlist').delete().eq('symbol', symbol); if (error) return toast(error.message, 'error'); setInList(false); toast(`${symbol} removed from watchlist`) }
    else { const { error } = await supabase.from('watchlist').insert({ user_id: user.id, symbol, company_name: f?.name ?? null, exchange: f?.exchange ?? null })
      if (error && error.code !== '23505') return toast(error.message, 'error'); setInList(true); toast(`${symbol} added to watchlist`) }
  }
  async function save() {
    setSaving(true)
    try { await api.saveReport(symbol, period); toast('Report saved to your account') } catch (e) { toast(e.message, 'error') } finally { setSaving(false) }
  }
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h1 className="text-2xl font-bold text-navy-900">{f?.name || symbol}</h1>
            <p className="text-sm text-slate-600">{symbol} · {f?.exchange || 'Exchange unavailable'} · {f?.currency || 'Currency unavailable'} · {f?.sector || 'Sector unavailable'}</p></div>
          <div className="no-print flex gap-2">
            <button className="btn-secondary" onClick={toggle} disabled={inList === null}>{inList ? <><StarOff className="h-4 w-4" />Remove from watchlist</> : <><Star className="h-4 w-4" />Add to watchlist</>}</button>
            <button className="btn-primary" onClick={save} disabled={saving || !rep.data}><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save report'}</button></div></div>
        {q?.demo && <div className="mt-3"><DemoBanner /></div>}
        {quote.loading ? <div className="mt-3"><Skeleton h="h-16" /></div> : quote.error ? <div className="mt-3"><ErrorBox message={quote.error} onRetry={quote.reload} /></div> :
          <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Latest price" value={money(q.price, currency)} sub={`as of ${q.as_of || NA}${q.delayed ? ' (delayed/end-of-day)' : ''}`} />
            <Stat label="Change" value={q.change == null ? NA : `${arrow(q.change)}${money(q.change, currency)}`} className={tone(q.change)} />
            <Stat label="Change %" value={pct(q.change_pct)} className={tone(q.change_pct)} />
            <Stat label="Market cap" value={f?.market_cap ? money(f.market_cap, currency) : NA} sub={`Retrieved ${dateTime(q.fetched_at)}`} />
          </div>}
        {fund.error && <p className="mt-2 text-xs text-slate-500">Company details unavailable: {fund.error}</p>}
      </div>
      <section className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Daily closing prices</h2>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Period">{PERIODS.map(([k, l]) => <button key={k} onClick={() => setPeriod(k)} aria-pressed={period === k} className={period === k ? 'btn-primary' : 'btn-secondary'}>{l}</button>)}</div></div>
        {hist.loading ? <Skeleton h="h-72" /> : hist.error ? <ErrorBox message={hist.error} onRetry={hist.reload} /> : <>
          {hist.data.warning && <p className="mb-2 rounded bg-amber-50 p-2 text-sm text-amber-900">{hist.data.warning}</p>}
          {hist.data.points.length < 2 ? <p className="text-sm text-slate-600">Not enough price data for this period.</p> : <PriceChart points={hist.data.points} currency={currency} />}
          <p className="mt-2 text-xs text-slate-500">End-of-day closing prices only (no intraday data). Missing days are not interpolated. Source: {hist.data.provider}.</p></>}
      </section>
      {rep.loading ? <Skeleton h="h-64" /> : rep.error ? <ErrorBox message={rep.error} onRetry={rep.reload} /> : <ReportView r={rep.data} />}
      <Simulator symbol={symbol} period={period} currency={currency} />
    </div>
  )
}
