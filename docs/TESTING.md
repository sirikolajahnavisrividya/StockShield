# Testing
Automated: `pytest` (backend: formulas, cleaning, classification, scenario, API validation, missing key, provider errors using deterministic fixtures/mocks — no live API needed) and `npm test` (frontend: form validation, scenario input validation, portfolio maths, protected-route redirect). Record your own results by running them; none are claimed here.

Manual end-to-end checklist (needs real Supabase + key):
1. Register → verify email (if enabled) → log in → log out.
2. Open /app while logged out → redirected to /login.
3. Search "IBM" → open it → chart and report appear with real values.
4. Compare volatility/drawdown on the page with the formulas in docs/PROJECT_REPORT.md.
5. Add to watchlist → refresh browser → still there. Same for a portfolio holding.
6. Create a second account; confirm it sees none of the first account's rows (RLS).
7. Stop the backend or use a wrong key → friendly error messages, no fake numbers.
