"""Emergency tickets + area broadcast alerts (Crisis Mode crossover)."""
from datetime import datetime
from fastapi import APIRouter, Request
from utils.ids import emergency_ticket_id

router = APIRouter()


@router.get("/emergency-reports")
async def recent_emergency_reports(sector: str, hours: int = 2, request: Request = None):
    """Mocked recent emergency cluster data for crisis detection."""
    # Deterministic mock — simulate cluster in G-10 / G-11 area
    if sector in ("G-10", "G-11", "G-13"):
        return {
            "sector": sector,
            "hours": hours,
            "reports": [
                {"id": "R001", "ts": datetime.now().isoformat(), "text": "Flooding on main road"},
                {"id": "R002", "ts": datetime.now().isoformat(), "text": "Pani bharta ja raha hai"},
                {"id": "R003", "ts": datetime.now().isoformat(), "text": "Cars stuck"}
            ],
            "cluster_detected": True
        }
    return {"sector": sector, "hours": hours, "reports": [], "cluster_detected": False}


@router.post("/emergency-tickets")
async def create_emergency_ticket(payload: dict, request: Request):
    store = request.app.state.store
    tid = emergency_ticket_id()
    ticket = {
        "ticket_id": tid,
        "priority": payload.get("priority", "P1"),
        "status": "dispatched",
        "type": payload.get("type", "unknown"),
        "city": payload.get("city"),
        "sector": payload.get("sector"),
        "created_at": datetime.now().isoformat(),
        "evidence": payload.get("evidence", []),
        "providers_dispatched": payload.get("providers_dispatched", []),
        "escalated_to_authority": payload.get("escalated_to_authority", False),
        "escalation_recommended": payload.get("escalation_recommended", "")
    }
    store.emergency_tickets[tid] = ticket
    return ticket


@router.post("/alerts/broadcast")
async def broadcast_alert(payload: dict, request: Request):
    store = request.app.state.store
    alert = {
        "city": payload.get("city"),
        "sector": payload.get("sector"),
        "message_ur": payload.get("message_ur"),
        "message_en": payload.get("message_en"),
        "audience_estimated": payload.get("audience_estimated", 500),
        "broadcast_at": datetime.now().isoformat(),
        "status": "broadcast_simulated"
    }
    store.area_alerts.append(alert)
    return alert


@router.get("/emergency-tickets")
async def list_emergency_tickets(request: Request):
    store = request.app.state.store
    return {"tickets": list(store.emergency_tickets.values())}


@router.get("/alerts")
async def list_alerts(request: Request):
    store = request.app.state.store
    return {"alerts": store.area_alerts}
