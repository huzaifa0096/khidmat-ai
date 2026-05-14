"""
Pricing Engine Agent — formula-based cost estimation with full breakdown.

Output is a structured price decomposition the customer can inspect
("see the math"), and is recorded as a reasoning step in the trace.

Formula:
    final = base * provider_variation + distance_km * distance_rate + urgency_extra

Where:
    base                = category baseline (e.g., 1500 for plumber, 3000 for AC)
    provider_variation  = 0.85–1.20 multiplier from provider's price_range
    distance_rate       = PKR per km (default 50)
    urgency_extra       = flat surcharge for emergency / urgent (0 / 300 / 1200)
"""
from typing import Optional


CATEGORY_BASE_PRICE = {
    "ac_technician": 3000,
    "plumber": 1500,
    "electrician": 1800,
    "carpenter": 2000,
    "painter": 2500,
    "cleaner": 1500,
    "tutor": 2000,
    "beautician": 2500,
    "mechanic": 2500,
    "tailor": 1500,
    "gardener": 1200,
    "cook": 2000,
    "driver": 2500,
    "courier": 800,
    "babysitter": 1500,
    "elder_care": 2000,
    "pest_control": 3500,
    "appliance_repair": 2200,
    "laundry": 800,
    "default": 2000,
}

URGENCY_SURCHARGE = {
    "normal": 0,
    "same_day": 300,
    "urgent": 600,
    "emergency": 1200,
}

URGENCY_MULTIPLIER = {
    "normal": 1.0,
    "same_day": 1.10,
    "urgent": 1.25,
    "emergency": 1.50,
}

DISTANCE_RATE_PKR_PER_KM = 50

PLATFORM_COMMISSION_PERCENT = 5  # 5% commission to platform


def _parse_provider_variation(price_range: Optional[str]) -> float:
    """
    Map a provider's 'PKR 2000-6000' style range to a multiplier vs base.
    Higher midpoint → higher variation (1.0 = neutral).
    """
    if not price_range:
        return 1.0
    try:
        nums = [int(x) for x in price_range.replace("PKR", "").replace(",", "").split("-") if x.strip().isdigit()]
        if len(nums) >= 2:
            mid = (nums[0] + nums[1]) / 2
            # Normalize: PKR 2000 = 1.0, PKR 4000 = 1.10, PKR 6000 = 1.20
            return max(0.85, min(1.25, 0.90 + (mid - 2000) / 20000))
    except Exception:
        pass
    return 1.0


def estimate_price(
    category_id: str,
    distance_km: float,
    urgency: str = "normal",
    provider_price_range: Optional[str] = None,
) -> dict:
    """
    Compute price breakdown for a service.

    Returns:
        {
            "base_pkr": int,
            "distance_km": float,
            "distance_cost_pkr": int,
            "urgency": str,
            "urgency_multiplier": float,
            "urgency_extra_pkr": int,
            "provider_variation": float,
            "subtotal_pkr": int,           # after multiplier
            "final_pkr": int,              # subtotal + flat urgency + distance
            "range_low_pkr": int,
            "range_high_pkr": int,
            "platform_commission_pkr": int,
            "provider_earnings_pkr": int,
            "commission_percent": int,
            "reasoning": str,
            "formula_str": str,
        }
    """
    base = CATEGORY_BASE_PRICE.get(category_id, CATEGORY_BASE_PRICE["default"])
    variation = _parse_provider_variation(provider_price_range)
    multiplier = URGENCY_MULTIPLIER.get(urgency, 1.0)
    urgency_extra = URGENCY_SURCHARGE.get(urgency, 0)
    distance_cost = int(round(max(0.0, distance_km) * DISTANCE_RATE_PKR_PER_KM))

    subtotal = int(round(base * variation * multiplier))
    final = subtotal + urgency_extra + distance_cost

    # 15% band around final for the "range"
    range_low = int(round(final * 0.85))
    range_high = int(round(final * 1.15))

    commission = int(round(final * PLATFORM_COMMISSION_PERCENT / 100.0))
    provider_earnings = final - commission

    formula_str = (
        f"({base} base × {variation:.2f} variation × {multiplier:.2f} urgency) "
        f"+ {distance_cost} distance + {urgency_extra} urgency-flat = {final}"
    )

    reasoning = (
        f"Computed using formula: base PKR {base} for {category_id.replace('_', ' ')}, "
        f"provider variation ×{variation:.2f} (price range {provider_price_range or 'standard'}), "
        f"urgency multiplier ×{multiplier:.2f} ({urgency}), "
        f"distance cost PKR {distance_cost} for {distance_km:.1f} km @ PKR {DISTANCE_RATE_PKR_PER_KM}/km, "
        f"plus urgency-flat surcharge PKR {urgency_extra}. "
        f"Final: PKR {final} (range PKR {range_low}–{range_high}). "
        f"Platform commission {PLATFORM_COMMISSION_PERCENT}% = PKR {commission}; provider earns PKR {provider_earnings}."
    )

    return {
        "base_pkr": base,
        "distance_km": round(distance_km, 2),
        "distance_cost_pkr": distance_cost,
        "distance_rate_pkr_per_km": DISTANCE_RATE_PKR_PER_KM,
        "urgency": urgency,
        "urgency_multiplier": round(multiplier, 2),
        "urgency_extra_pkr": urgency_extra,
        "provider_variation": round(variation, 2),
        "subtotal_pkr": subtotal,
        "final_pkr": final,
        "range_low_pkr": range_low,
        "range_high_pkr": range_high,
        "platform_commission_pkr": commission,
        "provider_earnings_pkr": provider_earnings,
        "commission_percent": PLATFORM_COMMISSION_PERCENT,
        "reasoning": reasoning,
        "formula_str": formula_str,
        "breakdown_lines": [
            {"label": "Base price", "value_pkr": base, "detail": f"{category_id.replace('_',' ').title()} baseline"},
            {"label": "Provider variation", "value_pkr": int(round(base * (variation - 1))), "detail": f"×{variation:.2f}"},
            {"label": "Urgency multiplier", "value_pkr": int(round(base * variation * (multiplier - 1))), "detail": f"×{multiplier:.2f} ({urgency})"},
            {"label": "Urgency surcharge", "value_pkr": urgency_extra, "detail": "Flat fee" if urgency_extra else "—"},
            {"label": "Distance cost", "value_pkr": distance_cost, "detail": f"{distance_km:.1f} km × PKR {DISTANCE_RATE_PKR_PER_KM}"},
            {"label": "Platform commission", "value_pkr": -commission, "detail": f"{PLATFORM_COMMISSION_PERCENT}% to Khidmat AI"},
            {"label": "Provider earnings", "value_pkr": provider_earnings, "detail": "After commission"},
        ],
    }
