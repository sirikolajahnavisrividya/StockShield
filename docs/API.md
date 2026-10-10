# API
All routes except `/api/health` need `Authorization: Bearer <Supabase access token>`. Errors: `{"error":{"code","message"}}`.

| Method | Route | Notes |
|---|---|---|
| GET | /api/health | provider, demo flag, configuration status |
| GET | /api/stocks/search?q= | symbol search |
| GET | /api/stocks/{symbol}/quote | latest price, change, timestamp, delayed flag |
| GET | /api/stocks/{symbol}/history?period=1m\|3m\|6m\|1y\|5y | daily closes, coverage warning |
| GET | /api/stocks/{symbol}/analysis?period= | full risk report (returns, volatility, drawdown, profile, fundamentals, warnings) |
| GET | /api/stocks/{symbol}/fundamentals | company overview; missing fields are null |
| POST | /api/stocks/{symbol}/scenario | `{amount, decline_pct, period, fractional}` |
| POST/GET | /api/reports | save (recomputed server-side) / list |
| GET/DELETE | /api/reports/{id} | read / delete own report |

Status codes: 400 bad symbol, 401 not signed in, 404 no data/symbol, 422 invalid input, 429 provider/API rate limit, 502/504 provider failure, 503 not configured.
