"""Market-data service (primary provider: Alpha Vantage). Normalises responses, caches, and never fakes data.
DEMO mode (MARKET_DATA_PROVIDER=demo) returns a deterministic synthetic series that is always flagged demo=True."""
import threading, time, zlib
from datetime import datetime, timezone
import httpx
import numpy as np
import pandas as pd
from ..core.config import settings

AV_URL = "https://www.alphavantage.co/query"
_cache: dict = {}
_locks: dict = {}
_glock = threading.Lock()


class MarketDataError(Exception):
    def __init__(self, status: int, code: str, message: str):
        super().__init__(message); self.status, self.code, self.message = status, code, message


def clear_cache(): _cache.clear()


def _cached(key, ttl, fn):
    with _glock:
        lock = _locks.setdefault(key, threading.Lock())
    with lock:  # one provider request per key even if two endpoints ask at once
        hit = _cache.get(key)
        if hit and time.time() - hit[0] < ttl:
            return hit[1]
        val = fn()
        _cache[key] = (time.time(), val)
        return val


def _now(): return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _av(params):
    if not settings.api_key:
        raise MarketDataError(503, "not_configured",
                              "No market-data API key is configured. Set MARKET_DATA_API_KEY in backend/.env (see docs/SETUP.md).")
    try:
        r = httpx.get(AV_URL, params={**params, "apikey": settings.api_key}, timeout=10)
    except httpx.TimeoutException:
        raise MarketDataError(504, "provider_timeout", "The market-data provider timed out. Please retry.")
    except httpx.HTTPError:
        raise MarketDataError(502, "provider_unreachable", "Could not reach the market-data provider.")
    if r.status_code != 200:
        raise MarketDataError(502, "provider_error", f"Market-data provider returned HTTP {r.status_code}.")
    try:
        data = r.json()
    except ValueError:
        raise MarketDataError(502, "malformed", "Market-data provider returned a malformed response.")
    if not isinstance(data, dict):
        raise MarketDataError(502, "malformed", "Market-data provider returned an unexpected response.")
    if "Error Message" in data:
        raise MarketDataError(404, "invalid_symbol", "Symbol not found at the market-data provider.")
    if "Note" in data or "Information" in data:
        raise MarketDataError(429, "rate_limited", "Provider rate limit reached, or this data needs a paid plan. Try again later.")
    return data


def _num(v):
    try:
        f = float(v)
        return f if np.isfinite(f) else None
    except (TypeError, ValueError):
        return None


# ---------------- DEMO ----------------
def _demo_series(symbol):
    rng = np.random.default_rng(zlib.crc32(symbol.encode()))
    dates = pd.bdate_range(end=pd.Timestamp("2025-12-31"), periods=1300)
    prices = 100 * np.cumprod(1 + rng.normal(0.0004, 0.015, len(dates)))
    return [{"date": d.date().isoformat(), "close": round(float(p), 2)} for d, p in zip(dates, prices)]


# ---------------- Public API ----------------
def search(q: str):
    if settings.demo:
        return {"demo": True, "provider": "demo", "results": [{"symbol": q.upper(), "name": f"{q.upper()} (demo sample)", "region": "DEMO", "currency": "USD"}]}
    def fetch():
        d = _av({"function": "SYMBOL_SEARCH", "keywords": q})
        res = [{"symbol": m.get("1. symbol"), "name": m.get("2. name"), "type": m.get("3. type"),
                "region": m.get("4. region"), "currency": m.get("8. currency")} for m in d.get("bestMatches", [])]
        return {"demo": False, "provider": "alphavantage", "results": res}
    return _cached(("search", q.lower()), 3600, fetch)


def daily_series(symbol):
    """Returns {points:[{date,close}], demo, provider, fetched_at}. Closes are NOT split-adjusted on the free tier."""
    if settings.demo:
        return {"points": _demo_series(symbol), "demo": True, "provider": "demo", "fetched_at": _now()}
    def fetch():
        d = _av({"function": "TIME_SERIES_DAILY", "symbol": symbol, "outputsize": settings.outputsize})
        ts = d.get("Time Series (Daily)")
        if not ts:
            raise MarketDataError(404, "no_data", "No daily price data was returned for this symbol.")
        pts = [{"date": k, "close": v.get("4. close")} for k, v in ts.items()]
        return {"points": pts, "demo": False, "provider": "alphavantage", "fetched_at": _now()}
    return _cached(("daily", symbol, settings.outputsize), 1800, fetch)


def quote(symbol):
    if settings.demo:
        pts = _demo_series(symbol)[-2:]
        p, prev = pts[1]["close"], pts[0]["close"]
        return {"symbol": symbol, "price": p, "change": round(p - prev, 2), "change_pct": round((p / prev - 1) * 100, 2),
                "as_of": pts[1]["date"], "fetched_at": _now(), "demo": True, "provider": "demo", "delayed": False}
    def fetch():
        g = _av({"function": "GLOBAL_QUOTE", "symbol": symbol}).get("Global Quote") or {}
        price = _num(g.get("05. price"))
        if price is None:
            raise MarketDataError(404, "no_data", "No quote is available for this symbol.")
        cp = (g.get("10. change percent") or "").replace("%", "")
        return {"symbol": symbol, "price": price, "change": _num(g.get("09. change")), "change_pct": _num(cp),
                "as_of": g.get("07. latest trading day"), "fetched_at": _now(), "demo": False,
                "provider": "alphavantage", "delayed": True}
    return _cached(("quote", symbol), 600, fetch)


def fundamentals(symbol):
    """Raw company overview. Fields the provider does not give are None (shown as 'Data unavailable')."""
    if settings.demo:
        return {"symbol": symbol, "name": f"{symbol} (demo sample)", "exchange": None, "currency": "USD", "sector": None,
                "as_of": None, "demo": True, "provider": "demo", "market_cap": None, "pe": None, "profit_margin": None,
                "dividend_yield": None, "revenue_growth": None, "earnings_growth": None}
    def fetch():
        o = _av({"function": "OVERVIEW", "symbol": symbol})
        if not o.get("Symbol"):
            raise MarketDataError(404, "no_data", "No company overview is available for this symbol.")
        return {"symbol": symbol, "name": o.get("Name"), "exchange": o.get("Exchange"), "currency": o.get("Currency"),
                "sector": o.get("Sector"), "as_of": o.get("LatestQuarter"), "demo": False, "provider": "alphavantage",
                "market_cap": _num(o.get("MarketCapitalization")), "pe": _num(o.get("PERatio")),
                "profit_margin": _num(o.get("ProfitMargin")), "dividend_yield": _num(o.get("DividendYield")),
                "revenue_growth": _num(o.get("QuarterlyRevenueGrowthYOY")), "earnings_growth": _num(o.get("QuarterlyEarningsGrowthYOY"))}
    return _cached(("fund", symbol), 86400, fetch)
