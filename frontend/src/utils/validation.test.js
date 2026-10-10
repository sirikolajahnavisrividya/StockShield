import { describe, it, expect } from 'vitest'
import { validateAuth, validateScenarioInputs, holdingMetrics } from './validation'

describe('auth form validation', () => {
  it('rejects bad email and short password', () => {
    const e = validateAuth({ email: 'x', password: '123' }, 'login')
    expect(e.email).toBeTruthy(); expect(e.password).toBeTruthy()
  })
  it('register needs matching passwords and a name', () => {
    const e = validateAuth({ email: 'a@b.co', password: 'longenough', confirm: 'different', displayName: '' }, 'register')
    expect(e.confirm).toBeTruthy(); expect(e.displayName).toBeTruthy()
  })
  it('accepts valid login', () => expect(validateAuth({ email: 'a@b.co', password: 'longenough' }, 'login')).toEqual({}))
})
describe('scenario input validation', () => {
  it('flags invalid values', () => {
    expect(validateScenarioInputs({ amount: '0', decline: '15' }).amount).toBeTruthy()
    expect(validateScenarioInputs({ amount: '100', decline: '150' }).decline).toBeTruthy()
  })
  it('accepts valid values', () => expect(validateScenarioInputs({ amount: '10000', decline: '15' })).toEqual({}))
})
describe('portfolio maths', () => {
  const h = { purchase_price: 100, quantity: 10, transaction_costs: 20 }
  it('computes unrealised gain', () => {
    const m = holdingMetrics(h, 120)
    expect(m.cost).toBe(1020); expect(m.value).toBe(1200); expect(m.gain).toBe(180)
  })
  it('does not substitute purchase price when price is missing', () => {
    const m = holdingMetrics(h, null); expect(m.value).toBeNull(); expect(m.gain).toBeNull()
  })
})
