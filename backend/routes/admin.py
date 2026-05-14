"""
Admin Dashboard route — system overview, providers, financials, analytics.

All endpoints are read-only aggregations over the in-memory Store.
"""
from collections import Counter, defaultdict
from datetime import datetime
from fastapi import APIRouter, Request

router = APIRouter()


def _safe_dt(iso: str) -> datetime | None:
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except Exception:
        return None


@router.get("/overview")
async def overview(request: Request):
    store = request.app.state.store
    bookings = list(store.bookings.values())
    traces = list(store.traces.values())

    status_counts = Counter(b.get("status", "unknown") for b in bookings)
    total_revenue = 0
    total_commission = 0
    total_provider_earnings = 0
    for b in bookings:
        p = b.get("pricing") or {}
        if b.get("status") in ("confirmed", "completed", "in_progress"):
            total_revenue += p.get("final_pkr", 0)
            total_commission += p.get("platform_commission_pkr", 0)
            total_provider_earnings += p.get("provider_earnings_pkr", 0)

    return {
        "system": {
            "providers_total": len(store.providers),
            "providers_active": sum(1 for p in store.providers if p.get("active", True)),
            "categories": len(store.categories),
            "cities": len(store.cities),
            "uptime_status": "healthy",
        },
        "bookings": {
            "total": len(bookings),
            "by_status": dict(status_counts),
            "today": sum(1 for b in bookings if _safe_dt(b.get("created_at", "")) and _safe_dt(b["created_at"]).date() == datetime.now().date()),
        },
        "agents": {
            "traces_total": len(traces),
            "agents_in_pipeline": [
                "intent_parser", "provider_discovery", "crisis_specialist",
                "trust_engine", "ranking_reasoning", "pricing_engine",
                "booking_executor", "followup_automator",
            ],
            "avg_steps_per_trace": round(sum(len(t.get("steps", [])) for t in traces) / max(1, len(traces)), 1),
        },
        "financials": {
            "gross_revenue_pkr": total_revenue,
            "platform_commission_pkr": total_commission,
            "provider_earnings_pkr": total_provider_earnings,
            "commission_percent": 5,
        },
        "emergency": {
            "tickets_open": sum(1 for t in store.emergency_tickets.values() if t.get("status") not in ("resolved", "closed")),
            "tickets_total": len(store.emergency_tickets),
            "area_alerts_sent": len(store.area_alerts),
        },
    }


@router.get("/providers")
async def providers_admin(request: Request, limit: int = 25, sort: str = "rating"):
    """List providers with computed performance signals for admin to manage."""
    store = request.app.state.store

    # Per-provider booking aggregations
    perf = defaultdict(lambda: {"bookings": 0, "revenue": 0, "earnings": 0, "ratings_received": []})
    for b in store.bookings.values():
        pid = b.get("provider", {}).get("id")
        if not pid:
            continue
        p = perf[pid]
        p["bookings"] += 1
        if b.get("status") in ("confirmed", "completed", "in_progress"):
            pr = b.get("pricing") or {}
            p["revenue"] += pr.get("final_pkr", 0)
            p["earnings"] += pr.get("provider_earnings_pkr", 0)
        fb = b.get("feedback")
        if fb:
            p["ratings_received"].append(fb["rating"])

    rows = []
    for p in store.providers:
        agg = perf.get(p["id"], {"bookings": 0, "revenue": 0, "earnings": 0, "ratings_received": []})
        rows.append({
            "id": p["id"],
            "business_name": p["business_name"],
            "category": p.get("category_id"),
            "city": p.get("city"),
            "sector": p.get("sector"),
            "rating": p.get("rating"),
            "reviews_count": p.get("reviews_count", 0),
            "verified": p.get("verified", False),
            "active": p.get("active", True),
            "completion_rate": p.get("completion_rate_percent"),
            "bookings": agg["bookings"],
            "revenue_pkr": agg["revenue"],
            "earnings_pkr": agg["earnings"],
            "recent_ratings": agg["ratings_received"][-5:],
        })

    sort_map = {
        "rating": lambda r: -(r["rating"] or 0),
        "bookings": lambda r: -r["bookings"],
        "revenue": lambda r: -r["revenue_pkr"],
        "name": lambda r: r["business_name"].lower(),
    }
    rows.sort(key=sort_map.get(sort, sort_map["rating"]))
    return {"total": len(rows), "providers": rows[:limit], "sort": sort}


