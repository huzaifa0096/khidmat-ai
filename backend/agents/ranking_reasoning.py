"""Ranking & Reasoning Agent — implementation."""
from routes.score import score_provider


def _build_badges(p: dict, breakdown: dict, candidates: list) -> list[str]:
    badges = []
    distances = [c["distance_km"] for c in candidates]
    if distances and p["distance_km"] == min(distances):
        badges.append("Closest")
    if p["raw"]["rating"] >= 4.7:
        badges.append("Top Rated")
    if p["raw"].get("verified"):
        badges.append("Verified")
    if p["raw"].get("emergency_24x7"):
        badges.append("24/7")
    if p["raw"]["avg_response_minutes"] <= 25:
        badges.append("Fastest Response")
    if p["raw"]["experience_years"] >= 12:
        badges.append("Most Experienced")
    if p["raw"]["completion_rate_percent"] >= 95:
        badges.append("Reliable")
    return badges


def _build_reasoning(p, scored, badges, urgency, language):
    raw = p["raw"]
    is_ur = language in ("roman_urdu", "urdu", "mixed")

    parts_en = []
    parts_ur = []

    # Distance
    parts_en.append(f"only {p['distance_km']:.1f} km away in {raw['sector']}")
    parts_ur.append(f"sirf {p['distance_km']:.1f} km door {raw['sector']} mein")

    # Rating + reviews
    parts_en.append(f"rated {raw['rating']}★ with {raw['reviews_count']} reviews")
    parts_ur.append(f"{raw['rating']}★ rating aur {raw['reviews_count']} reviews")

    # Availability
    if raw["availability"] == "available_now":
        parts_en.append("available right now")
        parts_ur.append("abhi available hai")
    elif raw["availability"] == "available_today":
        parts_en.append("available today")
        parts_ur.append("aaj available hai")
    elif raw["availability"] == "available_tomorrow":
        parts_en.append("available tomorrow as requested")
        parts_ur.append("kal available hai")

    # Completion
    parts_en.append(f"{raw['completion_rate_percent']}% completion rate")
    parts_ur.append(f"{raw['completion_rate_percent']}% kaam complete karte hain")

    # Verified
    if raw.get("verified"):
        parts_en.append("verified provider")
        parts_ur.append("verified hain")

    # Response
    if raw["avg_response_minutes"] <= 25:
        parts_en.append("quick to respond")
        parts_ur.append("jaldi reply karte hain")

    reasoning_en = f"Best match because " + ", ".join(parts_en[:5]) + "."
    reasoning_ur = "Sab se behtareen choice kyunke " + ", ".join(parts_ur[:5]) + "."

    if scored["final_score"] < 0.6:
        reasoning_en = "Good available option — " + reasoning_en.replace("Best match because ", "")
        reasoning_ur = "Achhi available choice — " + reasoning_ur.replace("Sab se behtareen choice kyunke ", "")

    return reasoning_en, reasoning_ur


def rank(candidates_payload: dict, intent: dict) -> dict:
    candidates = candidates_payload.get("candidates", [])
    if not candidates:
        return {"top_3": [], "decision_summary_en": "No candidates to rank.", "decision_summary_ur": "Koi providers nahi mile.", "alternative_consideration": ""}

    urgency = intent.get("urgency", "normal")
    language = intent.get("language_detected", "english")

    scored_candidates = []
    for c in candidates:
        s = score_provider(c["raw"], c["distance_km"], urgency)
        scored_candidates.append((c, s))

    scored_candidates.sort(key=lambda t: t[1]["final_score"], reverse=True)
    top_3 = []
    for rank_idx, (c, s) in enumerate(scored_candidates[:3], start=1):
        badges = _build_badges(c, s["score_breakdown"], candidates)
        reason_en, reason_ur = _build_reasoning(c, s, badges, urgency, language)
        tradeoffs = []
        # Tradeoff vs the closest if this isn't closest
        if "Closest" not in badges and candidates:
            closest = min(candidates, key=lambda x: x["distance_km"])
            if c["provider_id"] != closest["provider_id"]:
                diff_km = c["distance_km"] - closest["distance_km"]
                tradeoffs.append(f"{diff_km:.1f} km farther than the closest option, but stronger overall score")

        raw = c["raw"]
        top_3.append({
            "rank": rank_idx,
            "provider_id": raw["id"],
            "provider": {
                "name": raw["name"],
                "business_name": raw["business_name"],
                "rating": raw["rating"],
                "reviews_count": raw["reviews_count"],
                "phone": raw["phone"],
                "profile_image": raw["profile_image"],
                "sector": raw["sector"],
                "city": raw["city_name_en"],
                "price_range": raw["price_range"],
                "experience_years": raw["experience_years"],
                "languages": raw["languages"],
                "completion_rate_percent": raw["completion_rate_percent"],
                "avg_response_minutes": raw["avg_response_minutes"],
                "verified": raw.get("verified", False),
                "emergency_24x7": raw.get("emergency_24x7", False),
                "availability": raw["availability"],
                "description": raw["description"],
                "location": raw["location"]
            },
            "distance_km": c["distance_km"],
            "final_score": s["final_score"],
            "score_breakdown": s["score_breakdown"],
            "reasoning_en": reason_en,
            "reasoning_ur": reason_ur,
            "tradeoffs": tradeoffs,
            "highlight_badges": badges
        })

    top1 = top_3[0] if top_3 else None
    summary_en = ""
    summary_ur = ""
    if top1:
        summary_en = f"Selected {top1['provider']['business_name']} as top recommendation — {top1['reasoning_en']}"
        summary_ur = f"{top1['provider']['business_name']} ko top choice diya hai — {top1['reasoning_ur']}"

    return {
        "top_3": top_3,
        "decision_summary_en": summary_en,
        "decision_summary_ur": summary_ur,
        "alternative_consideration": "If you prioritize rating over distance, see rank 2." if len(top_3) > 1 else "",
        "weights_used_urgency": urgency
    }
