# StockShield — Understand the Risk Before You Invest

Educational full-stack stock risk-analysis app (React + FastAPI + Supabase). It computes returns, annualised volatility and maximum drawdown from daily closing prices and explains them with fixed templates. **No AI/LLM is used. It does not predict prices and is not financial advice.**

## Features
Landing page · Supabase auth (register, login, logout, email verification, password reset, protected routes) · stock search · interactive price charts (1m–5y where data allows) · returns, volatility, drawdown, rule-based "Historical Risk Profile" · fundamentals (only when provided) · risk reports (save, list, delete, CSV, print/PDF) · what-if simulator · watchlist · portfolio tracker · RLS-protected storage.

## Stack and architecture
Browser (React/Vite/Tailwind/Recharts) → signs in with **Supabase Auth**; reads/writes watchlist, portfolio, profile **directly in Supabase under RLS**; calls the **FastAPI backend** (with the user's token) for market data, analysis, scenarios and saved reports. The backend verifies every token with Supabase (`/auth/v1/user`), keeps the market-data key secret, caches provider responses, and saves reports using the *user's* token so RLS still applies.

## Structure
`frontend/` React app · `backend/app/{api,core,services,schemas.py}` FastAPI · `backend/tests` pytest · `database/schema.sql` · `docs/`

## Prerequisites
Python 3.11+, Node.js 18+, a free Supabase project, a free Alpha Vantage key (https://www.alphavantage.co/support/#api-key).

## Setup (Windows Command Prompt)
**1. Supabase.** Create a project. SQL Editor → paste all of `database/schema.sql` → Run. Authentication → URL Configuration: Site URL `http://localhost:5173`, add Redirect URLs `http://localhost:5173/login` and `http://localhost:5173/reset-password`. If "Confirm email" is on (default), new users must click the emailed link before logging in. Settings → API: copy the Project URL and the public key (anon key, or `sb_publishable_...`). **Never use the service-role/secret key anywhere in this project.**

**2. Backend (terminal 1)**
```
cd StockShield\backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```
Edit `backend\.env`: set `MARKET_DATA_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. Then:
```
uvicorn app.main:app --reload --port 8000
```
Check http://127.0.0.1:8000/api/health

**3. Frontend (terminal 2)**
```
cd StockShield\frontend
npm install
copy .env.example .env
npm run dev
```
Edit `frontend\.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), restart `npm run dev`, open http://localhost:5173.

**DEMO mode (development only):** set `MARKET_DATA_PROVIDER=demo` in `backend\.env`. A deterministic synthetic series is used and every screen shows "DEMO DATA — NOT LIVE MARKET DATA". Never use it as real data.

## Tests
```
cd backend && venv\Scripts\activate && pytest
cd frontend && npm test
```
Manual end-to-end checklist: docs/TESTING.md.

## Market-data provider (Alpha Vantage) — what to know
Free tier: about 25 requests/day and 5/minute (check current limits). `TIME_SERIES_DAILY` with `compact` returns only ~100 trading days, so 6-month/1-year/5-year views will show a warning and use what is available. `full` history may need a paid plan (`ALPHAVANTAGE_OUTPUTSIZE=full`). Closes are **not split/dividend-adjusted**. Data is end-of-day/delayed. Indian stocks: BSE symbols use the `.BSE` suffix (e.g. `RELIANCE.BSE`); NSE coverage is not assumed. Market indices, debt-to-equity and operating cash flow are not supplied by the free endpoints used, so they show "Data unavailable". Each page load can use 3–4 provider calls (cached 10–30 min; fundamentals 24 h), so the daily limit is easy to hit.

## Troubleshooting
"Cannot reach backend" → backend not running / wrong `VITE_API_BASE_URL`. "Provider rate limit" (429) → wait or upgrade key. 401 from API → sign in again; check backend `SUPABASE_URL`/key match the frontend's. Login says verify email → click the emailed link. Activate-script blocked in PowerShell → use Command Prompt.

## Limitations (honest list)
Not implemented: market index panel, debt-to-equity, operating cash flow, "recently analysed" history (saved reports shown instead), realised P/L, currency conversion in portfolio totals, server-side PDF (use print-to-PDF), frontend component tests beyond validation/route guard. Not security-audited; not production-ready. In-memory cache and rate limiter reset on restart and are per-process.

## Security notes
Passwords handled only by Supabase. Only the public key is in the frontend. RLS on all four tables. Server verifies tokens via Supabase, validates symbols/periods/inputs, returns generic 500 errors, sets request timeouts, rate-limits per IP. `.env` is git-ignored.

## Disclaimer
Historical performance does not guarantee future results. StockShield does not guarantee profits, prevent losses, or provide personalised financial advice.
