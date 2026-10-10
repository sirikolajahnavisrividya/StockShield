from typing import Literal
from pydantic import BaseModel, Field

Period = Literal["1m", "3m", "6m", "1y", "5y"]


class ScenarioRequest(BaseModel):
    amount: float = Field(gt=0, le=1e9)
    decline_pct: float = Field(default=0, ge=0, le=100)
    period: Period = "1y"
    fractional: bool = False


class ReportCreate(BaseModel):
    symbol: str = Field(min_length=1, max_length=20)
    period: Period = "1y"
