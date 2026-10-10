# Setup
See README.md → "Setup (Windows Command Prompt)". Required variables:

| File | Variable | Meaning |
|---|---|---|
| backend/.env | MARKET_DATA_PROVIDER | `alphavantage` or `demo` |
| backend/.env | MARKET_DATA_API_KEY | Alpha Vantage key (secret, backend only) |
| backend/.env | ALPHAVANTAGE_OUTPUTSIZE | `compact` (free) or `full` |
| backend/.env | SUPABASE_URL, SUPABASE_ANON_KEY | used to verify tokens and call the DB as the user. `SUPABASE_JWT_SECRET` is NOT needed. |
| frontend/.env | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY | public values, visible in the browser |
| frontend/.env | VITE_API_BASE_URL | backend address, default http://127.0.0.1:8000 |
