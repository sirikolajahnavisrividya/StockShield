import { AlertTriangle, Loader2, Inbox, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

export const Spinner = ({ label = 'Loading…' }) => (
  <div className="flex items-center gap-2 py-6 text-sm text-slate-600" role="status"><Loader2 className="h-4 w-4 animate-spin" />{label}</div>
)
export const Skeleton = ({ h = 'h-24' }) => <div className={`${h} animate-pulse rounded-xl bg-slate-200`} aria-hidden="true" />
export const ErrorBox = ({ message, onRetry }) => (
  <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800" role="alert">
    <AlertTriangle className="h-4 w-4 shrink-0" /><span className="flex-1">{message}</span>
    {onRetry && <button className="btn-secondary" onClick={onRetry}>Retry</button>}
  </div>
)
export const Empty = ({ title, children }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
    <Inbox className="mx-auto mb-2 h-6 w-6 text-slate-400" /><p className="font-medium text-slate-800">{title}</p>
    <div className="mt-1 text-sm text-slate-600">{children}</div>
  </div>
)
export const Field = ({ label, error, children, id }) => (
  <div><label htmlFor={id} className="label">{label}</label>{children}{error && <p className="mt-1 text-xs text-red-700">{error}</p>}</div>
)
export const Stat = ({ label, value, sub, className = '' }) => (
  <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className={`text-lg font-semibold ${className}`}>{value}</p>{sub && <p className="text-xs text-slate-500">{sub}</p>}</div>
)
export const Logo = ({ light }) => (
  <Link to="/" className={`flex items-center gap-2 font-bold ${light ? 'text-white' : 'text-navy-900'}`}><Shield className="h-6 w-6 text-blue-500" />StockShield</Link>
)
export const Disclaimer = () => (
  <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
    <strong>Disclaimer:</strong> StockShield is an educational tool. Historical performance does not guarantee future results. StockShield does not guarantee profits, prevent losses, or provide personalised financial advice.
  </p>
)
export const DemoBanner = () => (
  <div className="rounded-lg bg-amber-500 px-3 py-2 text-center text-sm font-bold text-navy-900" role="alert">DEMO DATA — NOT LIVE MARKET DATA</div>
)
