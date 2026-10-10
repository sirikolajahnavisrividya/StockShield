import { useState } from 'react'
import { api } from '../services/api'
import { validateScenarioInputs } from '../utils/validation'
import { money, pct, tone } from '../utils/format'
import { ErrorBox, Field } from './ui'

export default function Simulator({ symbol, period, currency }) {
  const [f, setF] = useState({ amount: '10000', decline: '15', fractional: false })
  const [errs, setErrs] = useState({}); const [res, setRes] = useState(null); const [err, setErr] = useState(null); const [busy, setBusy] = useState(false)
  async function run(e) {
    e.preventDefault()
    const v = validateScenarioInputs(f); setErrs(v); if (Object.keys(v).length) return
    setBusy(true); setErr(null)
    try { setRes(await api.scenario(symbol, { amount: Number(f.amount), decline_pct: Number(f.decline), period, fractional: f.fractional })) }
    catch (x) { setErr(x.message); setRes(null) } finally { setBusy(false) }
  }
  const r = res?.result, h = res?.historical_rolling
  return (
    <section className="card">
      <h3 className="mb-1 text-base font-semibold text-navy-900">Hypothetical scenario simulator</h3>
      <p className="mb-3 text-sm text-slate-600">Educational what-if only, not a prediction.</p>
      <form onSubmit={run} className="grid gap-3 md:grid-cols-4" noValidate>
        <Field id="sim-amount" label="Investment amount" error={errs.amount}><input id="sim-amount" className="input" type="number" min="0" step="any" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <Field id="sim-decline" label="Hypothetical price decline (%)" error={errs.decline}><input id="sim-decline" className="input" type="number" min="0" max="100" step="any" value={f.decline} onChange={(e) => setF({ ...f, decline: e.target.value })} /></Field>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={f.fractional} onChange={(e) => setF({ ...f, fractional: e.target.checked })} />Allow fractional shares</label>
        <div className="flex items-end"><button className="btn-primary w-full" disabled={busy}>{busy ? 'Calculating…' : 'Calculate'}</button></div>
      </form>
      {err && <div className="mt-3"><ErrorBox message={err} /></div>}
      {r && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div><p className="text-xs text-slate-500">Shares bought at {money(res.price_used, currency)} ({res.price_date})</p><p className="font-semibold">{Number(r.shares.toFixed(4))}</p></div>
            <div><p className="text-xs text-slate-500">Value after decline</p><p className="font-semibold">{money(r.final_value, currency)}</p></div>
            <div><p className="text-xs text-slate-500">Profit / loss</p><p className={`font-semibold ${tone(r.profit_loss)}`}>{money(r.profit_loss, currency)}</p></div>
            <div><p className="text-xs text-slate-500">Percentage</p><p className={`font-semibold ${tone(r.profit_loss_pct)}`}>{pct(r.profit_loss_pct)}</p></div>
          </div>
          {r.uninvested_cash > 0 && <p className="text-slate-600">Uninvested cash kept (whole shares only): {money(r.uninvested_cash, currency)}</p>}
          {h ? <p className="rounded-lg bg-slate-50 p-3">Historical rolling outcomes (buy on any day in the data, hold {h.holding_window_observations} trading days, {h.windows_tested} windows): worst {pct(h.worst_pct)}, median {pct(h.median_pct)}, best {pct(h.best_pct)}; {h.share_negative_pct}% of windows ended negative.</p>
            : <p className="text-slate-600">Not enough history for rolling-period outcomes.</p>}
          <p className="text-xs text-slate-500">{res.assumptions}</p>
        </div>)}
    </section>
  )
}
