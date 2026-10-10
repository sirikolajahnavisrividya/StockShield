"""Deterministic fixture: closes 100,110,99,108.9,98.01 -> daily returns +10%,-10%,+10%,-10%."""
import pandas as pd, pytest
from app.services import risk, scenario

DATES = pd.date_range("2024-01-01", periods=5, freq="D")
S = pd.Series([100, 110, 99, 108.9, 98.01], index=DATES)


def test_period_return():
    assert risk.period_return(S) == pytest.approx(-1.99, abs=1e-6)

def test_daily_returns():
    assert list(risk.daily_returns(S).round(6)) == [0.1, -0.1, 0.1, -0.1]

def test_annualised_volatility():
    # sample std = 0.115470; * sqrt(252) * 100 = 183.30
    assert risk.annualised_vol(risk.daily_returns(S), min_obs=2) == pytest.approx(183.30, abs=0.01)

def test_volatility_insufficient_data():
    assert risk.annualised_vol(risk.daily_returns(S)) is None

def test_max_drawdown():
    m = risk.max_drawdown(S)
    assert m["value"] == pytest.approx(-10.9, abs=0.01)
    assert m["peak_date"] == "2024-01-02" and m["trough_date"] == "2024-01-05"

def test_drawdown_too_short():
    assert risk.max_drawdown(S.iloc[:1]) is None

def test_clean_prices_removes_bad_and_duplicate_rows():
    pts = [{"date": "2024-01-02", "close": "10"}, {"date": "2024-01-02", "close": "11"},
           {"date": "2024-01-03", "close": "-5"}, {"date": "bad", "close": "3"}, {"date": "2024-01-04", "close": "abc"},
           {"date": "2024-01-05", "close": "12"}]
    s = risk.clean_prices(pts)
    assert list(s.values) == [11.0, 12.0]

def test_classification_rules():
    assert risk.classify(10, -5, 200)["profile"] == "Lower historical risk"
    assert risk.classify(20, -5, 200)["profile"] == "Moderate historical risk"
    assert risk.classify(10, -30, 200)["profile"] == "Higher historical risk"
    assert risk.classify(None, None, 3)["profile"] == "Insufficient data"

def test_scenario_fractional_example():
    r = scenario.hypothetical(10000, 100, 15, fractional=True)
    assert r["final_value"] == 8500 and r["profit_loss"] == -1500 and r["profit_loss_pct"] == -15

def test_scenario_whole_shares_keeps_cash():
    r = scenario.hypothetical(1000, 300, 10)  # 3 shares = 900, cash 100
    assert r["shares"] == 3 and r["final_value"] == pytest.approx(810 + 100)

def test_scenario_invalid():
    with pytest.raises(ValueError): scenario.hypothetical(-1, 10, 5)
    with pytest.raises(ValueError): scenario.hypothetical(100, 10, 150)
