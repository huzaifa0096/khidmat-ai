"""
Trust Engine Agent — composite reliability score per provider.

Combines five signals into a single 0-100 'trust score' so customers
can see at a glance whether a provider is dependable.

Score = rating_norm  × 0.40
      + completion   × 0.25
      + (1-cancels)  × 0.15
      + repeat       × 0.10
      + response     × 0.10
"""
from typing import Optional


def _normalize_rating(rating: float) -> float:
    """5-star scale → 0-1"""
    return max(0.0, min(1.0, rating / 5.0))


def _normalize_response(avg_minutes: int) -> float:
    """
    Faster response → higher score.
    < 15 min = 1.0, > 120 min = 0.0, linear in between.
    """
    if avg_minutes <= 15:
        return 1.0
    if avg_minutes >= 120:
        return 0.0
    return 1.0 - ((avg_minutes - 15) / 105.0)


def _normalize_repeat(repeat_customers: int, jobs_completed: int) -> float:
    """Repeat customer ratio (capped at 50% = perfect)."""
    if jobs_completed <= 0:
        return 0.0
    ratio = repeat_customers / max(1, jobs_completed)
    return min(1.0, ratio * 2.0)


def compute_trust_score(provider: dict) -> dict:
    """
    Compute composite trust score from a provider record.

    Provider expected fields:
        rating, completion_rate_percent, cancellation_rate_percent,
        repeat_customers (optional), jobs_completed (optional),
        avg_response_minutes
    """
    rating = provider.get("rating", 4.0)
    completion = provider.get("completion_rate_percent", 90) / 100.0
    cancel_rate = provider.get("cancellation_rate_percent", 5) / 100.0
    response_min = provider.get("avg_response_minutes", 30)
    repeat = provider.get("repeat_customers", int(provider.get("jobs_completed", 100) * 0.20))
    jobs = provider.get("jobs_completed", 100)

    rating_norm = _normalize_rating(rating)
    cancel_norm = max(0.0, 1.0 - cancel_rate)
    response_norm = _normalize_response(response_min)
    repeat_norm = _normalize_repeat(repeat, jobs)

    weights = {
        "rating": 0.40,
        "completion": 0.25,
        "low_cancellations": 0.15,
        "repeat_customers": 0.10,
        "response_speed": 0.10,
    }

    raw_score = (
        rating_norm * weights["rating"]
        + completion * weights["completion"]
        + cancel_norm * weights["low_cancellations"]
        + repeat_norm * weights["repeat_customers"]
        + response_norm * weights["response_speed"]
    )
    score_100 = round(raw_score * 100)

    # Tier classification
    if score_100 >= 90:
        tier = "elite"
        tier_label = "Elite"
    elif score_100 >= 80:
        tier = "trusted"
        tier_label = "Trusted"
    elif score_100 >= 65:
        tier = "verified"
        tier_label = "Verified"
    else:
        tier = "new"
        tier_label = "New Provider"

    # Reasoning text
    reasons = []
    if rating >= 4.7:
        reasons.append(f"top {rating}★ rating")
    elif rating >= 4.4:
        reasons.append(f"solid {rating}★ rating")
    else:
        reasons.append(f"{rating}★ rating")
    if completion >= 0.95:
        reasons.append(f"{int(completion*100)}% completion")
    if cancel_rate <= 0.05:
        reasons.append("low cancellations")
    if response_min <= 20:
        reasons.append(f"fast {response_min}-min response")

    reasoning = f"Trust score {score_100}/100 ({tier_label}): " + ", ".join(reasons) + "."

    return {
        "score": score_100,
        "tier": tier,
        "tier_label": tier_label,
        "components": {
            "rating_normalized": round(rating_norm, 3),
            "completion_normalized": round(completion, 3),
            "low_cancellation_normalized": round(cancel_norm, 3),
            "repeat_normalized": round(repeat_norm, 3),
            "response_normalized": round(response_norm, 3),
        },
        "weights": weights,
        "reasoning": reasoning,
    }


def annotate_providers(providers: list) -> list:
    """Attach a trust block to a list of provider dicts (in place + returned)."""
    for p in providers:
        p["trust"] = compute_trust_score(p)
    return providers
