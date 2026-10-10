import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { supabase } from '../services/supabase'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { useQuotes } from '../hooks/useQuotes'
import { useToast } from '../components/Toast'
import { Empty, ErrorBox, Field, Skeleton, Stat } from '../components/ui'
import { NA, money, pct, tone } from '../utils/format'
import { holdingMetrics, validateHolding } from '../utils/validation'

const BLANK = { symbol: '', purchase_date: '', purchase_price: '', quantity: '', transaction_costs: '' }

export default function Portfolio() {
  const { user } = useAuth(); const toast = useToast()
  const list = useAsync(async () => { const { data, error } = await supabase.from('portfolio_holdings').select('*').order('purchase_date', { ascending: false }); if (error) throw error; return data }, [])
  const { quotes } = useQuotes((list.data || []).map((h) => h.symbol))
  const [f, setF] = useState(BLANK); const [editing, setEditing] = useState(null); const [errs, setErrs] = useState({}); const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  async function submit(e) {
    e.preventDefault(); const v = validateHolding(f); setErrs(v); if (Object.keys(v).length) return
    const row = { symbol: f.symbol.trim().toUpperCase(), purchase_date: f.purchase_date, purchase_price: Number(f.purchase_price), quantity: Number(f.quantity), transaction_costs: Number(f.transaction_costs || 0) }
    setBusy(true)
    const { error } = editing ? await supabase.from('portfolio_holdings').update(row).eq('id', editing) : await supabase.from('portfolio_holdings').insert({ ...row, user_id: user.id })
    setBusy(false)
    if (error) return toast(error.message, 'error')
    toast(editing ? 'Holding updated' : 'Holding added'); setF(BLANK); setEditing(null); list.reload()
  }
  async function del(id) { if (!window.confirm('Delete this holding?')) return; const { error } = await supabase.from('portfolio_holdings').delete().eq('id', id); if (error) toast(error.message, 'error'); else { toast('Holding deleted'); list.reload() } }
  const rows = (list.data || []).map((h) => ({ h, m: holdingMetrics(h, quotes[h.symbol]?.data?.price ?? null), q: quotes[h.symbol] }))
  const cost = rows.reduce((a, r) => a + r.m.cost, 0)
  const allValued = rows.length > 0 && rows.every((r) => r.m.value != null)
  const value = rows.reduce((a, r) => a + (r.m.value ?? 0), 0)
  return (<div className="space-y-4"><h1 className="text-2xl font-bold text-navy-900">My Portfolio</h1>
    <form onSubmit={submit} className="card grid gap-3 md:grid-cols-6" noValidate>
      <Field id="p-sym" label="Symbol" error={errs.symbol}><input id="p-sym" className="input" value={f.symbol} onChange={set('symbol')} /></Field>
      <Field id="p-date" label="Purchase date" error={errs.purchase_date}><input id="p-date" type="date" className="input" value={f.purchase_date} onChange={set('purchase_date')} /></Field>
      <Field id="p-price" label="Purchase price" error={errs.purchase_price}><input id="p-price" type="number" step="any" className="input" value={f.purchase_price} onChange={set('purchase_price')} /></Field>
      <Field id="p-qty" label="Shares" error={errs.quantity}><input id="p-qty" type="number" step="any" className="input" value={f.quantity} onChange={set('quantity')} /></Field>
      <Field id="p-cost" label="Transaction costs (optional)" error={errs.transaction_costs}><input id="p-cost" type="number" step="any" className="input" value={f.transaction_costs} onChange={set('transaction_costs')} /></Field>
      <div className="flex items-end gap-2"><button className="btn-primary" disabled={busy}>{editing ? 'Update' : 'Add holding'}</button>{editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setF(BLANK) }}>Cancel</button>}</div></form>
    {list.loading ? <Skeleton /> : list.error ? <ErrorBox message={list.error} onRetry={list.reload} /> : !rows.length ? <Empty title="No holdings yet">Record a purchase above to track unrealised gain or loss.</Empty> : <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="Recorded purchase cost" value={money(cost)} />
        <Stat label="Current market value" value={allValued ? money(value) : 'Current valuation unavailable'} />
        <Stat label="Unrealised gain/loss" value={allValued ? money(value - cost) : NA} className={allValued ? tone(value - cost) : ''} />
        <Stat label="Unrealised %" value={allValued ? pct(((value - cost) / cost) * 100) : NA} className={allValued ? tone(value - cost) : ''} /></div>
      <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-2">Symbol</th><th>Bought</th><th>Shares</th><th>Cost</th><th>Value</th><th>Unrealised</th><th /></tr></thead><tbody>
        {rows.map(({ h, m, q }) => (<tr key={h.id} className="border-b"><td className="py-2 font-semibold">{h.symbol}</td><td>{h.purchase_date} @ {money(Number(h.purchase_price))}</td><td>{Number(h.quantity)}</td><td>{money(m.cost)}</td>
          <td>{m.value != null ? money(m.value) : q?.error ? 'Current valuation unavailable' : '…'}</td>
          <td className={tone(m.gain)}>{m.gain != null ? `${money(m.gain)} (${pct(m.gainPct)})` : NA}</td>
          <td className="whitespace-nowrap"><button className="btn-secondary mr-1" aria-label={`Edit ${h.symbol}`} onClick={() => { setEditing(h.id); setF({ symbol: h.symbol, purchase_date: h.purchase_date, purchase_price: h.purchase_price, quantity: h.quantity, transaction_costs: h.transaction_costs }) }}><Pencil className="h-4 w-4" /></button>
            <button className="btn-danger" aria-label={`Delete ${h.symbol}`} onClick={() => del(h.id)}><Trash2 className="h-4 w-4" /></button></td></tr>))}</tbody></table></div></>}
    <p className="text-xs text-slate-500">All figures are unrealised (positions are not sold). Realised gains are not tracked. Cost = price × shares + recorded costs. Values use each stock's own currency without conversion. This is not a brokerage-linked portfolio.</p></div>)
}
