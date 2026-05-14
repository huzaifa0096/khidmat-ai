"""Crisis Specialist Agent — Mode A (Crisis) + Mode B (Insights)."""
from datetime import datetime
import math


CRISIS_SERVICE_BUNDLES = {
    "urban_flooding": ["plumber", "electrician"],
    "gas_leak": ["plumber"],  # gas technician would be ideal
    "fire": ["electrician"],
    "power_outage": ["electrician", "generator_repair"],
    "accident": ["car_mechanic"]
}


def _classify_crisis(intent: dict, weather: dict, traffic: dict, reports: dict) -> dict:
    signals = intent.get("urgency_signals", []) + [intent.get("raw_service_phrase", "")]
    txt = " ".join(s for s in signals if s).lower()

    crisis_type = "unknown"
    confidence = 0.5
    severity = "medium"
    evidence = []

    if any(k in txt for k in ["pani", "flood", "water", "rain"]):
        crisis_type = "urban_flooding"
        confidence = 0.85
        evidence.append(f"User keywords: {signals}")
    elif "gas" in txt:
        crisis_type = "gas_leak"
        confidence = 0.85
    elif "fire" in txt or "aag" in txt:
        crisis_type = "fire"
        confidence = 0.9
    elif "short circuit" in txt or "bijli" in txt:
        crisis_type = "power_outage"
        confidence = 0.75

    if weather.get("rainfall_mm", 0) > 25:
        evidence.append(f"Weather alert: {weather.get('alert')}, rainfall {weather['rainfall_mm']}mm")
        if crisis_type == "urban_flooding":
            confidence = min(1.0, confidence + 0.1)

    if traffic.get("delta_percent_vs_normal", 0) > 150:
        evidence.append(f"Traffic +{traffic['delta_percent_vs_normal']}% vs normal")
        confidence = min(1.0, confidence + 0.05)

    if reports.get("cluster_detected"):
        evidence.append(f"{len(reports.get('reports', []))} similar reports in last 2 hours in this sector")
        confidence = min(1.0, confidence + 0.1)
        severity = "high"

    if confidence > 0.9 and reports.get("cluster_detected"):
        severity = "critical"

    area_wide = bool(reports.get("cluster_detected"))

    return {
        "type": crisis_type,
        "confidence": round(confidence, 2),
        "area_wide": area_wide,
        "severity": severity,
        "evidence": evidence
    }


def assess_and_dispatch(intent: dict, candidates_payload: dict, store, weather: dict, traffic: dict, reports: dict) -> dict:
    """Mode A — Crisis coordination."""
    assessment = _classify_crisis(intent, weather, traffic, reports)
    cat_id = intent.get("service_category_id")
    city_id = intent["location"].get("city")
    sec_id = intent["location"].get("sector")

    # Primary providers — top 2 emergency-eligible from candidates
    candidates = candidates_payload.get("candidates", [])
    emergency_candidates = [c for c in candidates if c["raw"].get("emergency_24x7")] or candidates
    primary = emergency_candidates[:2]

    # Secondary providers — pull from crisis bundle
    secondary = []
    bundle_categories = CRISIS_SERVICE_BUNDLES.get(assessment["type"], [])
    for bundle_cat in bundle_categories:
        if bundle_cat == cat_id:
            continue
        # find nearest provider for this bundle category
        bundle_providers = [p for p in store.providers if p["primary_service"] == bundle_cat and p["city"] == city_id and p.get("emergency_24x7")]
        if bundle_providers:
            # rough distance from sector
            sec = store.get_sector(city_id, sec_id) if sec_id else None
            anchor_lat = sec["lat"] if sec else None
            anchor_lng = sec["lng"] if sec else None

            def dist(p):
                if anchor_lat is None:
                    return 0
                return math.sqrt((p["location"]["lat"] - anchor_lat) ** 2 + (p["location"]["lng"] - anchor_lng) ** 2) * 111
            bundle_providers.sort(key=dist)
            nearest = bundle_providers[0]
            secondary.append({
                "provider_id": nearest["id"],
                "business_name": nearest["business_name"],
                "role": bundle_cat,
                "reason": f"{assessment['type']} requires {bundle_cat} support"
            })

    dispatch_plan = {
        "primary_providers": [
            {
                "provider_id": p["raw"]["id"],
                "business_name": p["raw"]["business_name"],
                "role": cat_id,
                "eta_minutes": p["raw"]["avg_response_minutes"]
            } for p in primary
        ],
        "secondary_providers": secondary,
        "total_dispatched": len(primary) + len(secondary),
        "redundancy": len(primary) >= 2
    }

    surcharge_mult = {"low": 1.2, "medium": 1.3, "high": 1.5, "critical": 2.0}.get(assessment["severity"], 1.5)
    estimated_cost = f"PKR {int(1500 * surcharge_mult)}-{int(6000 * surcharge_mult)}"

    pricing = {
        "emergency_surcharge_multiplier": surcharge_mult,
        "estimated_cost_pkr": estimated_cost,
        "surcharge_reason": f"Emergency response ({assessment['severity']} severity), priority dispatch, weather/traffic conditions considered"
    }

    area_alert = None
    if assessment["area_wide"]:
        ur_msg = ""
        en_msg = ""
        if assessment["type"] == "urban_flooding":
            ur_msg = f"⚠️ {sec_id} mein flooding report hui hai. Apni gaariyan zameen pe na chorein. Bijli ke connections check karein."
            en_msg = f"⚠️ Flooding reported in {sec_id}. Move vehicles to higher ground. Check electrical connections."
        else:
            ur_msg = f"⚠️ {sec_id} mein {assessment['type']} ki situation hai. Hifazat mein rahein."
            en_msg = f"⚠️ {assessment['type']} situation in {sec_id}. Stay safe."

        area_alert = {
            "broadcast": True,
            "audience_estimated": 540,
            "message_ur": ur_msg,
            "message_en": en_msg
        }

    eta = primary[0]["raw"]["avg_response_minutes"] if primary else 30
    baseline = 90
    improvement = round(((baseline - eta) / baseline) * 100)

    return {
        "crisis_assessment": assessment,
        "dispatch_plan": dispatch_plan,
        "pricing": pricing,
        "area_alert": area_alert,
        "emergency_ticket": {
            "priority": "P0" if assessment["severity"] in ("high", "critical") else "P1",
            "status": "dispatched",
            "escalated_to_authority": assessment["severity"] == "critical",
            "escalation_recommended": "If situation worsens, recommend dispatch to ICT Emergency Services (1122)" if assessment["severity"] == "critical" else ""
        },
        "outcome_projection": {
            "before": f"User stranded, {assessment['type']} situation, no help dispatched",
            "after": f"{dispatch_plan['total_dispatched']} providers en-route, {'area alert broadcasted, ' if area_alert else ''}emergency ticket logged",
            "metrics": {
                "response_time_minutes": eta,
                "vs_baseline_minutes": baseline,
                "improvement_percent": improvement
            }
        }
    }


