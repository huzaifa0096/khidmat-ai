"""Mocked external APIs — weather, traffic. In production these would call real APIs."""
from datetime import datetime
from fastapi import APIRouter
from typing import Optional

router = APIRouter()

# Deterministic mock — simulate heavy rainfall in Islamabad/Rawalpindi today
WEATHER_DATA = {
    "islamabad":  {"condition": "Heavy Rain", "temp_c": 24, "rainfall_mm": 38, "wind_kmph": 22, "alert": "Flash flood alert active"},
    "rawalpindi": {"condition": "Heavy Rain", "temp_c": 25, "rainfall_mm": 32, "wind_kmph": 18, "alert": "Heavy rainfall expected"},
    "lahore":     {"condition": "Hot",        "temp_c": 38, "rainfall_mm": 0,  "wind_kmph": 9,  "alert": "Heatwave advisory"},
    "karachi":    {"condition": "Hot Humid",  "temp_c": 36, "rainfall_mm": 0,  "wind_kmph": 14, "alert": None}
}

TRAFFIC_DATA = {
    "G-10": {"density": "very_high", "delta_percent_vs_normal": 320, "incidents": ["water_logging"]},
    "G-11": {"density": "very_high", "delta_percent_vs_normal": 280, "incidents": ["water_logging"]},
    "G-13": {"density": "high",      "delta_percent_vs_normal": 110, "incidents": []},
    "F-7":  {"density": "moderate",  "delta_percent_vs_normal": 30,  "incidents": []},
    "DHA Phase 5": {"density": "moderate", "delta_percent_vs_normal": 25, "incidents": []},
}


@router.get("/weather")
async def weather(city: str, time: Optional[str] = None):
    data = WEATHER_DATA.get(city.lower(), {"condition": "Clear", "temp_c": 28, "rainfall_mm": 0, "wind_kmph": 10, "alert": None})
    return {
        "city": city,
        "time": time or datetime.now().isoformat(),
        **data
    }


@router.get("/traffic")
async def traffic(sector: str):
    data = TRAFFIC_DATA.get(sector, {"density": "normal", "delta_percent_vs_normal": 0, "incidents": []})
    return {
        "sector": sector,
        "fetched_at": datetime.now().isoformat(),
        **data
    }
