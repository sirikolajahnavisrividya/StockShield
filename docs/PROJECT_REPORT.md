# StockShield — Project Report (condensed)

## 1–4. Problem, limitations, solution, objectives
Beginners look at price alone and miss risk. Many tools show prices without explaining volatility or drawdown, or hide data gaps. StockShield analyses historical closes with standard formulas, explains results in plain English, and states what is unknown. **It assesses historical risk; it does not predict prices.**

## 5–6. Architecture and technology
React SPA ↔ FastAPI (Pandas/NumPy) ↔ Alpha Vantage; Supabase for auth and PostgreSQL. Chosen because they are widely documented, free-tier friendly and easy to explain.

## 7. Database
`profiles`, `watchlist` (unique per user+symbol), `portfolio_holdings`, `saved_reports` (JSONB). RLS policies compare `auth.uid()` with the row owner. See database/schema.sql.

## 8. API
See docs/API.md.

## 9. Formulas (simple English)
- Return % = (P1 − P0) / P0 × 100 — how much the price changed.
- Daily return = today's close / yesterday's close − 1.
- Annualised volatility = std. deviation of daily returns × √252 × 100 — how much daily returns swing, scaled to a year (252 ≈ trading days).
- Drawdown = price / highest price so far − 1; maximum drawdown = the worst such value — the biggest fall from a peak.
- Risk profile: volatility <15% lower, 15–30% moderate, ≥30% higher; drawdown >−10% lower, −10 to −25% moderate, below −25% higher; the overall label is the higher of the two. Thresholds are adjustable demonstration values.

**Sample (deterministic test data):** closes 100, 110, 99, 108.9, 98.01 → daily returns +10%, −10%, +10%, −10%; sample std = 0.11547; volatility = 0.11547 × 15.8745 × 100 ≈ 183.30%; running peak 110, final 98.01 → max drawdown ≈ −10.9%; period return −1.99%. These are asserted in backend/tests/test_risk.py.

## 10–11. Data flow and security
Login → token → every API call carries the token → backend asks Supabase to verify it → provider call (cached) → pandas calculations → JSON → charts. Details in README "Security notes".

## 12. Testing results
Run the commands in docs/TESTING.md; results are not pre-recorded here.

## 13–14. Limitations and future work
See README limitations. Future: adjusted prices, beta/Sharpe vs a benchmark, index panel, more fundamentals, server-side PDF, currency conversion, E2E browser tests.

## Likely viva questions
1. **Is this prediction?** No. It summarises past price behaviour; the app says so everywhere.
2. **Why √252?** Daily variance scales with time; ~252 trading days per year gives an annual figure.
3. **Why sample std (ddof=1)?** Our data is a sample of the stock's return history.
4. **Max drawdown vs volatility?** Volatility = typical swing size; drawdown = worst peak-to-trough loss.
5. **How is data protected?** Supabase Auth, RLS on every table, token verification on the backend, no secret keys in the frontend.
6. **Why verify the token with Supabase instead of decoding it?** Decoding alone doesn't check revocation or trust; Supabase does.
7. **What if the API fails?** Honest error or "Data unavailable"; no invented numbers.
8. **Why can low volatility still be risky?** Volatility ignores single large drops, company-specific problems and short history.
9. **Limitation of free data?** About 100 days, unadjusted for splits, delayed, small daily quota.