def generate_insights(store) -> dict:
    """Mode B — Demand insights from booking history."""
    by_cat_city = {}
    for b in store.bookings.values():
        key = (b["service"]["category"], b["location"]["city"])
        by_cat_city[key] = by_cat_city.get(key, 0) + 1

    insights = []

    # Demand spike (mock — based on current bookings)
    if by_cat_city:
        top = max(by_cat_city.items(), key=lambda kv: kv[1])
        (cat, city), count = top
        cat_meta = store.get_category(cat)
        city_meta = store.get_city(city)
        insights.append({
            "id": "INS-001",
            "type": "demand_spike",
            "title_en": f"{cat_meta['name_en'] if cat_meta else cat} demand high in {city_meta['name_en'] if city_meta else city}",
            "title_ur": f"{city_meta['name_en'] if city_meta else city} mein {cat_meta['name_en'] if cat_meta else cat} ki demand zyada hai",
            "impact": f"Revenue opportunity (estimated PKR {count * 2500}/week)",
            "recommended_action": {
                "action_type": "onboard_providers",
                "details": f"Onboard 8 more {cat_meta['name_en'] if cat_meta else cat} providers in {city_meta['name_en'] if city_meta else city}",
                "priority": "high",
                "estimated_effort_hours": 16
            },
            "simulated_execution": {
                "action_taken": f"Generated outreach campaign to 24 {cat_meta['name_en'] if cat_meta else cat} providers in adjacent areas",
                "result": "Campaign created, 24 SMS drafts queued"
            }
        })

    # Underserved area detection
    cat_city_supply = {}
    for p in store.providers:
        key = (p["primary_service"], p["city"])
        cat_city_supply[key] = cat_city_supply.get(key, 0) + 1

    underserved = []
    for (cat, city), demand in by_cat_city.items():
        supply = cat_city_supply.get((cat, city), 0)
        if supply > 0 and demand / supply > 3:
            underserved.append((cat, city, demand, supply))
    if underserved:
        cat, city, demand, supply = underserved[0]
        cat_meta = store.get_category(cat)
        insights.append({
            "id": "INS-002",
            "type": "underserved_area",
            "title_en": f"{cat_meta['name_en'] if cat_meta else cat} underserved in {city}",
            "impact": f"{demand} requests, only {supply} providers",
            "recommended_action": {"action_type": "expand_coverage", "details": f"Add 3 {cat_meta['name_en'] if cat_meta else cat} providers in {city}", "priority": "medium"}
        })

    summary_en = f"Top insight: {insights[0]['title_en']}. {len(insights)} total recommendations." if insights else "Insufficient booking data yet."
    summary_ur = f"Aham insight: {insights[0]['title_ur']}. Kul {len(insights)} recommendations." if insights else "Abhi enough bookings nahi hain."

    return {
        "insights": insights,
        "executive_summary_en": summary_en,
        "executive_summary_ur": summary_ur,
        "generated_at": datetime.now().isoformat()
    }
