"""
Live provider tracking — Uber-style mock GPS for an in-progress booking.

Given a booking_id, returns the simulated provider position interpolating
from a starting point ~5km from the customer toward the customer's sector
coords. The interpolation is time-based (linear toward arrival), so polling
this endpoint every few seconds shows realistic movement.

This is mock — no real GPS — but the math is correct and the UX is identical
to a production system.
"""
from fastapi import APIRouter, Request
from datetime import datetime, timedelta
from typing import Optional
import math
import random

router = APIRouter()


def _sector_coords(store, city_id: str, sector_id: str) -> tuple[float, float]:
    """Best-effort lookup of a sector's lat/lng. Fallback to city center."""
    try:
        city = store.get_city(city_id)
        if city:
            sec = next((s for s in city.get("sectors", []) if s["id"] == sector_id), None)
            if sec:
                return sec["lat"], sec["lng"]
            return city["center"]["lat"], city["center"]["lng"]
    except Exception:
        pass
    return 33.6844, 73.0479  # Islamabad fallback


def _deterministic_start_offset(booking_id: str) -> tuple[float, float]:
    """Pseudo-random but deterministic offset (in degrees) for the start point.
    Provider starts 3-6km away from the customer, in a stable direction per booking."""
    # Hash the booking_id into a seed
    h = 0
    for c in booking_id:
        h = (h * 31 + ord(c)) & 0xFFFFFFFF
    rng = random.Random(h)
    # ~0.025-0.05 degrees ≈ 2.5-5 km in Pakistan latitudes
    distance_deg = 0.025 + rng.random() * 0.025
    angle = rng.random() * 2 * math.pi
    return math.cos(angle) * distance_deg, math.sin(angle) * distance_deg


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


@router.get("/{booking_id}")
async def track_booking(booking_id: str, request: Request):
    """
    Live tracking position for an in-progress booking. Safe to poll every 2s.

    Returns:
      customer:  {lat, lng, label}
      provider:  {lat, lng, business_name, profile_image, phone}
      progress:  0.0 - 1.0 (fraction of journey completed)
      distance_km, eta_minutes
      status: 'en_route' | 'arrived' | 'not_started' | 'completed'
      polyline: simple [start, current, dest] for the map to draw a route
    """
    store = request.app.state.store
    booking = store.bookings.get(booking_id)
    if not booking:
        return {"error": "booking_not_found"}

    provider = booking.get("provider") or {}
    location = booking.get("location") or {}
    city_id = location.get("city", "islamabad")
    sector_id = location.get("sector", "G-13")
    customer_lat, customer_lng = _sector_coords(store, city_id, sector_id)

    # Deterministic provider starting offset (per booking_id)
    d_lat, d_lng = _deterministic_start_offset(booking_id)
    start_lat = customer_lat + d_lat
    start_lng = customer_lng + d_lng

    # Time-based interpolation
    # Use accepted_at if available, else created_at, else now
    started_iso = booking.get("accepted_at") or booking.get("created_at")
    try:
        started = datetime.fromisoformat(started_iso) if started_iso else datetime.now()
    except Exception:
        started = datetime.now()

    # ETA: assume 15 minutes from booking acceptance (typical urban dispatch)
    # In a real system this would come from a routing API
    total_eta_minutes = 15
    elapsed = max(0, (datetime.now() - started).total_seconds() / 60.0)
    progress = min(1.0, elapsed / total_eta_minutes)

    # Compute current position by linear interp from start → customer
    current_lat = start_lat + (customer_lat - start_lat) * progress
    current_lng = start_lng + (customer_lng - start_lng) * progress

    remaining_km = _haversine_km(current_lat, current_lng, customer_lat, customer_lng)
    eta_min = max(0, int(round((1 - progress) * total_eta_minutes)))

    status = (
        "completed" if booking.get("status") == "completed"
        else "arrived" if progress >= 0.98
        else "en_route" if progress > 0
        else "not_started"
    )

    return {
        "booking_id": booking_id,
        "status": status,
        "progress": round(progress, 3),
        "distance_km": round(remaining_km, 2),
        "eta_minutes": eta_min,
        "customer": {
            "lat": customer_lat,
            "lng": customer_lng,
            "label": f"{sector_id}, {city_id.title()}",
        },
        "provider": {
            "id": provider.get("id"),
            "lat": current_lat,
            "lng": current_lng,
            "business_name": provider.get("business_name", "Provider"),
            "profile_image": provider.get("profile_image"),
            "phone": provider.get("phone"),
        },
        "route": {
            "start": {"lat": start_lat, "lng": start_lng},
            "current": {"lat": current_lat, "lng": current_lng},
            "destination": {"lat": customer_lat, "lng": customer_lng},
        },
        "total_eta_minutes": total_eta_minutes,
        "started_at": started_iso,
        "polled_at": datetime.now().isoformat(),
    }
