"""Public response contracts, also used by the generated OpenAPI reference."""

from typing import Literal

from pydantic import BaseModel, Field


class Metrics(BaseModel):
    count: int
    mae: float | None
    rmse: float | None
    bias: float | None
    p90: float | None
    mape: float | None
    mapeCount: int
    mapeExcludedCount: int


class ForecastPoint(BaseModel):
    startTime: str
    hour: str
    forecastMw: float | None
    actualMw: float | None
    publishTime: str | None
    ageHours: float | None
    errorMw: float | None


class DecisionResponse(BaseModel):
    decisionDate: str
    deliveryDate: str
    cutoff: str
    points: list[ForecastPoint]
    metrics: Metrics
    forecastHours: int
    forecastEnergyMwh: float | None = Field(
        description="Estimated MWh assuming each hourly forecast MW represents its whole hour; source interval-average semantics are unconfirmed."
    )
    peakMw: float | None
    minMw: float | None


class DailyScore(Metrics):
    decisionDate: str
    deliveryDate: str


class HourlyScore(Metrics):
    hour: str


class AccuracyResponse(BaseModel):
    metrics: Metrics
    expectedHours: int
    days: list[DailyScore]
    byHour: list[HourlyScore]


class CoverageResponse(BaseModel):
    decisionCutoffLocal: str
    retrievedAt: str
    expectedHours: int
    matchedHours: int
    days: list[DailyScore]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    snapshotReady: bool
