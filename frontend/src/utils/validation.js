const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function validateAuth({ email, password, displayName, confirm }, mode) {
  const e = {}
  if (!EMAIL.test(email || '')) e.email = 'Enter a valid email address.'
  if (mode !== 'reset-request') {
    if (!password || password.length < 8) e.password = 'Password must be at least 8 characters.'
    if (mode === 'register') {
      if (!displayName || !displayName.trim()) e.displayName = 'Enter a display name.'
      if (confirm !== password) e.confirm = 'Passwords do not match.'
    }
  }
  return e
}
export function validateScenarioInputs({ amount, decline }) {
  const e = {}
  const a = Number(amount), d = Number(decline)
  if (amount === '' || !(a > 0)) e.amount = 'Enter an amount greater than 0.'
  if (decline === '' || Number.isNaN(d) || d < 0 || d > 100) e.decline = 'Decline must be between 0 and 100.'
  return e
}
export const validSymbol = (s) => /^[A-Za-z0-9][A-Za-z0-9.\-:^]{0,19}$/.test((s || '').trim())
export function validateHolding(h) {
  const e = {}
  if (!validSymbol(h.symbol)) e.symbol = 'Enter a valid symbol.'
  if (!h.purchase_date || new Date(h.purchase_date) > new Date()) e.purchase_date = 'Enter a past or current date.'
  if (!(Number(h.purchase_price) > 0)) e.purchase_price = 'Price must be greater than 0.'
  if (!(Number(h.quantity) > 0)) e.quantity = 'Quantity must be greater than 0.'
  if (h.transaction_costs !== '' && Number(h.transaction_costs) < 0) e.transaction_costs = 'Costs cannot be negative.'
  return e
}
// Purchase cost = price x qty + costs; value = latest price x qty; unrealised = value - cost
export function holdingMetrics(h, latestPrice) {
  const cost = Number(h.purchase_price) * Number(h.quantity) + Number(h.transaction_costs || 0)
  if (latestPrice == null) return { cost, value: null, gain: null, gainPct: null }
  const value = latestPrice * Number(h.quantity)
  const gain = value - cost
  return { cost, value, gain, gainPct: cost > 0 ? (gain / cost) * 100 : null }
}
