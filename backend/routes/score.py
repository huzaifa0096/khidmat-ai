"""Scoring engine — multi-dimensional weighted ranking with urgency-adaptive weights."""
import math
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


WEIGHTS = {
    "normal":    {"distance": 0.25, "rating": 0.25, "reviews": 0.10, "verified": 0.10, "availability": 0.15, "completion": 0.10, "response_time": 0.05},
    "urgent":    {"distance": 0.35, "rating": 0.20, "reviews": 0.05, "verified": 0.10, "availability": 0.20, "completion": 0.05, "response_time": 0.05},
    "emergency": {"distance": 0.50, "rating": 0.10, "reviews": 0.05, "verified": 0.05, "availability": 0.25, "completion": 0.05, "response_time": 0.00},
}

AVAILABILITY_SCORES = {
    "available_now": 1.0,
    "available_today": 0.85,
    "available_tomorrow": 0.70,
    "busy_until_evening": 0.40,
}


class ScoreRequest(BaseModel):
    provider: dict
    distance_km: Optional[float] = None
    urgency: str = "normal"


def _score_provider(p: dict, distance_km: float, urgency: str) -> dict:
    weights = WEIGHTS.get(urgency, WEIGHTS["normal"])
    distance_score = max(0.0, 1.0 - (distance_km if distance_km is not None else 15) / 15.0)
    rating_score = max(0.0, min(1.0, (p["rating"] - 3.0) / 2.0))
    reviews_score = min(1.0, math.log10(p["reviews_count"] + 1) / 3.0)
    verified_score = 1.0 if p.get("verified") else 0.5
    availability_score = AVAILABILITY_SCORES.get(p["availability"], 0.5)
    completion_score = max(0.0, min(1.0, (p["completion_rate_percent"] - 80) / 20.0))
    response_score = max(0.0, 1.0 - p["avg_response_minutes"] / 90.0)

    breakdown = {
        "distance": round(distance_score, 3),
        "rating": round(rating_score, 3),
        "reviews": round(reviews_score, 3),
        "verified": round(verified_score, 3),
        "availability": round(availability_score, 3),
        "completion": round(completion_score, 3),
        "response_time": round(response_score, 3),
    }

    final = sum(breakdown[k] * weights[k] for k in weights)
    return {
        "provider_id": p["id"],
        "final_score": round(final, 3),
        "score_breakdown": breakdown,
        "weights_used": weights,
    }


@router.post("")
async def score(payload: ScoreRequest):
    return _score_provider(payload.provider, payload.distance_km or 0, payload.urgency)


@router.post("/batch")
async def score_batch(payload: dict):
    """Score multiple providers at once. Expected payload: {providers:[{...,distance_km:..}], urgency:..}"""
    urgency = payload.get("urgency", "normal")
    results = []
    for p in payload.get("providers", []):
        results.append(_score_provider(p, p.get("distance_km", 0), urgency))
    results.sort(key=lambda x: x["final_score"], reverse=True)
    return {"ranked": results}


# Expose for orchestrator
def score_provider(p, distance_km, urgency):
    return _score_provider(p, distance_km, urgency)
