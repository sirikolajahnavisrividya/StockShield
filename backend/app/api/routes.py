import re
from typing import Literal
from uuid import UUID
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from ..core.auth import User, get_current_user
from ..core.config import settings
from ..schemas import Period, ReportCreate, ScenarioRequest
from ..services import market_data as md, risk, scenario
from ..services.report import build_report, prepare

router = APIRouter(prefix="/api")
SYMBOL_RE = re.compile(r"^[A-Z0-9][A-Z0-9.\-:^]{0,19}$")


def check_symbol(symbol: str) -> str:
    s = symbol.strip().upper()
    if not SYMBOL_RE.match(s):
        raise HTTPException(400, "Invalid symbol. Use letters, digits, '.', '-' (for example AAPL or RELIANCE.BSE).")
    return s


@router.get("/health")
def health():
    return {"status": "ok", "provider": settings.provider, "demo": settings.demo,
            "market_data_configured": settings.demo or bool(settings.api_key),
            "auth_configured": bool(settings.supabase_url and settings.supabase_key)}


@router.get("/stocks/search")
def search(q: str = Query(min_length=1, max_length=50), user: User = Depends(get_current_user)):
    return md.search(q.strip())


@router.get("/stocks/{symbol}/quote")
def quote(symbol: str, user: User = Depends(get_current_user)):
    return md.quote(check_symbol(symbol))


@router.get("/stocks/{symbol}/history")
def history(symbol: str, period: Period = "1y", user: User = Depends(get_current_user)):
    raw, full, s, dropped, warning, requested, available = prepare(check_symbol(symbol), period)
    return {"symbol": symbol.upper(), "period": period, "provider": raw["provider"], "demo": raw["demo"],
            "frequency": "daily close", "requested_days": requested, "available_days": available, "warning": warning,
            "points": [{"date": d.date().isoformat(), "close": float(c)} for d, c in s.items()]}


@router.get("/stocks/{symbol}/analysis")
def analysis(symbol: str, period: Period = "1y", user: User = Depends(get_current_user)):
    return build_report(check_symbol(symbol), period)


@router.get("/stocks/{symbol}/fundamentals")
def fundamentals(symbol: str, user: User = Depends(get_current_user)):
    return md.fundamentals(check_symbol(symbol))


@router.post("/stocks/{symbol}/scenario")
def run_scenario(symbol: str, body: ScenarioRequest, user: User = Depends(get_current_user)):
    sym = check_symbol(symbol)
    raw, full, s, *_ = prepare(sym, body.period)
    price = float(full.iloc[-1])
    result = scenario.hypothetical(body.amount, price, body.decline_pct, body.fractional)
    return {"symbol": sym, "demo": raw["demo"], "price_used": price, "price_date": full.index[-1].date().isoformat(),
            "result": result, "historical_rolling": scenario.rolling_outcomes(s),
            "assumptions": "Excludes taxes, brokerage, slippage, dividends and currency changes. A hypothetical scenario is not a prediction."
                           + ("" if body.fractional else " Whole shares only; unspent cash is kept.")}


# ---- Saved reports: stored via Supabase REST using the USER's token, so Row Level Security applies ----
def _rest(method, path, user: User, **kw):
    if not settings.supabase_url:
        raise HTTPException(503, "Database is not configured.")
    headers = {"apikey": settings.supabase_key, "Authorization": f"Bearer {user.token}",
               "Content-Type": "application/json", "Prefer": "return=representation"}
    try:
        r = httpx.request(method, f"{settings.supabase_url}/rest/v1/{path}", headers=headers, timeout=10, **kw)
    except httpx.HTTPError:
        raise HTTPException(502, "Could not reach the database.")
    if r.status_code >= 400:
        raise HTTPException(502, "The database rejected the request.")
    return r.json() if r.content else []


@router.post("/reports", status_code=201)
def create_report(body: ReportCreate, user: User = Depends(get_current_user)):
    data = build_report(check_symbol(body.symbol), body.period)  # recomputed server-side; client data is never trusted
    row = {"user_id": user.id, "symbol": data["symbol"], "company_name": data["company_name"],
           "analysis_period": body.period, "report_data": data}
    return _rest("POST", "saved_reports", user, json=row)[0]


@router.get("/reports")
def list_reports(user: User = Depends(get_current_user)):
    return _rest("GET", "saved_reports?select=id,symbol,company_name,analysis_period,created_at&order=created_at.desc", user)


@router.get("/reports/{report_id}")
def get_report(report_id: UUID, user: User = Depends(get_current_user)):
    rows = _rest("GET", f"saved_reports?id=eq.{report_id}&select=*", user)
    if not rows:
        raise HTTPException(404, "Report not found.")
    return rows[0]


@router.delete("/reports/{report_id}", status_code=204)
def delete_report(report_id: UUID, user: User = Depends(get_current_user)):
    rows = _rest("DELETE", f"saved_reports?id=eq.{report_id}", user)
    if not rows:
        raise HTTPException(404, "Report not found.")
    return Response(status_code=204)
