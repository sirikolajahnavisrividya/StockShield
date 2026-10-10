import math
import pandas as pd


def hypothetical(amount, price, decline_pct, fractional=False):
    """Educational what-if. Excludes taxes, brokerage, slippage, dividends and currency effects."""
    if amount <= 0 or price <= 0 or not (0 <= decline_pct <= 100):
        raise ValueError("amount and price must be > 0 and decline must be between 0 and 100")
    shares = amount / price if fractional else math.floor(amount / price)
    invested = shares * price
    cash = amount - invested
    value = invested * (1 - decline_pct / 100) + cash
    pl = value - amount
    return {"shares": shares, "invested": round(invested, 2), "uninvested_cash": round(cash, 2),
            "final_value": round(value, 2), "profit_loss": round(pl, 2), "profit_loss_pct": round(pl / amount * 100, 2)}


def rolling_outcomes(s: pd.Series, window_obs=21):
    """Historical outcomes of buying on every day in the data and holding `window_obs` observations."""
    if len(s) < window_obs + 20:
        return None
    r = (s.shift(-window_obs) / s - 1).dropna() * 100
    return {"holding_window_observations": window_obs, "windows_tested": int(len(r)),
            "worst_pct": round(float(r.min()), 2), "median_pct": round(float(r.median()), 2),
            "best_pct": round(float(r.max()), 2), "share_negative_pct": round(float((r < 0).mean() * 100), 1)}
