import { supabase } from './supabase'
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export class ApiError extends Error { constructor(message, status) { super(message); this.status = status } }

async function request(path, { method = 'GET', body } = {}) {
  const { data } = supabase ? await supabase.auth.getSession() : { data: {} }
  const token = data?.session?.access_token
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 30000)
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method, signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    throw new ApiError(e.name === 'AbortError' ? 'The request timed out. Please retry.' : 'Cannot reach the StockShield backend. Is it running?', 0)
  } finally { clearTimeout(timer) }
  if (res.status === 204) return null
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(json?.error?.message || `Request failed (${res.status})`, res.status)
  return json
}
const enc = encodeURIComponent
export const api = {
  health: () => request('/api/health'),
  search: (q) => request(`/api/stocks/search?q=${enc(q)}`),
  quote: (s) => request(`/api/stocks/${enc(s)}/quote`),
  history: (s, p) => request(`/api/stocks/${enc(s)}/history?period=${p}`),
  analysis: (s, p) => request(`/api/stocks/${enc(s)}/analysis?period=${p}`),
  fundamentals: (s) => request(`/api/stocks/${enc(s)}/fundamentals`),
  scenario: (s, body) => request(`/api/stocks/${enc(s)}/scenario`, { method: 'POST', body }),
  saveReport: (symbol, period) => request('/api/reports', { method: 'POST', body: { symbol, period } }),
  listReports: () => request('/api/reports'),
  getReport: (id) => request(`/api/reports/${id}`),
  deleteReport: (id) => request(`/api/reports/${id}`, { method: 'DELETE' }),
}
