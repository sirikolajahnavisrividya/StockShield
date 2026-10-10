import { Download, Printer } from 'lucide-react'
import { NA, dateTime, money, pct, tone } from '../utils/format'
import { DemoBanner, Stat } from './ui'

export function reportToCsv(r) {
  const rows = [['Field', 'Value'], ['Company', r.company_name], ['Symbol', r.symbol], ['Analysed at', r.analysed_at], ['Provider', r.provider],
    ['Data period', `${r.data_start} to ${r.data_end}`], ['Observations', r.observations], ['Latest price', r.latest_price],
    ['Period return %', r.returns.period_pct], ['1m return %', r.returns['1m_pct']], ['3m return %', r.returns['3m_pct']], ['1y return %', r.returns['1y_pct']],
    ['Annualised volatility %', r.annualised_volatility_pct], ['Max drawdown %', r.max_drawdown?.value], ['Historical risk profile', r.risk_profile.profile],
    ...r.fundamentals.map((m) => [m.label, m.available ? `${m.value}${m.unit}` : NA]), ['Summary', r.summary]]
  return rows.map((row) => row.map((c) => `"${String(c ?? NA).replace(/"/g, '""')}"`).join(',')).join('\n')
}
export function downloadCsv(r) {
  const url = URL.createObjectURL(new Blob([reportToCsv(r)], { type: 'text/csv' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `stockshield-${r.symbol}-${r.analysis_period}.csv` })
  a.click(); URL.revokeObjectURL(url)
}
const Section = ({ title, children }) => <section className="card"><h3 className="mb-3 text-base font-semibold text-navy-900">{title}</h3>{children}</section>

export default function ReportView({ r }) {
  const ret = r.returns
  return (
    <div className="space-y-4">
      {r.demo && <DemoBanner />}
      <div className="no-print flex flex-wrap gap-2">
        <button className="btn-secondary" onClick={() => downloadCsv(r)}><Download className="h-4 w-4" />Download CSV</button>
        <button className="btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print / Save as PDF</button>
      </div>
      <Section title={`Risk Report: ${r.company_name} (${r.symbol})`}>
        <p className="mb-3 text-sm text-slate-600">Analysed {dateTime(r.analysed_at)} · Provider: {r.provider} · Daily closes {r.data_start} to {r.data_end} ({r.observations} observations) · Window: {r.analysis_period}</p>
        <p className="text-sm">{r.summary}</p>
      </Section>
      <Section title="Historical returns">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Latest close" value={money(r.latest_price, r.currency)} sub={r.latest_price_date} />
          <Stat label={`Period (${r.analysis_period})`} value={pct(ret.period_pct)} className={tone(ret.period_pct)} />
          <Stat label="1 month" value={pct(ret['1m_pct'])} className={tone(ret['1m_pct'])} />
          <Stat label="3 months" value={pct(ret['3m_pct'])} className={tone(ret['3m_pct'])} />
          <Stat label="1 year" value={pct(ret['1y_pct'])} className={tone(ret['1y_pct'])} />
        </div>
        <p className="mt-3 text-xs text-slate-500">Return = (ending close − starting close) ÷ starting close × 100, using actual trading-day closes. Windows longer than the available history show "{NA}".</p>
      </Section>
      <Section title="Historical risk profile">
        <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Profile" value={r.risk_profile.profile} />
          <Stat label="Annualised volatility" value={r.annualised_volatility_pct == null ? NA : `${r.annualised_volatility_pct.toFixed(2)}%`} sub={r.risk_profile.volatility_category || ''} />
          <Stat label="Maximum drawdown" value={r.max_drawdown ? `${r.max_drawdown.value.toFixed(2)}%` : NA} sub={r.max_drawdown ? `${r.max_drawdown.peak_date} → ${r.max_drawdown.trough_date}` : ''} />
          <Stat label="Data confidence" value={r.risk_profile.data_confidence} sub={`${r.observations} daily closes`} />
        </div>
        <p className="mb-2 text-sm">{r.volatility_explanation}</p><p className="text-sm">{r.drawdown_explanation}</p>
        <p className="mt-2 text-xs text-slate-500">Volatility = standard deviation of daily returns × √{r.methodology.annualisation_days} × 100 (252 ≈ trading days per year). Thresholds ({r.methodology.thresholds.vol_low}% / {r.methodology.thresholds.vol_high}%) are configurable demonstration values, not universal definitions. Low volatility does not mean a stock is safe.</p>
      </Section>
      <Section title="Financial health indicators">
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="py-2 pr-3">Metric</th><th className="pr-3">Value</th><th>What it generally indicates</th></tr></thead>
          <tbody>{r.fundamentals.map((m) => (
            <tr key={m.key} className="border-b align-top"><td className="py-2 pr-3 font-medium">{m.label}</td>
              <td className="pr-3 whitespace-nowrap">{m.available ? `${m.value.toLocaleString()}${m.unit === '%' ? '%' : m.unit === 'x' ? 'x' : ''}` : NA}{m.available && m.as_of ? <span className="block text-xs text-slate-500">as of {m.as_of}</span> : null}</td>
              <td className="py-2 text-slate-600">{m.explanation}</td></tr>))}
            {!r.fundamentals.length && <tr><td colSpan="3" className="py-3 text-slate-600">{NA}. Price-based analysis above is still valid.</td></tr>}</tbody></table></div>
        <p className="mt-2 text-xs text-slate-500">Ratios should not be compared across unrelated industries.</p>
      </Section>
      {r.warnings.length > 0 && <Section title="Data-quality warnings"><ul className="list-disc space-y-1 pl-5 text-sm">{r.warnings.map((w) => <li key={w}>{w}</li>)}</ul></Section>}
      <Section title="Potential risk factors"><ul className="list-disc space-y-1 pl-5 text-sm">{r.risk_factors.map((w) => <li key={w}>{w}</li>)}</ul></Section>
      <Section title="Important limitations"><ul className="list-disc space-y-1 pl-5 text-sm">{r.limitations.map((w) => <li key={w}>{w}</li>)}</ul></Section>
    </div>
  )
}
