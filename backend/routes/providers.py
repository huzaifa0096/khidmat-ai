from fastapi import APIRouter, Request, Query
from typing import Optional
from utils.geo import haversine_km

router = APIRouter()


@router.get("")
async def list_providers(
    request: Request,
    category: Optional[str] = None,
    secondary_category: Optional[str] = None,
    city: Optional[str] = None,
    sector: Optional[str] = None,
    emergency_only: bool = False,
    verified_only: bool = False,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    limit: int = 200
):
    store = request.app.state.store
    results = list(store.providers)

    if category:
        # Match providers who offer this category either as primary OR secondary,
        # so a user's newly-added service appears in customer search results immediately.
        results = [
            p for p in results
            if p["primary_service"] == category
            or category in p.get("secondary_services", [])
        ]
    if secondary_category:
        results = [p for p in results if secondary_category in p.get("secondary_services", [])]
    if city:
        results = [p for p in results if p["city"] == city]
    if sector:
        results = [p for p in results if p["sector"] == sector]
    if emergency_only:
        results = [p for p in results if p.get("emergency_24x7")]
    if verified_only:
        results = [p for p in results if p.get("verified")]

    # If lat/lng provided, compute distance and sort
    if lat is not None and lng is not None:
        for p in results:
            p_lat = p["location"]["lat"]
            p_lng = p["location"]["lng"]
            p["distance_km"] = haversine_km(lat, lng, p_lat, p_lng)
        results.sort(key=lambda x: x.get("distance_km", 1e9))

    return {"total": len(results), "providers": results[:limit]}


@router.get("/{provider_id}")
async def get_provider(provider_id: str, request: Request):
    store = request.app.state.store
    p = store.get_provider(provider_id)
    if not p:
        return {"error": "not_found", "provider_id": provider_id}
    return p
