"""Statistical engine. Pure functions on a pandas Series of closing prices (DatetimeIndex)."""
import numpy as np
import pandas as pd

TRADING_DAYS = 252  # approximate number of trading days in a year
THRESHOLDS = {  # configurable demonstration thresholds, NOT universal definitions of risk
    "vol_low": 15.0, "vol_high": 30.0,
    "dd_mild": -10.0, "dd_severe": -25.0,
    "min_obs_vol": 20, "min_obs_confident": 120,
}
PERIOD_DAYS = {"1m": 30, "3m": 90, "6m": 182, "1y": 365, "5y": 1826}


def clean_prices(points) -> pd.Series:
    """Drop invalid rows (bad date, non-numeric, NaN, <=0), remove duplicate dates (keep last), sort."""
    rows = {}
    for p in points or []:
        try:
            d = pd.Timestamp(p["date"]); c = float(p["close"])
        except (KeyError, TypeError, ValueError):
            continue
        if pd.isna(d) or not np.isfinite(c) or c <= 0:
            continue
        rows[d] = c
    if not rows:
        return pd.Series(dtype=float)
    return pd.Series(rows).sort_index()


def slice_period(s: pd.Series, period: str) -> pd.Series:
    if s.empty:
        return s
    start = s.index[-1] - pd.Timedelta(days=PERIOD_DAYS[period])
    return s[s.index >= start]


def period_return(s):
    """Return (%) = (P1 - P0) / P0 * 100 using first and last observation."""
    if len(s) < 2:
        return None
    return float((s.iloc[-1] / s.iloc[0] - 1) * 100)


def window_return(s, days):
    """Return over the last `days` calendar days. None if history does not reach back far enough."""
    if len(s) < 2:
        return None
    start = s.index[-1] - pd.Timedelta(days=days)
    if s.index[0] > start + pd.Timedelta(days=5):  # 5-day tolerance for weekends/holidays
        return None
    base = s[:start]
    p0 = base.iloc[-1] if len(base) else s.iloc[0]
    return float((s.iloc[-1] / p0 - 1) * 100)


def daily_returns(s) -> pd.Series:
    """Simple daily return = today / previous close - 1 (between consecutive valid observations)."""
    return s.pct_change().dropna()


def annualised_vol(r, min_obs=None):
    """Std dev of daily returns (sample, ddof=1) * sqrt(252) * 100. None if too few observations."""
    min_obs = THRESHOLDS["min_obs_vol"] if min_obs is None else min_obs
    if len(r) < max(min_obs, 2):
        return None
    return float(r.std(ddof=1) * np.sqrt(TRADING_DAYS) * 100)


def max_drawdown(s):
    """Drawdown = price / running peak - 1. Maximum drawdown = most negative drawdown."""
    if len(s) < 2:
        return None
    dd = s / s.cummax() - 1
    trough = dd.idxmin()
    peak = s[:trough].idxmax()
    return {"value": float(dd.min() * 100), "peak_date": peak.date().isoformat(),
            "trough_date": trough.date().isoformat()}


def classify(vol, mdd, n_obs):
    t = THRESHOLDS
    names = ["lower", "moderate", "higher"]
    vol_level = None if vol is None else (0 if vol < t["vol_low"] else (1 if vol < t["vol_high"] else 2))
    dd_level = None if mdd is None else (0 if mdd > t["dd_mild"] else (1 if mdd > t["dd_severe"] else 2))
    levels = [l for l in (vol_level, dd_level) if l is not None]
    overall = "Insufficient data" if not levels else f"{names[max(levels)].capitalize()} historical risk"
    confidence = ("Insufficient" if n_obs < t["min_obs_vol"] else
                  "Limited" if n_obs < t["min_obs_confident"] else "Reasonable for the data window")
    return {"profile": overall,
            "volatility_category": None if vol_level is None else f"{names[vol_level].capitalize()} historical volatility",
            "drawdown_category": None if dd_level is None else f"{names[dd_level].capitalize()} historical drawdown",
            "data_confidence": confidence}


def explain_volatility(vol):
    if vol is None:
        return "Annualised volatility could not be calculated because there are too few daily observations."
    desc = ("have varied relatively little" if vol < THRESHOLDS["vol_low"] else
            "have varied moderately" if vol < THRESHOLDS["vol_high"] else "have varied considerably")
    return (f"Annualised historical volatility is {vol:.1f}%. This indicates that the stock's daily returns {desc} "
            "over the selected period. Historical volatility does not predict the size or direction of future price movements.")


def explain_drawdown(mdd):
    if mdd is None:
        return "Maximum drawdown could not be calculated because there are too few observations."
    return (f"The largest observed peak-to-trough decline in this dataset was {abs(mdd['value']):.1f}% "
            f"(peak on {mdd['peak_date']}, trough on {mdd['trough_date']}). Declines can be larger in the future or in longer histories.")
