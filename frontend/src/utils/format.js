export const NA = 'Data unavailable'
export function money(v, currency) {
  if (v == null || Number.isNaN(v)) return NA
  try { return new Intl.NumberFormat(undefined, currency ? { style: 'currency', currency } : { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) }
  catch { return Number(v).toFixed(2) }
}
export const pct = (v, d = 2) => (v == null || Number.isNaN(v) ? NA : `${v > 0 ? '+' : ''}${Number(v).toFixed(d)}%`)
export const dateTime = (s) => (s ? new Date(s).toLocaleString() : NA)
export const tone = (v) => (v == null ? 'text-slate-600' : v > 0 ? 'text-green-700' : v < 0 ? 'text-red-700' : 'text-slate-700')
export const arrow = (v) => (v == null ? '' : v > 0 ? '▲ ' : v < 0 ? '▼ ' : '')
