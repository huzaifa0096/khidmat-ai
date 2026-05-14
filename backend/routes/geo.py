from fastapi import APIRouter, Request
from pydantic import BaseModel
from utils.geo import haversine_km

router = APIRouter()


class DistanceRequest(BaseModel):
    lat1: float
    lng1: float
    lat2: float
    lng2: float


@router.post("/distance")
async def distance(payload: DistanceRequest):
    return {"distance_km": haversine_km(payload.lat1, payload.lng1, payload.lat2, payload.lng2)}


@router.get("/sector")
async def sector_coords(city: str, sector: str, request: Request):
    store = request.app.state.store
    s = store.get_sector(city, sector)
    if not s:
        return {"error": "sector_not_found"}
    return s