@router.get("/analytics")
async def analytics(request: Request):
    store = request.app.state.store
    bookings = list(store.bookings.values())

    # Demand by city
    city_demand = Counter()
    service_demand = Counter()
    hour_demand = Counter()
    for b in bookings:
        loc = b.get("location", {})
        srv = b.get("service", {})
        city_demand[loc.get("city", "unknown")] += 1
        service_demand[srv.get("category", "unknown")] += 1
        dt = _safe_dt(b.get("created_at", ""))
        if dt:
            hour_demand[dt.hour] += 1

    # Top earners
    earners = defaultdict(int)
    for b in bookings:
        if b.get("status") in ("confirmed", "completed", "in_progress"):
            pid = b.get("provider", {}).get("id")
            if pid:
                earners[pid] += (b.get("pricing") or {}).get("provider_earnings_pkr", 0)

    top_earners = sorted(earners.items(), key=lambda kv: -kv[1])[:5]
    provider_lookup = {p["id"]: p for p in store.providers}
    top_earners_rich = [
        {
            "provider_id": pid,
            "business_name": provider_lookup.get(pid, {}).get("business_name", pid),
            "earnings_pkr": amt,
        }
        for pid, amt in top_earners
    ]

    # Shortage zones — cities with high demand but few providers
    providers_per_city = Counter(p.get("city", "unknown") for p in store.providers)
    shortage = []
    for city, demand_n in city_demand.most_common():
        supply_n = providers_per_city.get(city, 1)
        ratio = demand_n / max(1, supply_n)
        shortage.append({
            "city": city,
            "demand": demand_n,
            "providers": supply_n,
            "demand_per_provider": round(ratio, 2),
            "alert": ratio > 1.5,
        })

    return {
        "demand_by_city": [{"city": c, "count": n} for c, n in city_demand.most_common()],
        "demand_by_service": [{"category": s, "count": n} for s, n in service_demand.most_common()],
        "demand_by_hour": [{"hour": h, "count": hour_demand[h]} for h in sorted(hour_demand.keys())],
        "top_earners": top_earners_rich,
        "shortage_zones": shortage,
    }


@router.get("/revenue")
async def revenue(request: Request):
    """Daily revenue breakdown — last 7 days."""
    store = request.app.state.store
    bookings = list(store.bookings.values())

    daily = defaultdict(lambda: {"gross": 0, "commission": 0, "provider_earnings": 0, "bookings": 0})
    for b in bookings:
        dt = _safe_dt(b.get("created_at", ""))
        if not dt:
            continue
        if b.get("status") not in ("confirmed", "completed", "in_progress"):
            continue
        key = dt.date().isoformat()
        pricing = b.get("pricing") or {}
        daily[key]["gross"] += pricing.get("final_pkr", 0)
        daily[key]["commission"] += pricing.get("platform_commission_pkr", 0)
        daily[key]["provider_earnings"] += pricing.get("provider_earnings_pkr", 0)
        daily[key]["bookings"] += 1

    series = sorted(daily.items())[-7:]
    totals = {
        "gross_pkr": sum(d["gross"] for _, d in series),
        "commission_pkr": sum(d["commission"] for _, d in series),
        "provider_earnings_pkr": sum(d["provider_earnings"] for _, d in series),
        "bookings": sum(d["bookings"] for _, d in series),
    }
    return {
        "daily_series": [{"date": k, **v} for k, v in series],
        "totals_7d": totals,
    }
