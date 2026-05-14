"""Provider Discovery Agent — implementation."""
from utils.geo import haversine_km


AVAILABILITY_COMPAT = {
    "now": {"available_now"},
    "today_morning": {"available_now", "available_today"},
    "today_afternoon": {"available_now", "available_today"},
    "today_evening": {"available_now", "available_today"},
    "tomorrow_morning": {"available_now", "available_today", "available_tomorrow"},
    "tomorrow_afternoon": {"available_now", "available_today", "available_tomorrow"},
    "tomorrow_evening": {"available_now", "available_today", "available_tomorrow"},
    "flexible": {"available_now", "available_today", "available_tomorrow", "busy_until_evening"},
    "specific": {"available_now", "available_today", "available_tomorrow"}
}


def discover(intent: dict, store) -> dict:
    cat_id = intent.get("service_category_id")
    city_id = intent["location"].get("city")
    sec_id = intent["location"].get("sector")
    urgency = intent.get("urgency", "normal")
    time_pref = intent["time"].get("preference", "flexible")

    if not cat_id or not city_id:
        return {
            "candidates": [],
            "filtered_out": [],
            "total_matched": 0,
            "reasoning": "Cannot discover providers without service category or city."
        }

    # Anchor coords — sector centroid or city center
    anchor = None
    if sec_id:
        sec = store.get_sector(city_id, sec_id)
        if sec:
            anchor = (sec["lat"], sec["lng"])
    if anchor is None:
        city = store.get_city(city_id)
        if city:
            anchor = (city["center"]["lat"], city["center"]["lng"])
    if anchor is None:
        return {"candidates": [], "filtered_out": [], "total_matched": 0, "reasoning": "Unknown city."}

    # Primary match
    primary = [p for p in store.providers if p["primary_service"] == cat_id and p["city"] == city_id]
    secondary = [p for p in store.providers if cat_id in p.get("secondary_services", []) and p["city"] == city_id and p not in primary]

    all_candidates = primary + secondary

    candidates = []
    filtered_out = []
    avail_compat = AVAILABILITY_COMPAT.get(time_pref, AVAILABILITY_COMPAT["flexible"])

    for p in all_candidates:
        # availability filter
        if p["availability"] not in avail_compat:
            filtered_out.append({"provider_id": p["id"], "reason": f"availability: {p['availability']}, incompatible with {time_pref}"})
            continue
        # emergency filter
        if urgency == "emergency" and not p.get("emergency_24x7"):
            filtered_out.append({"provider_id": p["id"], "reason": "not emergency_24x7"})
            continue
        # gender filter (skip — not modeled per provider)
        # budget filter
        max_budget = intent.get("constraints", {}).get("max_budget_pkr")
        if max_budget:
            pr = p.get("price_range", "")
            low_str = pr.replace("PKR", "").strip().split("-")[0].strip()
            try:
                low = int(low_str)
                if low > max_budget:
                    filtered_out.append({"provider_id": p["id"], "reason": f"min price PKR {low} > budget PKR {max_budget}"})
                    continue
            except Exception:
                pass

        distance_km = haversine_km(anchor[0], anchor[1], p["location"]["lat"], p["location"]["lng"])
        candidates.append({
            "provider_id": p["id"],
            "distance_km": distance_km,
            "availability_match": True,
            "hard_filter_pass": True,
            "raw": p,
            "secondary_match": p in secondary
        })

    candidates.sort(key=lambda c: c["distance_km"])
    candidates = candidates[:15]

    expanded = False
    if not candidates and time_pref == "flexible":
        # already broadest
        pass

    return {
        "candidates": candidates,
        "filtered_out": filtered_out[:20],
        "total_matched": len(candidates),
        "search_radius_km_used": None,
        "expanded_search": expanded,
        "reasoning": (
            f"Found {len(primary)} primary + {len(secondary)} secondary providers for {cat_id} in {city_id}. "
            f"Filtered {len(filtered_out)} due to constraints. Sorted by proximity to {sec_id or 'city center'}. "
            f"Top {len(candidates)} returned."
        )
    }
